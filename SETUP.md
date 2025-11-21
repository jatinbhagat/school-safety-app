# SafelyNotify.com - Development Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (recommended)

## Quick Start

### 1. Start Database (Docker - Recommended)

```bash
# From project root
docker compose up -d postgres

# Verify database is running
docker compose ps
# Should show postgres container as "Up"
```

**Alternative: Manual PostgreSQL Installation**

If you don't have Docker, install PostgreSQL manually:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15

# macOS
brew install postgresql@15

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS

# Create database
psql -U postgres -c "CREATE DATABASE school_safety;"
```

### 2. Set Up Backend

```bash
cd services/backend

# Install dependencies
npm install

# Environment variables are already configured in .env.local
# Default database: postgresql://postgres:postgres@localhost:5433/school_safety

# Run database migrations
npm run migrate

# Start backend server
npm run dev
```

Backend will run on **http://localhost:3001**

### 3. Set Up Frontend

```bash
cd services/pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on **http://localhost:3000**

## Database Migrations

The application uses SQL migration files in `/services/backend/migrations/`.

To run migrations:

```bash
cd services/backend
npm run migrate
```

### Migration Files (in order):

1. `010_create_institutions.sql` - Institution/school data
2. `011_create_institution_admins.sql` - Admin users
3. `012_create_institution_features.sql` - Feature toggles
4. `013_create_staff_members.sql` - Staff emails
5. `014_create_audit_logs.sql` - Audit trail
6. `015_create_reporting_config.sql` - Reporting configuration
7. (Additional migrations for incidents, reports, etc.)

## Testing Onboarding Flow

1. Make sure both backend and frontend are running
2. Navigate to **http://localhost:3000/onboarding**
3. Complete the onboarding process:
   - Choose institution type (School, College, University)
   - Fill in institution details
   - Set password (min 8 characters, mixed case, numbers, special chars)
   - Accept terms
   - Click "Complete Onboarding"

## Troubleshooting

### Error: "Cannot connect to the server"

**Cause:** Backend is not running

**Solution:**
```bash
cd services/backend
npm run dev
```

### Error: "DATABASE_URL environment variable is not set"

**Cause:** Missing .env.local file

**Solution:**
```bash
cd services/backend
cp .env.example .env.local
# Edit DATABASE_URL if needed
```

### Error: "relation 'institutions' does not exist"

**Cause:** Database migrations haven't been run

**Solution:**
```bash
cd services/backend
npm run migrate
```

### Error: "password authentication failed for user postgres"

**Cause:** Wrong database credentials

**Solution:**

1. Check docker-compose.yml for correct credentials
2. Update DATABASE_URL in services/backend/.env.local:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety
   ```

### Error: "connection refused" on port 5433

**Cause:** PostgreSQL container not running

**Solution:**
```bash
# Start database
docker compose up -d postgres

# Check if running
docker compose ps

# Check logs if issues
docker compose logs postgres
```

### Frontend shows "Failed to start onboarding"

**Check in this order:**

1. **Backend running?**
   ```bash
   curl http://localhost:3001/health
   # Should return {"status":"ok"}
   ```

2. **Database connected?**
   ```bash
   cd services/backend
   npm run migrate
   # Should show "Migrations completed successfully"
   ```

3. **Check backend console for errors**
   - Look for "[Onboarding]" log messages
   - Check for database connection errors

## Environment Variables

### Backend (.env.local)

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)

Optional (for full functionality):
- `SMTP_*` - Email sending configuration
- `AWS_*` - S3 for file uploads

### Frontend

Create `services/pwa/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Port Reference

- **3000** - Frontend (Next.js)
- **3001** - Backend API (Express)
- **5433** - PostgreSQL (Docker)
- **5432** - PostgreSQL (System)
- **9000** - MinIO S3 (Optional)
- **9001** - MinIO Console (Optional)

## Development Workflow

1. Start database: `docker compose up -d postgres`
2. Start backend: `cd services/backend && npm run dev`
3. Start frontend: `cd services/pwa && npm run dev`
4. Access app: http://localhost:3000

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup instructions.

## Common Development Commands

```bash
# Reset database (⚠️ deletes all data)
docker compose down postgres
docker volume rm school-safety-app_postgres_data
docker compose up -d postgres
cd services/backend && npm run migrate

# View database
docker compose exec postgres psql -U postgres -d school_safety

# Check backend health
curl http://localhost:3001/health

# Run backend tests
cd services/backend && npm test

# Run frontend tests
cd services/pwa && npm test

# Build for production
cd services/backend && npm run build
cd services/pwa && npm run build
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/jatinbhagat/school-safety-app/issues
- Email: support@safelynotify.com

---

**Need help?** Check the troubleshooting section above or create an issue on GitHub.
