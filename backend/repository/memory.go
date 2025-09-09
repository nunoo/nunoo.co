package repository

import (
	"context"
	"errors"
	"strings"
	"sync"

	"nunoo.co/backend/models"
)

var (
	ErrUserExists   = errors.New("user already exists")
	ErrUserNotFound = errors.New("user not found")
)

// UserRepository defines storage operations for users.
type UserRepository interface {
	Create(ctx context.Context, u *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
}

// MemoryUserRepo is an in-memory implementation suitable for tests and dev.
type MemoryUserRepo struct {
	mu      sync.RWMutex
	byEmail map[string]*models.User
	byID    map[string]*models.User
}

func NewMemoryUserRepo() *MemoryUserRepo {
	return &MemoryUserRepo{
		byEmail: make(map[string]*models.User),
		byID:    make(map[string]*models.User),
	}
}

func normalizeEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }

func (r *MemoryUserRepo) Create(ctx context.Context, u *models.User) error {
	// Check if context is cancelled
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

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

func (r *MemoryUserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	// Check if context is cancelled
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byEmail[normalizeEmail(email)]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (r *MemoryUserRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	// Check if context is cancelled
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byID[id]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}
