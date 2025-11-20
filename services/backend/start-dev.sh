#!/bin/bash
set -e

echo "🚀 Starting School Safety Backend Development Environment"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please update DATABASE_URL and other settings in .env.local if needed"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check database connection
echo "📡 Checking database connection..."
if command -v psql &> /dev/null; then
    if psql "${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/school_safety}" -c "SELECT 1" &> /dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Cannot connect to database"
        echo ""
        echo "To start database with Docker:"
        echo "  cd ../.. && docker compose up -d postgres"
        echo ""
        echo "Or install PostgreSQL manually:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql"
        echo "  macOS: brew install postgresql@15"
        echo ""
        exit 1
    fi
else
    echo "⚠️  psql not found, skipping database check"
fi
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate
echo ""

# Start server
echo "🎯 Starting development server..."
echo "   Backend will run on http://localhost:3001"
echo "   Press Ctrl+C to stop"
echo ""
npm run dev
