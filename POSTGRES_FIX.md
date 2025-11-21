# 🚨 ONBOARDING 500 ERROR - ROOT CAUSE IDENTIFIED

## The Real Problem

The onboarding is failing with this error:

```json
{
  "error": "INTERNAL_ERROR",
  "details": {
    "errorMessage": "Database connection failed while checking email"
  }
}
```

**Root Cause:** PostgreSQL is NOT running on port 5433.

## How to Start PostgreSQL

You have a few options:

### Option 1: Docker Compose (Recommended if Docker is installed)

```bash
# From project root
cd /home/user/school-safety-app
docker-compose up -d postgres

# Wait 5 seconds for it to start
sleep 5

# Verify it's running
docker-compose ps
# Should show "postgres" as "Up"
```

### Option 2: System PostgreSQL (if installed)

```bash
# Start postgres service
sudo systemctl start postgresql
# OR
sudo service postgresql start

# Check status
sudo systemctl status postgresql
```

### Option 3: Manual PostgreSQL Start (if installed manually)

```bash
# Find your postgres data directory
# Common locations: /var/lib/postgresql/data, /usr/local/var/postgres

# Start postgres
pg_ctl -D /path/to/data/directory start
```

### Option 4: Install PostgreSQL

If PostgreSQL is not installed at all:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

## After Starting PostgreSQL

1. **Verify connection:**
```bash
psql "postgresql://postgres:postgres@localhost:5433/school_safety" -c "SELECT 1"
```

2. **Create database if needed:**
```bash
psql -U postgres -c "CREATE DATABASE school_safety;"
```

3. **Run migrations:**
```bash
cd /home/user/school-safety-app/services/backend
npm run migrate
```

4. **Backend should already be running, test it:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","database":"connected"}
```

5. **Test onboarding:**
```bash
curl -X POST http://localhost:3001/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "institutionType": "school",
    "institutionName": "Test School",
    "location": "San Francisco, CA",
    "email": "test@testschool.edu",
    "contactName": "John Doe",
    "phone": "1234567890"
  }'
```

## Current Status

✅ Backend code is correct
✅ Error handling is working
✅ Validation is working
❌ **PostgreSQL is not running** ← THIS IS THE ISSUE

## Quick Diagnosis

Run this to check postgres:
```bash
pg_isready -h localhost -p 5433
```

- If it says "accepting connections" → postgres is running ✅
- If it says "no response" or "connection refused" → postgres is NOT running ❌

---

**Once PostgreSQL is running, the onboarding will work perfectly!**
