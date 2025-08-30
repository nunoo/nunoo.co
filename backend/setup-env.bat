@echo off
REM Nunoo Backend Environment Setup Script for Windows
REM This script generates JWT secrets and sets up your environment

echo 🔐 Setting up Nunoo Backend environment...

REM Check if .env file exists, create if it doesn't
if not exist ".env" (
    echo 📝 Creating .env file...
    type nul > .env
) else (
    echo 📝 .env file already exists, updating JWT secrets...
)

echo 🔑 Generating JWT secrets...

REM Generate JWT secrets using PowerShell
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Security; [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))"') do set JWT_SECRET=%%i

for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Security; [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))"') do set JWT_REFRESH_SECRET=%%i

for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Security; [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"') do set DB_PASSWORD=%%i

echo ✅ Generated JWT_SECRET
echo ✅ Generated JWT_REFRESH_SECRET
echo ✅ Generated DB_PASSWORD

echo 📝 Updating .env file...

REM Function to update or add environment variable in .env file
call :update_env_var "JWT_SECRET" "%JWT_SECRET%"
call :update_env_var "JWT_REFRESH_SECRET" "%JWT_REFRESH_SECRET%"
call :update_env_var "DATABASE_URL" "postgres://app:%DB_PASSWORD%@localhost:5432/nunoo_db?sslmode=disable"
call :update_env_var "DB_PASSWORD" "%DB_PASSWORD%"
call :update_env_var "SERVER_PORT" "8080"
call :update_env_var "JWT_TOKENEXPIRY" "15m"
call :update_env_var "JWT_REFRESHEXPIRY" "72h"

echo ✅ Environment setup complete!
echo.
echo 📋 Generated secrets:
echo    JWT_SECRET: %JWT_SECRET:~0,20%...
echo    JWT_REFRESH_SECRET: %JWT_REFRESH_SECRET:~0,20%...
echo    DB_PASSWORD: %DB_PASSWORD:~0,20%...
echo.
echo 🔧 To use these environment variables:
echo    for /f "tokens=1,2 delims==" %%a in (.env) do set %%a=%%b
echo.
echo 🚀 To run your backend:
echo    go run ./main.go
echo.
echo ⚠️  IMPORTANT: Keep your .env file secure and never commit it to version control!
echo    The .env file has been added to .gitignore automatically.

REM Add .env to .gitignore if not already there
findstr /c:".env" .gitignore >nul 2>&1
if errorlevel 1 (
    echo. >> .gitignore
    echo # Environment variables >> .gitignore
    echo .env >> .gitignore
    echo ✅ Added .env to .gitignore
)

echo.
echo 🎉 Setup complete! Your backend is ready to run with secure JWT secrets.
pause
goto :eof

:update_env_var
REM Update or add environment variable in .env file
REM Usage: call :update_env_var "KEY" "VALUE"
set "key=%~1"
set "value=%~2"

findstr /c:"%key%=" .env >nul 2>&1
if errorlevel 1 (
    REM Variable doesn't exist, add it
    echo %key%=%value%>> .env
) else (
    REM Variable exists, update it (create temporary file)
    powershell -Command "(Get-Content .env) -replace '^%key%=.*', '%key%=%value%' | Set-Content .env"
)
goto :eof
