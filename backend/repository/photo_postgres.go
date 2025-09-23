package repository

import (
	"context"
	"database/sql"

	"nunoo.co/backend/models"
)

type PostgresPhotoRepo struct {
	db *sql.DB
}

func NewPostgresPhotoRepo(db *sql.DB) *PostgresPhotoRepo {
	return &PostgresPhotoRepo{db: db}
}

func (r *PostgresPhotoRepo) Create(ctx context.Context, photo *models.Photo) error {
	query := `
		INSERT INTO photos (id, user_id, file_name, original_url, thumbnail_url, caption, file_size, mime_type, width, height, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.ExecContext(ctx, query,
		photo.ID, photo.UserID, photo.FileName, photo.OriginalURL, photo.ThumbnailURL,
		photo.Caption, photo.FileSize, photo.MimeType, photo.Width, photo.Height,
		photo.CreatedAt, photo.UpdatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrPhotoExists
		}
		return err
	}
	return nil
}

func (r *PostgresPhotoRepo) GetByID(ctx context.Context, id string) (*models.Photo, error) {
	query := `
		SELECT id, user_id, file_name, original_url, thumbnail_url, caption, file_size, mime_type, width, height, created_at, updated_at
		FROM photos WHERE id = $1
	`
	photo := &models.Photo{}
	var thumbnailURL sql.NullString
	var width, height sql.NullInt32

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&photo.ID, &photo.UserID, &photo.FileName, &photo.OriginalURL, &thumbnailURL,
		&photo.Caption, &photo.FileSize, &photo.MimeType, &width, &height,
		&photo.CreatedAt, &photo.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPhotoNotFound
		}
		return nil, err
	}

	if thumbnailURL.Valid {
		photo.ThumbnailURL = thumbnailURL.String
	}
	if width.Valid {
		photo.Width = int(width.Int32)
	}
	if height.Valid {
		photo.Height = int(height.Int32)
	}

	return photo, nil
}

func (r *PostgresPhotoRepo) GetByUserID(ctx context.Context, userID string, page, limit int) ([]models.Photo, int64, error) {
	countQuery := `SELECT COUNT(*) FROM photos WHERE user_id = $1`
	var totalCount int64
	err := r.db.QueryRowContext(ctx, countQuery, userID).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `
		SELECT id, user_id, file_name, original_url, thumbnail_url, caption, file_size, mime_type, width, height, created_at, updated_at
		FROM photos 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var photos []models.Photo
	for rows.Next() {
		photo := models.Photo{}
		var thumbnailURL sql.NullString
		var width, height sql.NullInt32

		err := rows.Scan(
			&photo.ID, &photo.UserID, &photo.FileName, &photo.OriginalURL, &thumbnailURL,
			&photo.Caption, &photo.FileSize, &photo.MimeType, &width, &height,
			&photo.CreatedAt, &photo.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		if thumbnailURL.Valid {
			photo.ThumbnailURL = thumbnailURL.String
		}
		if width.Valid {
			photo.Width = int(width.Int32)
		}
		if height.Valid {
			photo.Height = int(height.Int32)
		}

		photos = append(photos, photo)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return photos, totalCount, nil
}

func (r *PostgresPhotoRepo) Update(ctx context.Context, photo *models.Photo) error {
	query := `
		UPDATE photos 
		SET file_name = $2, original_url = $3, thumbnail_url = $4, caption = $5, 
		    file_size = $6, mime_type = $7, width = $8, height = $9, updated_at = $10
		WHERE id = $1
	`
	result, err := r.db.ExecContext(ctx, query,
		photo.ID, photo.FileName, photo.OriginalURL, photo.ThumbnailURL,
		photo.Caption, photo.FileSize, photo.MimeType, photo.Width, photo.Height,
		photo.UpdatedAt)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrPhotoNotFound
	}

	return nil
}

func (r *PostgresPhotoRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM photos WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrPhotoNotFound
	}

	return nil
}

