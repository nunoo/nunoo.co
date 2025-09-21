# GitHub Actions Workflows

This repository includes comprehensive GitHub Actions workflows for CI/CD, security, and maintenance.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)
- **Triggers**: Push to main/develop, PRs to main/develop
- **Features**:
  - Frontend: Lint, format check, type check, build
  - Backend: Go format check, lint with golangci-lint, tests with coverage
  - Security scanning with CodeQL, gosec, npm audit
  - PostgreSQL service for integration tests
  - Codecov integration for coverage reporting

### 2. Build and Deploy (`deploy.yml`)
- **Triggers**: Push to main branch
- **Features**:
  - Frontend build and Netlify deployment
  - Backend Docker image build and push to GitHub Container Registry
  - Multi-platform Docker builds (linux/amd64, linux/arm64)
  - Artifact uploading for build assets
  - Production deployment placeholder

### 3. Security Scanning (`security.yml`)
- **Triggers**: Push, PRs, daily schedule
- **Features**:
  - CodeQL analysis for JavaScript/TypeScript and Go
  - Gosec for Go security scanning
  - npm audit and Snyk for Node.js vulnerabilities
  - Trivy for Docker image scanning
  - TruffleHog for secret detection
  - SARIF uploads to GitHub Security tab

### 4. Dependency Updates (`dependency-update.yml`)
- **Triggers**: Weekly schedule (Mondays), manual
- **Features**:
  - Automated npm dependency updates (minor versions)
  - Go dependency updates
  - Automatic PR creation with test validation
  - Separate workflows for npm and Go dependencies

### 5. Performance Testing (`performance.yml`)
- **Triggers**: Push to main, PRs, daily schedule
- **Features**:
  - Lighthouse performance audits
  - Load testing with k6
  - Bundle size analysis for frontend
  - Performance thresholds and reporting

### 6. Release (`release.yml`)
- **Triggers**: Git tags (v*), manual with version input
- **Features**:
  - Multi-platform binary builds (Linux, macOS, Windows)
  - Docker image builds with semantic versioning
  - GitHub release creation with changelog
  - Release asset uploads

### 7. Cleanup (`cleanup.yml`)
- **Triggers**: Weekly schedule (Sundays), manual
- **Features**:
  - Cleanup old workflow artifacts (>30 days)
  - Remove old container images (keep latest 10)
  - Delete old workflow runs (>60 days)

## Required Secrets

Set these secrets in your GitHub repository settings:

```
NETLIFY_SITE_ID          # Your Netlify site ID
NETLIFY_AUTH_TOKEN       # Netlify authentication token
SNYK_TOKEN              # Snyk API token for vulnerability scanning
LHCI_GITHUB_APP_TOKEN   # Lighthouse CI GitHub app token
```

## Configuration Files

- `lighthouserc.yml` - Lighthouse CI configuration with performance thresholds
- All workflows use caching for npm and Go dependencies
- Matrix builds for cross-platform compatibility
- Proper permissions for security and package operations

## Best Practices Implemented

1. **Security**: Least privilege permissions, secret scanning, vulnerability assessments
2. **Performance**: Caching, parallel jobs, efficient dependency management
3. **Reliability**: Health checks, retries, proper error handling
4. **Maintainability**: Clear naming, comprehensive documentation, modular design
5. **Automation**: Dependency updates, cleanup, release management