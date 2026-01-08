#!/bin/bash

# =============================================================================
# MIGRATION SCRIPT - Add Missing Permission
# Run this to fix 403 error when updating user permissions
# =============================================================================

echo "🔧 Running migration: Add roles.assign_to_users permission"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xed)
fi

# Database connection from .env or default
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-didaugio}"
DB_USER="${DATABASE_USER:-postgres}"

echo "📦 Database: $DB_NAME"
echo "🖥️  Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Run migration
echo "⏳ Executing SQL migration..."
PGPASSWORD=$DATABASE_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f prisma/migrations/20260104000000_add_assign_permission.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying permission..."
    PGPASSWORD=$DATABASE_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 
            p.name, 
            p.display_name, 
            p.module,
            COUNT(rp.role_id) as assigned_to_roles
        FROM permissions p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE p.name = 'roles.assign_to_users'
        GROUP BY p.id;
    "
    echo ""
    echo "✨ Done! Please restart your server."
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
