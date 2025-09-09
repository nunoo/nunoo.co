# Environment Setup Scripts

This directory contains scripts to automatically set up your Nunoo Backend environment with secure JWT secrets.

## Quick Start

### For macOS/Linux:

```bash
cd backend
./setup-env.sh
```

### For Windows:

```cmd
cd backend
setup-env.bat
```

## What These Scripts Do

1. **Generate Secure JWT Secrets**
   - Creates cryptographically secure 64-byte secrets for access and refresh tokens
   - Generates a random database password for development

2. **Create/Update .env File**
   - Automatically creates a `.env` file if it doesn't exist
   - Updates existing JWT secrets if the file already exists
   - Sets sensible defaults for other configuration values

3. **Security Setup**
   - Automatically adds `.env` to `.gitignore` to prevent accidental commits
   - Uses industry-standard random number generation

## Generated Environment Variables

The scripts will create these variables in your `.env` file:

```bash
JWT_SECRET=<64-byte-random-secret>
JWT_REFRESH_SECRET=<64-byte-random-secret>
DATABASE_URL=postgres://app:<password>@localhost:5432/nunoo_db?sslmode=disable
DB_PASSWORD=<32-byte-random-password>
SERVER_PORT=8080
JWT_TOKENEXPIRY=15m
JWT_REFRESHEXPIRY=72h
```

## After Running the Script

1. **Load the environment variables:**

   ```bash
   # macOS/Linux
   source .env

   # Windows
   for /f "tokens=1,2 delims==" %a in (.env) do set %a=%b
   ```

2. **Run your backend:**
   ```bash
   go run ./main.go
   ```

## Security Notes

- **Never commit your `.env` file** - it's automatically added to `.gitignore`
- **Keep your secrets secure** - rotate them regularly in production
- **Use different secrets per environment** (dev, staging, prod)
- The generated secrets are cryptographically secure and suitable for production use

## Troubleshooting

### If you get permission errors on macOS/Linux:

```bash
chmod +x setup-env.sh
```

### If the script fails to generate secrets:

Make sure you have OpenSSL installed:

- **macOS**: Usually pre-installed
- **Linux**: `sudo apt-get install openssl` (Ubuntu/Debian) or `sudo yum install openssl` (CentOS/RHEL)
- **Windows**: The batch script uses PowerShell instead of OpenSSL

### If you need to regenerate secrets:

Simply run the script again - it will update existing values in your `.env` file.

## Manual Setup Alternative

If you prefer to set up manually, you can:

1. Create a `.env` file
2. Generate secrets manually:

   ```bash
   # Generate JWT secret
   openssl rand -base64 64

   # Generate refresh secret
   openssl rand -base64 64
   ```

3. Add them to your `.env` file

But the automated scripts are much easier and more secure!
