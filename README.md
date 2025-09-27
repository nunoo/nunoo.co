# nunoo.co

[![Netlify Status](https://api.netlify.com/api/v1/badges/a89b2158-74ec-4c59-b97a-2395cbbd06b4/deploy-status)](https://app.netlify.com/sites/nunoo/deploys)

Personal site and portfolio for Shawn Nunoo. Frontend is a Next.js 14 App Router site deployed on Netlify. This repo also includes an optional Go backend API in `/backend` used for experimentation and demos (auth, OpenAPI, Postgres).

## Tech Stack

- Frontend: Next.js 14 (App Router), React 18, TypeScript
- Styling: Tailwind CSS + `@tailwindcss/typography`
- Content: MDX (with `remark-gfm`) and code highlighting via `rehype-prism`
- Theming: `next-themes` (light/dark)
- Database: Supabase (PostgreSQL, Authentication, Storage)
- Image Processing: `browser-image-compression`, `heic2any`
- RSS: `/feed.xml` generated at runtime
- Deployment: Netlify
- Backend (optional): Go 1.23+, chi, Huma (OpenAPI/Swagger), Postgres or in-memory storage

## Repository Structure

- `src/app` — App Router pages, layouts, and routes (including `feed.xml` and sections like `about`, `projects`, `speaking`, `uses`, `articles`)
- `src/components` — Reusable UI components
- `src/images` — Static images and assets
- `src/lib` — Utilities (e.g., article helpers)
- `styles` — Tailwind and code highlighting styles
- `backend` — Go API service (separate process)

## Requirements

- Node.js 18.18+ and npm
- Optional (backend): Go 1.23+ or Docker

## Getting Started (Frontend)

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root and set your public site URL (used for RSS link generation):

```bash
NEXT_PUBLIC_SITE_URL=https://example.com
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000

Common scripts:

- Lint: `npm run lint`
- Format: `npm run format`
- Build: `npm run build`
- Start (after build): `npm start`

## Backend API (Optional)

A production‑grade Go backend lives in `/backend` with JWT auth, OpenAPI/Swagger docs, and pluggable storage.

Quickstart (in‑memory storage):

```bash
cd backend
export JWT_SECRET=dev-access-secret
export JWT_REFRESH_SECRET=dev-refresh-secret
go run ./main.go
```

Default endpoints:

- Health: http://localhost:8080/health
- Swagger UI: http://localhost:8080/docs
- OpenAPI JSON: http://localhost:8080/openapi.json

Use Postgres by setting `DATABASE_URL` or configuring `backend/config/config.yaml`. See full details and Docker Compose setup in `backend/README.md`. Environment helpers are available: `backend/setup-env.sh` and `backend/setup-env.bat`.

## Deployment

### Automated Deployment (GitHub Actions)

The project uses GitHub Actions for automated deployment:

**Frontend (Next.js)**:

- Deploys to Netlify via GitHub Actions on pushes to `main`
- Builds with Node.js 20 and `npm run build`
- Publishes `.next` directory to Netlify
- Requires `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` secrets

**Backend (Go API)**:

- Builds Docker images on pushes to `main`
- Uses Go 1.25.1 for builds
- Pushes to GitHub Container Registry (`ghcr.io`)
- Tagged with branch name, SHA, and `latest` for main branch

### Manual Deployment

**Frontend**:

- Ensure `NEXT_PUBLIC_SITE_URL` is set in your environment
- Run `npm run build` and deploy `.next` directory
- See `netlify.toml` for Netlify-specific configuration

**Backend**:

- See `backend/README.md` for Docker and manual deployment instructions
- Production deployment currently uses Docker images from GHCR

## Links

- Website: https://nunoo.co
- Projects: https://nunoo.co/projects
- Articles: https://nunoo.co/articles
- RSS: https://nunoo.co/feed.xml
- Backend README: ./backend/README.md
- Local development guide: ./docs/local-development.md
- Issues: ../../issues • Pull Requests: ../../pulls

## License

No license file is included. All rights reserved © 2025 Shawn Nunoo. If you’d like to use any part of this project, please reach out: shawn@nunoo.co
