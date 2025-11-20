#!/bin/bash
# Quick PostgreSQL Start Script

echo "🔍 Checking PostgreSQL status..."

# Try different methods to start PostgreSQL
if command -v systemctl &> /dev/null; then
    echo "📦 Starting PostgreSQL with systemctl..."
    sudo systemctl start postgresql
    sudo systemctl status postgresql --no-pager
elif command -v service &> /dev/null; then
    echo "📦 Starting PostgreSQL with service..."
    sudo service postgresql start
    sudo service postgresql status
elif command -v pg_ctlcluster &> /dev/null; then
    echo "📦 Starting PostgreSQL cluster..."
    sudo pg_ctlcluster 16 main start
    sudo pg_ctlcluster 16 main status
else
    echo "❌ Could not find PostgreSQL service manager"
    echo "Please start PostgreSQL manually"
fi

echo ""
echo "🧪 Testing connection..."
sleep 2
pg_isready -h localhost -p 5433 && echo "✅ PostgreSQL is running on port 5433" || \
pg_isready -h localhost -p 5432 && echo "✅ PostgreSQL is running on port 5432" || \
echo "❌ PostgreSQL is not responding"
