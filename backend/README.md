# Nunoo Backend API

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Postgres](https://img.shields.io/badge/Postgres-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Production-grade Go backend with authentication, OpenAPI docs (Huma + Swagger UI), and pluggable storage (in‑memory for dev/tests, Postgres for prod).

---

## Table of Contents
- [Nunoo Backend API](#nunoo-backend-api)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Quickstart (Development)](#quickstart-development)
  - [Run with Docker Compose](#run-with-docker-compose)
  - [Configuration](#configuration)
  - [API Documentation](#api-documentation)
  - [Auth Flow](#auth-flow)
  - [Migrations](#migrations)
  - [Testing](#testing)
  - [Troubleshooting](#troubleshooting)

---

## Features
- ⚙️ Chi router, CORS, structured logging, graceful shutdown
- 🔐 Auth: register, login, refresh, me
- 🪪 JWT (access + refresh), separate secrets & expiries
- 🔑 Argon2id password hashing (fast params for tests; tune for prod)
- 🧱 Storage: in-memory (dev/tests) and Postgres (prod)
- 🗂️ Simple SQL migration runner (applies `./migrations` on startup when DB is configured)
- 📘 OpenAPI + Swagger UI via Huma
- 🚀 Modern Go toolchain (1.23+) — container builds with 1.22

---

## Architecture
```
+----------------------+       +------------------+
|        Client        |       |   Swagger UI     |
|  (Browser / Mobile)  |<----->|   /docs          |
+----------+-----------+       +---------+--------+
           |                               |
           v                               v
      +----+---------------------------------------+
      |            Nunoo Backend API               |
      |  chi router + middlewares (CORS, recover)  |
      |  Huma (OpenAPI/Swagger at /openapi.json)   |
      +--------------------+-----------------------+
                           |
                 +---------+----------+
                 |   Auth Handlers    |
                 |  (register/login   |
                 |   refresh/me)      |
                 +---------+----------+
                           |
               +-----------+-----------+
               |       Repository      |
               |  (InMemory / Postgres)|
               +-----------+-----------+
                           |
                     +-----+-----+
                     |  Postgres |
                     +-----------+
```

---

## Quickstart (Development)
Prerequisites:
- Go 1.23+ (or use Docker)

Run tests:
```bash
go test ./...
```

Run the server (in-memory storage by default):
```bash
export JWT_SECRET=dev-access-secret
export JWT_REFRESH_SECRET=dev-refresh-secret
# Optionally set SERVER_PORT, etc. See Configuration below.
go run ./main.go
```

Server defaults to port 8080:
- Health: http://localhost:8080/health
- Swagger UI: http://localhost:8080/docs
- OpenAPI JSON: http://localhost:8080/openapi.json

Use a database by setting `DATABASE_URL`:
```bash
export DATABASE_URL='postgres://user:pass@localhost:5432/db?sslmode=disable'
export JWT_SECRET='your-strong-access-secret'
export JWT_REFRESH_SECRET='your-strong-refresh-secret'
go run ./main.go
```

---

## Run with Docker Compose
```bash
cp .env.example .env  # set strong secrets first
docker compose up --build
```
- App: http://localhost:8080
- Swagger UI: http://localhost:8080/docs
- OpenAPI: http://localhost:8080/openapi.json
- Postgres: running as service `db` (port 5432 exposed by default in compose)

Compose sets:
- `DATABASE_URL=postgres://app:app@db:5432/app?sslmode=disable`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (override in `.env`!)

---

## Configuration
Configuration comes from `config/config.yaml` (or `.template`) and environment variables. Env vars override file values. Viper maps dots to underscores (e.g., `server.port` -> `SERVER_PORT`).

Required in production:
- `JWT_SECRET`: HMAC secret for access tokens
- `JWT_REFRESH_SECRET`: HMAC secret for refresh tokens

Common env vars:
- `SERVER_PORT` (default: `8080`)
- `SERVER_READTIMEOUT` (default: `15s`)
- `SERVER_WRITETIMEOUT` (default: `15s`)
- `SERVER_IDLETIMEOUT` (default: `60s`)
- `DATABASE_URL` (e.g., `postgres://user:pass@host:5432/db?sslmode=disable`)
- Or DB parts via config file: host, port, user, password, dbname, sslmode
- `JWT_TOKENEXPIRY` (default: `15m`)
- `JWT_REFRESHEXPIRY` (default: `72h`)

---

## API Documentation
- Swagger UI: http://localhost:8080/docs
- OpenAPI JSON: http://localhost:8080/openapi.json

Endpoints:
- `POST /auth/register` — `{ email, password }` -> `201 { user: { id, email } }`
- `POST /auth/login` — `{ email, password }` -> `200 { access_token, refresh_token, token_type, expires_in }`
- `POST /auth/refresh` — `{ refresh_token }` -> `200 { access_token, refresh_token, token_type, expires_in }`
- `GET /me` — `Authorization: Bearer <access>` -> `200 { user: { id, email } }`
- `GET /health` -> `200 { status: ok }`

cURL examples:
```bash
# Register
curl -sS -X POST http://localhost:8080/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Str0ngP@ssw0rd!"}'

# Login
curl -sS -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Str0ngP@ssw0rd!"}'
# -> save access_token & refresh_token

# Me (protected)
curl -sS http://localhost:8080/me -H "Authorization: Bearer $ACCESS_TOKEN"

# Refresh
curl -sS -X POST http://localhost:8080/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

---

## Auth Flow
- Register creates a user and returns the user envelope.
- Login returns a short-lived access token and a longer-lived refresh token.
- Use access token for `Authorization: Bearer <token>` on protected routes.
- Refresh exchanges a valid refresh token for a new access token.

Notes:
- Access and refresh secrets are independent; set both in production.
- Current refresh is stateless; consider rotation/revocation for higher security.

---

## Migrations
- On startup, if a DB connection is configured (via `DATABASE_URL` or config), the server applies `./migrations/*.sql` in lexical order.
- The runner stores applied filenames in `schema_migrations`.
- If migration fails, the server continues (useful for dev). Ensure migrations are healthy in production.

---

## Testing
```bash
go test ./...
```
Tests include end‑to‑end auth flows using an in‑memory repository.

---

## Troubleshooting
- Huma module resolution:
  - If `go mod tidy` reports an unknown tag for `github.com/danielgtaylor/huma/v2`, pin a known good version:
    ```bash
    go get github.com/danielgtaylor/huma/v2@v2.22.0
    go mod tidy
    ```
  - If behind a proxy: `export GOPROXY=https://proxy.golang.org,direct`

- Tokens invalid:
  - Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set consistently between login and subsequent requests.

- DB connection issues:
  - Verify `DATABASE_URL` and that Postgres is reachable. In dev, the server will fall back to in‑memory storage if it cannot connect.

---
