#!/bin/bash

# Nunoo Backend Environment Setup Script
# This script generates JWT secrets and sets up your environment

set -e  # Exit on any error

echo "🔐 Setting up Nunoo Backend environment..."

# Check if .env file exists, create if it doesn't
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file..."
    touch "$ENV_FILE"
else
    echo "📝 .env file already exists, updating JWT secrets..."
fi

# Generate JWT secrets
echo "🔑 Generating JWT secrets..."

# Generate access token secret (64 bytes, base64 encoded)
JWT_SECRET=$(openssl rand -base64 64)
echo "✅ Generated JWT_SECRET"

# Generate refresh token secret (64 bytes, base64 encoded)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
echo "✅ Generated JWT_REFRESH_SECRET"

# Generate a random database password for development
DB_PASSWORD=$(openssl rand -base64 32)
echo "✅ Generated DB_PASSWORD"

# Update or add JWT secrets to .env file
echo "📝 Updating .env file..."

# Function to update or add environment variable in .env file
update_env_var() {
    local key=$1
    local value=$2

    if grep -q "^${key}=" "$ENV_FILE"; then
        # Variable exists, update it - use a more robust approach
        # Create a temporary file with the updated content
        grep -v "^${key}=" "$ENV_FILE" > "${ENV_FILE}.tmp"
        echo "${key}=${value}" >> "${ENV_FILE}.tmp"
        mv "${ENV_FILE}.tmp" "$ENV_FILE"
    else
        # Variable doesn't exist, add it
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# Function to create a clean .env file
create_clean_env() {
    # Remove any existing .env file
    rm -f "$ENV_FILE"

    # Create new .env file with proper formatting
    echo "JWT_SECRET=${JWT_SECRET}" > "$ENV_FILE"
    echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}" >> "$ENV_FILE"
    echo "DATABASE_URL=postgres://app:${DB_PASSWORD}@localhost:5432/nunoo_db?sslmode=disable" >> "$ENV_FILE"
    echo "DB_PASSWORD=${DB_PASSWORD}" >> "$ENV_FILE"
    echo "SERVER_PORT=8080" >> "$ENV_FILE"
    echo "JWT_TOKENEXPIRY=15m" >> "$ENV_FILE"
    echo "JWT_REFRESHEXPIRY=72h" >> "$ENV_FILE"
}

# Create clean .env file
create_clean_env

echo "✅ Environment setup complete!"
echo ""
echo "📋 Generated secrets:"
echo "   JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "   JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:20}..."
echo "   DB_PASSWORD: ${DB_PASSWORD:0:20}..."
echo ""
echo "🔧 To use these environment variables:"
echo "   source .env"
echo "   # or"
echo "   export \$(cat .env | xargs)"
echo ""
echo "🚀 To run your backend:"
echo "   go run ./main.go"
echo ""
echo "⚠️  IMPORTANT: Keep your .env file secure and never commit it to version control!"
echo "   The .env file has been added to .gitignore automatically."

# Add .env to .gitignore if not already there
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Environment variables" >> .gitignore
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi

echo ""
echo "🎉 Setup complete! Your backend is ready to run with secure JWT secrets."
