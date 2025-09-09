package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type HealthChecker struct {
	db *sql.DB
}

type HealthResponse struct {
	Status   string            `json:"status"`
	Services map[string]string `json:"services"`
	Version  string            `json:"version"`
}

func NewHealthChecker(db *sql.DB) *HealthChecker {
	return &HealthChecker{db: db}
}

func (h *HealthChecker) HealthCheck(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:   "healthy",
		Services: make(map[string]string),
		Version:  "1.0.0", // This could be set from build flags
	}

	// Check database connectivity if available
	if h.db != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := h.db.PingContext(ctx); err != nil {
			response.Status = "unhealthy"
			response.Services["database"] = "down"
		} else {
			response.Services["database"] = "up"
		}
	} else {
		response.Services["database"] = "not_configured"
	}

	w.Header().Set("Content-Type", "application/json")
	if response.Status == "unhealthy" {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	json.NewEncoder(w).Encode(response)
}
