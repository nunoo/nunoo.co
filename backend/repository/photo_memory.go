package repository

import (
	"context"
	"sort"
	"sync"

	"nunoo.co/backend/models"
)

type MemoryPhotoRepo struct {
	mu     sync.RWMutex
	photos map[string]*models.Photo
}

func NewMemoryPhotoRepo() *MemoryPhotoRepo {
	return &MemoryPhotoRepo{
		photos: make(map[string]*models.Photo),
	}
}

func (r *MemoryPhotoRepo) Create(ctx context.Context, photo *models.Photo) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.photos[photo.ID]; exists {
		return ErrPhotoExists
	}

	r.photos[photo.ID] = photo
	return nil
}

func (r *MemoryPhotoRepo) GetByID(ctx context.Context, id string) (*models.Photo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	photo, exists := r.photos[id]
	if !exists {
		return nil, ErrPhotoNotFound
	}

	return photo, nil
}

func (r *MemoryPhotoRepo) GetByUserID(ctx context.Context, userID string, page, limit int) ([]models.Photo, int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var userPhotos []models.Photo
	for _, photo := range r.photos {
		if photo.UserID == userID {
			userPhotos = append(userPhotos, *photo)
		}
	}

	sort.Slice(userPhotos, func(i, j int) bool {
		return userPhotos[i].CreatedAt.After(userPhotos[j].CreatedAt)
	})

	totalCount := int64(len(userPhotos))
	offset := (page - 1) * limit

	if offset >= len(userPhotos) {
		return []models.Photo{}, totalCount, nil
	}

	end := offset + limit
	if end > len(userPhotos) {
		end = len(userPhotos)
	}

	return userPhotos[offset:end], totalCount, nil
}

func (r *MemoryPhotoRepo) Update(ctx context.Context, photo *models.Photo) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.photos[photo.ID]; !exists {
		return ErrPhotoNotFound
	}

	r.photos[photo.ID] = photo
	return nil
}

func (r *MemoryPhotoRepo) GetAll(ctx context.Context, page, limit int) ([]models.Photo, int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var allPhotos []models.Photo
	for _, photo := range r.photos {
		allPhotos = append(allPhotos, *photo)
	}

	sort.Slice(allPhotos, func(i, j int) bool {
		return allPhotos[i].CreatedAt.After(allPhotos[j].CreatedAt)
	})

	totalCount := int64(len(allPhotos))
	offset := (page - 1) * limit

	if offset >= len(allPhotos) {
		return []models.Photo{}, totalCount, nil
	}

	end := offset + limit
	if end > len(allPhotos) {
		end = len(allPhotos)
	}

	return allPhotos[offset:end], totalCount, nil
}

func (r *MemoryPhotoRepo) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.photos[id]; !exists {
		return ErrPhotoNotFound
	}

	delete(r.photos, id)
	return nil
}
