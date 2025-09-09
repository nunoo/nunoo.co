package api

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/argon2"
	"nunoo.co/backend/api/routes"
	"nunoo.co/backend/config"
	"nunoo.co/backend/handlers"
	custommiddleware "nunoo.co/backend/middleware"
	"nunoo.co/backend/migrations"
	"nunoo.co/backend/models"
	"nunoo.co/backend/repository"
)

// Server encapsulates router and dependencies.
type Server struct {
	r             *chi.Mux
	cfg           *config.Config
	users         repository.UserRepository
	validate      *validator.Validate
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
	healthChecker *handlers.HealthChecker
}

// ctxKey is the private context key type for user injection
type ctxKey struct{}

// NewServerForTesting constructs a fully-wired HTTP handler for tests and dev.
func NewServerForTesting(cfg *config.Config) http.Handler {
	// Fallback to env secrets if config not wired
	accessSecret := []byte(cfg.JWT.Secret)
	refreshSecret := []byte(cfg.JWT.RefreshSecret)
	if len(accessSecret) == 0 {
		accessSecret = []byte(os.Getenv("JWT_SECRET"))
	}
	if len(refreshSecret) == 0 {
		refreshSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))
	}
	if len(accessSecret) == 0 || len(refreshSecret) == 0 {
		// Generate ephemeral secrets; tests set env so this is a safeguard
		accessSecret = randomBytes(32)
		refreshSecret = randomBytes(32)
	}

	accessTTL := cfg.JWT.TokenExpiry
	refreshTTL := cfg.JWT.RefreshExpiry
	if accessTTL == 0 {
		accessTTL = 15 * time.Minute
	}
	if refreshTTL == 0 {
		refreshTTL = 72 * time.Hour
	}

	s := &Server{
		r:             chi.NewRouter(),
		cfg:           cfg,
		users:         repository.NewMemoryUserRepo(),
		validate:      validator.New(),
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
		healthChecker: handlers.NewHealthChecker(nil),
	}
	s.routes()
	return s.r
}

// NewServer is the production-ready constructor. It attempts to connect to Postgres if configured;
// otherwise, it falls back to in-memory storage.
func NewServer(cfg *config.Config) http.Handler {
	// Start with the testing server wiring (in-memory)
	h := NewServerForTesting(cfg)

	// Try to use Postgres if DATABASE_URL or database section is configured
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" && cfg.Database.Host != "" && cfg.Database.DBName != "" {
		// Build DSN from parts
		dsn = buildPostgresDSN(cfg)
	}
	if dsn == "" {
		return h
	}

	// Connect and swap repository
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return h
	}
	// Optimized connection pool settings for 2025 best practices
	db.SetMaxOpenConns(25)                  // Increased for better concurrency
	db.SetMaxIdleConns(10)                  // Higher idle connections for faster response
	db.SetConnMaxLifetime(30 * time.Minute) // Shorter lifetime for better resource management
	db.SetConnMaxIdleTime(5 * time.Minute)  // Added idle timeout to prevent stale connections

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return h
	}
	// Run migrations
	_ = migrations.Apply(db, "./migrations")

	// Swap repository using reflection-free approach: rebuild server with same config but Postgres repo
	s := &Server{
		r:             chi.NewRouter(),
		cfg:           cfg,
		users:         repository.NewPostgresUserRepo(db),
		validate:      validator.New(),
		accessSecret:  []byte(cfg.JWT.Secret),
		refreshSecret: []byte(cfg.JWT.RefreshSecret),
		accessTTL:     cfg.JWT.TokenExpiry,
		refreshTTL:    cfg.JWT.RefreshExpiry,
		healthChecker: handlers.NewHealthChecker(db),
	}
	if len(s.accessSecret) == 0 {
		s.accessSecret = []byte(os.Getenv("JWT_SECRET"))
	}
	if len(s.refreshSecret) == 0 {
		s.refreshSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))
	}
	if s.accessTTL == 0 {
		s.accessTTL = 15 * time.Minute
	}
	if s.refreshTTL == 0 {
		s.refreshTTL = 72 * time.Hour
	}

	s.routes()
	return s.r
}

func (s *Server) routes() {
	// Core middleware
	s.r.Use(middleware.RequestID)
	s.r.Use(middleware.RealIP)
	s.r.Use(middleware.Logger)
	s.r.Use(middleware.Recoverer)

	// Performance and security middleware
	rateLimiter := custommiddleware.NewRateLimiter(100, 20) // 100 requests per second with burst of 20
	s.r.Use(rateLimiter.Limit)
	s.r.Use(custommiddleware.Timeout(30 * time.Second)) // 30 second timeout for all requests
	s.r.Use(custommiddleware.SecurityHeaders)           // Security headers
	s.r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://localhost:*"}, // More restrictive for production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours cache for preflight requests
	}))

	routes.RegisterHealthRoutes(s.r, s.healthChecker.HealthCheck)

	routes.RegisterAuthRoutes(s.r, routes.AuthHandlers{
		Register: s.handleRegister,
		Login:    s.handleLogin,
		Refresh:  s.handleRefresh,
	})

	routes.RegisterProtectedRoutes(s.r, routes.Protected{
		Me:             s.handleMe,
		AuthMiddleware: s.authMiddleware,
	})

	// Mount Huma for OpenAPI + Swagger over the router
	s.r.Mount("/", s.mountHuma())
}

// Request/response types

type registerRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := s.validate.Struct(req); err != nil {
		writeError(w, http.StatusBadRequest, "validation failed")
		return
	}
	// Check if exists
	if _, err := s.users.GetByEmail(r.Context(), req.Email); err == nil {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	id := newID()
	hash, err := hashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}
	u := &models.User{ID: id, Email: strings.ToLower(strings.TrimSpace(req.Email)), PasswordHash: hash, CreatedAt: time.Now()}
	if err := s.users.Create(r.Context(), u); err != nil {
		if errors.Is(err, repository.ErrUserExists) {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"user": map[string]any{"id": u.ID, "email": u.Email}})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "validation failed")
		return
	}
	u, err := s.users.GetByEmail(r.Context(), req.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !verifyPassword(u.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	access, exp, err := s.issueAccessToken(u)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}
	refresh, _, err := s.issueRefreshToken(u)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}
	writeJSON(w, http.StatusOK, tokenResponse{AccessToken: access, RefreshToken: refresh, TokenType: "Bearer", ExpiresIn: int64(exp.Seconds())})
}

func (s *Server) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	// Validate refresh token
	claims := &jwt.RegisteredClaims{}
	tok, err := jwt.ParseWithClaims(body.RefreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.refreshSecret, nil
	})
	if err != nil || tok == nil || !tok.Valid || claims.Subject == "" {
		writeError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}
	u, err := s.users.GetByID(r.Context(), claims.Subject)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}
	access, exp, err := s.issueAccessToken(u)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}
	// Optionally rotate refresh; keep same for simplicity here
	writeJSON(w, http.StatusOK, tokenResponse{AccessToken: access, RefreshToken: body.RefreshToken, TokenType: "Bearer", ExpiresIn: int64(exp.Seconds())})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	val := r.Context().Value(ctxKey{})
	u, _ := val.(*models.User)
	if u == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": map[string]any{"id": u.ID, "email": u.Email}})
}

// authMiddleware validates the Bearer token and loads the user
func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authz := r.Header.Get("Authorization")
		if authz == "" || !strings.HasPrefix(authz, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}
		tokStr := strings.TrimSpace(strings.TrimPrefix(authz, "Bearer "))
		claims := &jwt.RegisteredClaims{}
		tok, err := jwt.ParseWithClaims(tokStr, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return s.accessSecret, nil
		})
		if err != nil || tok == nil || !tok.Valid || claims.Subject == "" {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		u, err := s.users.GetByID(r.Context(), claims.Subject)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := context.WithValue(r.Context(), ctxKey{}, u)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Helpers

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func randomBytes(n int) []byte {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return b
}

func buildPostgresDSN(cfg *config.Config) string {
	user := cfg.Database.User
	pass := cfg.Database.Password
	host := cfg.Database.Host
	port := cfg.Database.Port
	db := cfg.Database.DBName
	ssl := cfg.Database.SSLMode
	if ssl == "" {
		ssl = "disable"
	}
	pu := url.UserPassword(user, pass)
	return fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s", pu.String(), host, port, db, ssl)
}

func newID() string {
	b := randomBytes(16)
	return "usr_" + base64.RawURLEncoding.EncodeToString(b)
}

// Password hashing (argon2id)

func hashPassword(pw string) (string, error) {
	salt := randomBytes(16)
	// Production-ready Argon2id parameters (2025 recommendations)
	// Memory: 128MB, Time: 3 iterations, Parallelism: 4 threads
	const (
		memory      = 128 * 1024 // 128MB
		iterations  = 3
		parallelism = 4
		keyLen      = 32
	)
	h := argon2.IDKey([]byte(pw), salt, iterations, memory, parallelism, keyLen)
	return fmt.Sprintf("argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", memory, iterations, parallelism,
		base64.RawURLEncoding.EncodeToString(salt), base64.RawURLEncoding.EncodeToString(h)), nil
}

func verifyPassword(stored, pw string) bool {
	parts := strings.Split(stored, "$")
	if len(parts) != 5 {
		return false
	}

	// Parse parameters from stored hash
	var memory, iterations, parallelism int
	if _, err := fmt.Sscanf(parts[2], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil {
		return false
	}

	salt, err := base64.RawURLEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	expected, err := base64.RawURLEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	h := argon2.IDKey([]byte(pw), salt, uint32(iterations), uint32(memory), uint8(parallelism), uint32(len(expected)))
	return constantTimeEqual(expected, h)
}

func constantTimeEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	var v byte
	for i := range a {
		v |= a[i] ^ b[i]
	}
	return v == 0
}

// JWT issuance

func (s *Server) issueAccessToken(u *models.User) (string, time.Duration, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   u.ID,
		ID:        newJTI(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := t.SignedString(s.accessSecret)
	if err != nil {
		return "", 0, err
	}
	return signed, s.accessTTL, nil
}

func (s *Server) issueRefreshToken(u *models.User) (string, time.Duration, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   u.ID,
		ID:        newJTI(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.refreshTTL)),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := t.SignedString(s.refreshSecret)
	if err != nil {
		return "", 0, err
	}
	return signed, s.refreshTTL, nil
}

func newJTI() string {
	b := randomBytes(12)
	return base64.RawURLEncoding.EncodeToString(b)
}
