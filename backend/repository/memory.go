package repository

import (
	"errors"
	"strings"
	"sync"

	"nunoo.co/backend/models"
)

var (
	ErrUserExists      = errors.New("user already exists")
	ErrUserNotFound    = errors.New("user not found")
)

// UserRepository defines storage operations for users.
type UserRepository interface {
	Create(u *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id string) (*models.User, error)
}

// MemoryUserRepo is an in-memory implementation suitable for tests and dev.
type MemoryUserRepo struct {
	mu       sync.RWMutex
	byEmail  map[string]*models.User
	byID     map[string]*models.User
}

func NewMemoryUserRepo() *MemoryUserRepo {
	return &MemoryUserRepo{
		byEmail: make(map[string]*models.User),
		byID:    make(map[string]*models.User),
	}
}

func normalizeEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }

func (r *MemoryUserRepo) Create(u *models.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	e := normalizeEmail(u.Email)
	if _, exists := r.byEmail[e]; exists {
		return ErrUserExists
	}
	r.byEmail[e] = u
	r.byID[u.ID] = u
	return nil
}

func (r *MemoryUserRepo) GetByEmail(email string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byEmail[normalizeEmail(email)]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (r *MemoryUserRepo) GetByID(id string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byID[id]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}
