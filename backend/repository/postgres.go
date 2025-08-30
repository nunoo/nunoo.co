package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"nunoo.co/backend/models"
)

// PostgresUserRepo implements UserRepository using PostgreSQL via database/sql
// Use DSN like postgres://user:pass@host:port/dbname?sslmode=disable
// The provided *sql.DB should be configured with sensible limits.
type PostgresUserRepo struct {
	db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo { return &PostgresUserRepo{db: db} }

func (r *PostgresUserRepo) Create(u *models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	q := `INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)`
	_, err := r.db.ExecContext(ctx, q, u.ID, NormalizeEmail(u.Email), u.PasswordHash, u.CreatedAt.UTC())
	if err != nil {
		// Unique violation code for Postgres is 23505; but to avoid importing pgx errors specifics, map any duplicate email error by string contains
		if isUniqueViolation(err) {
			return ErrUserExists
		}
		return err
	}
	return nil
}

func (r *PostgresUserRepo) GetByEmail(email string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	q := `SELECT id, email, password_hash, created_at FROM users WHERE email=$1`
	row := r.db.QueryRowContext(ctx, q, NormalizeEmail(email))
	u := new(models.User)
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *PostgresUserRepo) GetByID(id string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	q := `SELECT id, email, password_hash, created_at FROM users WHERE id=$1`
	row := r.db.QueryRowContext(ctx, q, id)
	u := new(models.User)
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

func isUniqueViolation(err error) bool {
	// fallback detection without importing PG-specific error types
	// Error message typically contains "duplicate key value violates unique constraint"
	return err != nil && (strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint"))
}
