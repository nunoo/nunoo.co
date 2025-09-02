// Package routes contains modular route registration helpers for the API.
package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// AuthHandlers bundles auth-related handler functions.
type AuthHandlers struct {
	Register http.HandlerFunc
	Login    http.HandlerFunc
	Refresh  http.HandlerFunc
}

// Protected bundles protected route handlers and middleware.
type Protected struct {
	Me             http.HandlerFunc
	AuthMiddleware func(http.Handler) http.Handler
}

// RegisterHealthRoutes registers the health endpoint.
func RegisterHealthRoutes(r chi.Router, healthHandler http.HandlerFunc) {
	r.Get("/health", healthHandler)
}

// RegisterAuthRoutes registers the /auth endpoints.
func RegisterAuthRoutes(r chi.Router, h AuthHandlers) {
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.Refresh)
	})
}

// RegisterProtectedRoutes registers protected endpoints under auth middleware.
func RegisterProtectedRoutes(r chi.Router, p Protected) {
	r.Group(func(r chi.Router) {
		r.Use(p.AuthMiddleware)
		r.Get("/me", p.Me)
	})
}
