package models

import "time"

// User represents a user record in the system.
// For now, we use an in-memory store; replace with a real DB repository later.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}
