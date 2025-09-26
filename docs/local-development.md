# Local Development

This guide covers day-to-day development for the Nunoo site (Next.js frontend) and the optional Go backend API.

## Prerequisites

- Node.js 18.18+ and npm
- Optional backend: Go 1.23+ (toolchain 1.24.x supported), Docker (for Postgres)

## Frontend (Next.js)

### Install and run

```bash
npm install
npm run dev
# open http://localhost:3000
```

Set `NEXT_PUBLIC_SITE_URL` in `.env.local` to your site URL (used for correct RSS links). For local dev, `http://localhost:3000` is fine.

```bash
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
```

### Common tasks

- Lint: `npm run lint`
- Format: `npm run format` (Prettier + Tailwind plugin)
- Build: `npm run build` (includes type checking)
- Start prod build: `npm start`

### Content and MDX

- Articles live under `src/app/articles/<slug>/page.mdx`.
- Export an `article` object with `title`, `description`, `author`, `date` for listing metadata.
- Code fences are highlighted via `rehype-prism`.
- Add images under `src/images` (or nested folders) and import them in MDX as needed.

### UI and styling

- Tailwind CSS with `@tailwindcss/typography` for article prose.
- Dark mode via `next-themes`. Prefer semantic classes and reuse components in `src/components`.

### Best practices

- Keep pages in `src/app`, colocate simple components when appropriate; reusable components belong in `src/components`.
- Prefer server components by default; use client components only when needed.
- Run `npm run format` before opening PRs. Keep diffs small and focused.

## Backend (Go, optional)

The backend is a separate service in `backend/` providing JWT auth and OpenAPI/Swagger docs. It defaults to in-memory storage but can use Postgres.

### Quickstart (in-memory)

```bash
cd backend
export JWT_SECRET=dev-access-secret
export JWT_REFRESH_SECRET=dev-refresh-secret
go run ./main.go
# API: http://localhost:8080
# Docs: http://localhost:8080/docs
```

### With Postgres (Docker Compose)

```bash
cd backend
cp .env.example .env   # set strong secrets
docker compose up --build
# API: http://localhost:8080, Swagger: /docs
```

Compose sets `DATABASE_URL` and sane defaults; override secrets in `.env`.

### Environment helpers

- `backend/setup-env.sh` (macOS/Linux) and `backend/setup-env.bat` (Windows) generate strong JWT secrets and a local DB password, and create a `.env`.

### Migrations and storage

- SQL migrations live in `backend/migrations`.
- When `DATABASE_URL` is set and reachable, the server applies migrations at startup and uses Postgres; otherwise it falls back to in-memory storage.

### Testing

```bash
cd backend
go test ./...
```

Integration tests cover auth flows using in-memory storage.

### Security and performance defaults

- Argon2id password hashing with production-ready parameters.
- Rate limiting and request timeouts enabled by default.
- Security headers and CORS with localhost allowed in dev.

## Running both services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

CORS is configured to allow `http://localhost:*`. If the frontend calls the backend, use absolute URLs or a proxy as needed. This project does not couple the frontend to the backend by default.

## Developer workflow tips

- Prefer small, incremental changes. Run `npm run lint` and `npm run format` before opening a PR.
- Keep secrets out of git. `.env` files are ignored by default; rotate secrets regularly.
- For RSS correctness in builds, set `NEXT_PUBLIC_SITE_URL` in Netlify (or your host) to the public URL.
- If Browserslist warnings appear during build, run: `npx update-browserslist-db@latest`.

## Troubleshooting

- Backend failing to connect to DB: verify `DATABASE_URL` and network access; the server will fall back to in-memory if Postgres is unavailable.
- JWT errors: ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set consistently.
- Huma version issues: see `backend/README.md` Troubleshooting for pinning a known-good tag.
