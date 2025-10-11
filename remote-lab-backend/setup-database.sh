#!/bin/bash

# Remote Labs v2 - Database Setup Script
# This script sets up PostgreSQL database and runs migrations

echo "🚀 Setting up Remote Labs v2 Database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   On macOS: brew services start postgresql"
    echo "   On Windows: Start PostgreSQL service"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test database connection
echo "🔌 Testing database connection..."
node -e "
import('./config/database.js').then(async (db) => {
    const connected = await db.testConnection();
    if (connected) {
        console.log('✅ Database connection successful');
        process.exit(0);
    } else {
        console.log('❌ Database connection failed');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your .env configuration."
    exit 1
fi

# Run migrations
echo "📋 Running database migrations..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo "✅ Database schema created"

# Migrate data from LowDB (if exists)
if [ -d "data" ] && [ "$(ls -A data)" ]; then
    echo "📊 Migrating data from LowDB..."
    npm run migrate:data
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Data migration had some issues, but continuing..."
    else
        echo "✅ Data migration completed"
    fi
else
    echo "ℹ️  No LowDB data found, skipping data migration"
fi

# Test migration
echo "🧪 Testing migration..."
npm run test:migration

if [ $? -ne 0 ]; then
    echo "❌ Migration test failed"
    exit 1
fi

echo "✅ Migration test passed"

# Create backup
echo "💾 Creating initial backup..."
npm run backup

if [ $? -ne 0 ]; then
    echo "⚠️  Backup failed, but continuing..."
else
    echo "✅ Initial backup created"
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with correct database credentials"
echo "2. Start the application: npm run dev"
echo "3. Or use Docker: docker-compose up"
echo ""
echo "Available commands:"
echo "- npm run dev          : Start development server"
echo "- npm run migrate      : Run database migrations"
echo "- npm run migrate:data : Migrate data from LowDB"
echo "- npm run backup       : Create database backup"
echo "- npm run test:migration : Test database operations"
