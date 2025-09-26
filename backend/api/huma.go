package api

import (
	huma "github.com/danielgtaylor/huma/v2"
	humachi "github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
)

// humaServer holds the huma API & router
// We will mount our existing handlers via huma endpoints and serve OpenAPI & Swagger UI.
type humaServer struct {
	API    huma.API
	Router chi.Router
}

func newHumaServer(basePath string) *humaServer {
	cfg := huma.DefaultConfig("Nunoo Backend API", "1.0.0")
	cfg.Servers = []*huma.Server{{URL: basePath}}

	r := chi.NewRouter()
	api := humachi.New(r, cfg)
	return &humaServer{API: api, Router: r}
}
