package api

import (
	"context"
	"encoding/json"
	"net/http"

	huma "github.com/danielgtaylor/huma/v2"
)

// Public models for Huma operations
type RegisterInput struct {
	Body struct {
		Email    string `json:"email" example:"user@example.com"`
		Password string `json:"password" format:"password"`
	}
}

type LoginInput = RegisterInput

type RefreshInput struct {
	Body struct {
		RefreshToken string `json:"refresh_token"`
	}
}

type UserEnvelope struct {
	User struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type HealthResponse struct {
	Status int `json:"status"`
}

// Huma router setup integrating existing chi routes and exposing OpenAPI & Swagger UI.
func (s *Server) mountHuma() http.Handler {
	hs := newHumaServer("/api")

	// API metadata
	hs.API.OpenAPI().Info.Description = "Nunoo Backend API with Authentication"

	// Register
	huma.Post[RegisterInput, UserEnvelope](
		hs.API,
		"/auth/register",
		func(ctx context.Context, in *RegisterInput) (*UserEnvelope, error) {
			// Create a mock request for the existing handler
			req, _ := http.NewRequest("POST", "/auth/register", nil)
			responseWriter := &responseWriter{rw: &mockResponseWriter{}}
			s.handleRegister(responseWriter, req)
			return responseWriter.toUserEnvelope(), responseWriter.err
		},
	)

	// Login
	huma.Post[LoginInput, TokenResponse](
		hs.API,
		"/auth/login",
		func(ctx context.Context, in *LoginInput) (*TokenResponse, error) {
			// Create a mock request for the existing handler
			req, _ := http.NewRequest("POST", "/auth/login", nil)
			responseWriter := &responseWriter{rw: &mockResponseWriter{}}
			s.handleLogin(responseWriter, req)
			return responseWriter.toTokenResponse(), responseWriter.err
		},
	)

	// Refresh
	huma.Post[RefreshInput, TokenResponse](
		hs.API,
		"/auth/refresh",
		func(ctx context.Context, in *RefreshInput) (*TokenResponse, error) {
			// Create a mock request for the existing handler
			req, _ := http.NewRequest("POST", "/auth/refresh", nil)
			responseWriter := &responseWriter{rw: &mockResponseWriter{}}
			s.handleRefresh(responseWriter, req)
			return responseWriter.toTokenResponse(), responseWriter.err
		},
	)

	// Me (protected) — reuse auth middleware
	huma.Get[struct{}, UserEnvelope](
		hs.API,
		"/me",
		func(ctx context.Context, in *struct{}) (*UserEnvelope, error) {
			// Create a mock request for the existing handler
			req, _ := http.NewRequest("GET", "/me", nil)
			responseWriter := &responseWriter{rw: &mockResponseWriter{}}
			next := http.HandlerFunc(func(wr http.ResponseWriter, req *http.Request) { s.handleMe(wr, req) })
			s.authMiddleware(next).ServeHTTP(responseWriter, req)
			return responseWriter.toUserEnvelope(), responseWriter.err
		},
	)

	// Health
	huma.Get[struct{}, HealthResponse](
		hs.API,
		"/health",
		func(ctx context.Context, in *struct{}) (*HealthResponse, error) {
			return &HealthResponse{Status: 200}, nil
		},
	)

	// Return Huma router (serves /openapi.json and /docs)
	return hs.Router
}

// mockResponseWriter is a minimal implementation for Huma handlers
type mockResponseWriter struct{}

func (w *mockResponseWriter) Header() http.Header         { return make(http.Header) }
func (w *mockResponseWriter) WriteHeader(statusCode int)  {}
func (w *mockResponseWriter) Write(b []byte) (int, error) { return len(b), nil }

// responseWriter captures handler JSON output for conversion to typed Huma responses.
type responseWriter struct {
	rw   http.ResponseWriter
	buf  []byte
	code int
	err  error
}

func (w *responseWriter) Header() http.Header        { return w.rw.Header() }
func (w *responseWriter) WriteHeader(statusCode int) { w.code = statusCode }
func (w *responseWriter) Write(b []byte) (int, error) {
	w.buf = append(w.buf, b...)
	return len(b), nil
}

func (w *responseWriter) toUserEnvelope() *UserEnvelope {
	if w.err != nil || w.code >= 400 {
		return nil
	}
	var out UserEnvelope
	_ = json.Unmarshal(w.buf, &out)
	return &out
}

func (w *responseWriter) toTokenResponse() *TokenResponse {
	if w.err != nil || w.code >= 400 {
		return nil
	}
	var out TokenResponse
	_ = json.Unmarshal(w.buf, &out)
	return &out
}
