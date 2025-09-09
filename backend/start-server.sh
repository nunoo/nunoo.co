#!/bin/bash

# Nunoo Backend Server Starter
# This script generates JWT secrets and starts the server directly

set -e # Exit on any error

echo "🚀 Starting Nunoo Backend..."

# Generate JWT secrets
echo "🔑 Generating JWT secrets..."

JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
DB_PASSWORD=$(openssl rand -base64 32)

echo "✅ Generated JWT_SECRET"
echo "✅ Generated JWT_REFRESH_SECRET"
echo "✅ Generated DB_PASSWORD"

# Export environment variables
export JWT_SECRET="$JWT_SECRET"
export JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
export DATABASE_URL="postgres://app:${DB_PASSWORD}@localhost:5432/nunoo_db?sslmode=disable"
export DB_PASSWORD="$DB_PASSWORD"
export SERVER_PORT="8080"
export JWT_TOKENEXPIRY="15m"
export JWT_REFRESHEXPIRY="72h"

echo "🔧 Environment variables set"
echo "🚀 Starting server on port 8080..."
echo "📱 Health check: http://localhost:8080/health"
echo "📚 API docs: http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
go run ./main.go
