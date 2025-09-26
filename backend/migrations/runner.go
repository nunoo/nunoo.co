package migrations

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"time"

	"go.uber.org/zap"
)

// Apply runs .sql files in dir in lexicographic order, once each.
// It creates a schema_migrations table to track applied files.
func Apply(db *sql.DB, dir string) error {
	if err := ensureTable(db); err != nil {
		return err
	}
	applied, err := loadApplied(db)
	if err != nil {
		return err
	}
	entries := []string{}
	err = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if filepath.Ext(d.Name()) == ".sql" {
			entries = append(entries, path)
		}
		return nil
	})
	if err != nil {
		return err
	}
	sort.Strings(entries)
	for _, p := range entries {
		name := filepath.Base(p)
		if applied[name] {
			continue
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		_, execErr := db.ExecContext(ctx, string(b))
		cancel()
		if execErr != nil {
			return fmt.Errorf("migration %s failed: %w", name, execErr)
		}
		if err := markApplied(db, name); err != nil {
			return err
		}
	}
	return nil
}

func ensureTable(db *sql.DB) error {
	q := `CREATE TABLE IF NOT EXISTS schema_migrations (
		name TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`
	_, err := db.Exec(q)
	return err
}

func loadApplied(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query(`SELECT name FROM schema_migrations`)
	if err != nil {
		return map[string]bool{}, nil
	} // table may not exist yet; ignore
	defer func() {
		if err := rows.Close(); err != nil {
			fmt.Println("failed to close rows", zap.Error(err))
		}
	}()
	m := map[string]bool{}
	for rows.Next() {
		var n string
		if err := rows.Scan(&n); err != nil {
			return nil, err
		}
		m[n] = true
	}
	return m, rows.Err()
}

func markApplied(db *sql.DB, name string) error {
	_, err := db.Exec(`INSERT INTO schema_migrations (name, applied_at) VALUES ($1, now())`, name)
	return err
}
