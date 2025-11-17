#!/bin/bash

# Migration runner script
# Runs all SQL migrations in order

set -e  # Exit on error

# Load environment variables if .env.local exists
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set it in .env.local or export it directly"
  exit 1
fi

echo "Running database migrations..."
echo "Database: $DATABASE_URL"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

# Run each migration in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "Running migration: $filename"
    psql "$DATABASE_URL" -f "$migration"

    if [ $? -eq 0 ]; then
      echo "✓ $filename completed successfully"
    else
      echo "✗ $filename failed"
      exit 1
    fi
    echo ""
  fi
done

echo "All migrations completed successfully!"
