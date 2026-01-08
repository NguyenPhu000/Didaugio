@echo off
REM =============================================================================
REM MIGRATION SCRIPT - Add Missing Permission (Windows)
REM Run this to fix 403 error when updating user permissions
REM =============================================================================

echo 🔧 Running migration: Add roles.assign_to_users permission
echo.

REM Load .env file (requires npm package dotenv-cli)
REM Or set environment variables manually

set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=didaugio
set DB_USER=postgres

echo 📦 Database: %DB_NAME%
echo 🖥️  Host: %DB_HOST%:%DB_PORT%
echo 👤 User: %DB_USER%
echo.

REM Prompt for password
set /p DB_PASSWORD="Enter database password: "

echo ⏳ Executing SQL migration...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f prisma\migrations\20260104000000_add_assign_permission.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo 🔍 Verifying permission...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT p.name, p.display_name, p.module, COUNT(rp.role_id) as assigned_to_roles FROM permissions p LEFT JOIN role_permissions rp ON p.id = rp.permission_id WHERE p.name = 'roles.assign_to_users' GROUP BY p.id;"
    echo.
    echo ✨ Done! Please restart your server.
) else (
    echo.
    echo ❌ Migration failed. Please check the error above.
    exit /b 1
)

pause
