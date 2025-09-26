# Makefile for nunoo.co project
# Run 'make help' to see all available commands

.PHONY: help
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==================== Development Commands ====================

.PHONY: install
install: ## Install all dependencies (frontend + backend)
	npm install
	cd backend && go mod download

.PHONY: dev
dev: ## Start BOTH frontend and backend development servers
	@echo "Starting frontend and backend servers..."
	@make -j 2 dev-frontend dev-backend

.PHONY: dev-frontend
dev-frontend: ## Start frontend development server only
	npm run dev

.PHONY: dev-backend
dev-backend: ## Start backend development server only
	cd backend && go run .

.PHONY: dev-parallel
dev-parallel: ## Start frontend and backend in parallel (alternative method)
	@echo "Starting servers in parallel..."
	@(cd backend && go run . &) && npm run dev

.PHONY: build
build: ## Build frontend for production
	npm run build

.PHONY: start
start: ## Start frontend production server
	npm start

.PHONY: lint
lint: ## Run ESLint on frontend code
	npm run lint

# ==================== Formatting Commands ====================

.PHONY: format
format: ## Format all code (frontend + backend)
	npm run format
	cd backend && gofmt -s -w .

.PHONY: fmt
fmt: format ## Alias for format

.PHONY: format-frontend
format-frontend: ## Format frontend code only
	npm run format

.PHONY: format-backend
format-backend: ## Format backend Go code only
	cd backend && gofmt -s -w .
	cd backend && go mod tidy

.PHONY: format-check
format-check: ## Check code formatting without fixing
	npm run format:check
	@cd backend && if [ "$$(gofmt -s -l . | wc -l)" -gt 0 ]; then \
		echo "Go code is not formatted properly:"; \
		gofmt -s -l .; \
		exit 1; \
	fi

.PHONY: prettier
prettier: ## Run Prettier on all files
	npx prettier --write .

.PHONY: prettier-check
prettier-check: ## Check Prettier formatting
	npx prettier --check .

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	npx tsc --noEmit

# ==================== Backend Commands ====================

.PHONY: backend-build
backend-build: ## Build backend binary
	cd backend && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o nunoo-backend .

.PHONY: backend-test
backend-test: ## Run backend tests
	cd backend && go test -v -race -coverprofile=coverage.out ./...

.PHONY: backend-coverage
backend-coverage: backend-test ## Run tests and show coverage report
	cd backend && go tool cover -html=coverage.out

.PHONY: backend-lint
backend-lint: ## Run golangci-lint on backend code
	cd backend && golangci-lint run --timeout=5m

.PHONY: backend-fmt
backend-fmt: ## Format backend Go code
	cd backend && gofmt -s -w .
	cd backend && go mod tidy

# ==================== Docker Commands ====================

.PHONY: docker-build
docker-build: ## Build Docker images
	docker-compose build

.PHONY: docker-up
docker-up: ## Start Docker containers
	docker-compose up -d

.PHONY: docker-down
docker-down: ## Stop Docker containers
	docker-compose down

.PHONY: docker-logs
docker-logs: ## View Docker container logs
	docker-compose logs -f

.PHONY: docker-clean
docker-clean: ## Clean Docker resources
	docker-compose down -v
	docker system prune -f

.PHONY: docker-backend
docker-backend: ## Build backend Docker image
	cd backend && docker build -t nunoo-backend .

# ==================== Database Commands ====================

.PHONY: db-up
db-up: ## Start PostgreSQL database
	docker-compose up -d postgres

.PHONY: db-migrate
db-migrate: ## Run database migrations
	cd backend && go run migrations/runner.go up

.PHONY: db-rollback
db-rollback: ## Rollback last database migration
	cd backend && go run migrations/runner.go down

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	docker-compose down -v postgres
	docker-compose up -d postgres
	sleep 5
	$(MAKE) db-migrate

# ==================== Testing Commands ====================

.PHONY: test
test: ## Run all tests (frontend + backend)
	npm test
	cd backend && go test -v ./...

.PHONY: test-watch
test-watch: ## Run frontend tests in watch mode
	npm test -- --watch

.PHONY: test-coverage
test-coverage: ## Generate test coverage reports
	npm test -- --coverage
	cd backend && go test -v -race -coverprofile=coverage.out ./...

.PHONY: e2e
e2e: ## Run end-to-end tests
	npm run test:e2e

# ==================== CI/CD Commands ====================

.PHONY: ci
ci: ## Run all CI checks locally
	$(MAKE) format-check
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	$(MAKE) build
	$(MAKE) backend-build

.PHONY: pre-commit
pre-commit: ## Run pre-commit checks
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) typecheck
	git diff --exit-code

.PHONY: audit
audit: ## Run security audit
	npm audit --audit-level moderate
	cd backend && go mod audit

.PHONY: audit-fix
audit-fix: ## Fix security vulnerabilities
	npm audit fix
	cd backend && go mod tidy

# ==================== Deployment Commands ====================

.PHONY: deploy-preview
deploy-preview: ## Deploy preview to Netlify
	npm run build
	netlify deploy --dir=.next

.PHONY: deploy-prod
deploy-prod: ## Deploy to production
	npm run build
	netlify deploy --prod --dir=.next

# ==================== Utility Commands ====================

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	rm -rf .next node_modules backend/nunoo-backend backend/coverage.out
	find . -name "*.log" -delete

.PHONY: fresh
fresh: clean ## Clean everything and reinstall
	$(MAKE) install
	$(MAKE) build

.PHONY: update
update: ## Update all dependencies
	npm update
	cd backend && go get -u ./...
	cd backend && go mod tidy

.PHONY: check-env
check-env: ## Check if required environment variables are set
	@echo "Checking environment variables..."
	@test -n "$$NEXT_PUBLIC_SUPABASE_URL" || (echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set" && exit 1)
	@test -n "$$NEXT_PUBLIC_SUPABASE_ANON_KEY" || (echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set" && exit 1)
	@echo "✅ All required environment variables are set"

.PHONY: setup
setup: ## Initial project setup
	cp .env.local.example .env.local
	cp backend/.env.example backend/.env
	@echo "✅ Environment files created. Please edit them with your values."
	$(MAKE) install
	$(MAKE) db-up
	@echo "✅ Setup complete! Run 'make dev' to start development."

# ==================== Git Commands ====================

.PHONY: git-clean
git-clean: ## Clean untracked files (careful!)
	git clean -fdx -e .env.local -e backend/.env -e node_modules

.PHONY: git-status
git-status: ## Show git status with better formatting
	@git status --short --branch

# Default target
.DEFAULT_GOAL := help