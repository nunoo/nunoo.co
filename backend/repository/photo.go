package repository

import (
	"context"
	"errors"

	"nunoo.co/backend/models"
)

var (
	ErrPhotoNotFound = errors.New("photo not found")
	ErrPhotoExists   = errors.New("photo already exists")
)

type PhotoRepository interface {
	Create(ctx context.Context, photo *models.Photo) error
	GetByID(ctx context.Context, id string) (*models.Photo, error)
	GetByUserID(ctx context.Context, userID string, page, limit int) ([]models.Photo, int64, error)
	GetAll(ctx context.Context, page, limit int) ([]models.Photo, int64, error)
	Update(ctx context.Context, photo *models.Photo) error
	Delete(ctx context.Context, id string) error
}