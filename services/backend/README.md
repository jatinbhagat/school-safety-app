# School Safety Backend API

Node.js/Express backend service for the School Safety Reporting System.

## Features

- **POST /report** - Submit anonymous safety incident reports
- **GET /health** - Health check endpoint with database connectivity status
- PostgreSQL database with incidents table
- TypeScript for type safety
- Request ID tracking for all API responses

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or Docker)
- DATABASE_URL connection string

## Setup Instructions

### 1. Install Dependencies

```bash
cd services/backend
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `services/backend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database connection:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety
PORT=3001
NODE_ENV=development
```

### 3. Set Up Database

#### Option A: Using Docker Compose (Recommended)

From the project root:

```bash
docker compose up -d postgres
```

#### Option B: Local PostgreSQL

Ensure PostgreSQL is running and create the database:

```bash
createdb school_safety
```

### 4. Run Database Migrations

Connect to your database and run the migration:

```bash
psql $DATABASE_URL -f migrations/001_create_incidents.sql
```

Or using psql directly:

```bash
psql -h localhost -U postgres -d school_safety -f migrations/001_create_incidents.sql
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "service": "school-safety-backend",
  "database": "connected"
}
```

### Submit Report

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bullying",
    "description": "Witnessed verbal harassment in hallway",
    "class_section": "Grade 10A"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "created_at": "2025-11-16T10:30:00.000Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "message": "Field \"category\" is required and must be a non-empty string",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Database Schema

The `incidents` table stores all safety reports:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `category` | TEXT | Report category (required) |
| `description` | TEXT | Incident description |
| `class_section` | TEXT | Optional class/section |
| `attachments` | JSONB | Attachment metadata |
| `created_at` | TIMESTAMPTZ | Submission timestamp |
| `status` | TEXT | Current status (open/in_progress/resolved/closed) |
| `ai_meta` | JSONB | AI triage metadata |

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build (requires `npm run build` first)
- `npm test` - Run tests (when configured)

## Testing Locally

### 1. Verify Health Endpoint

```bash
curl http://localhost:3001/health
```

Should return `status: "ok"` and `database: "connected"`

### 2. Submit a Test Report

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "test",
    "description": "This is a test report"
  }'
```

### 3. Verify in Database

```bash
psql $DATABASE_URL -c "SELECT * FROM incidents;"
```

### 4. Test Validation

Try submitting without required field:

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Missing category"
  }'
```

Should return 400 error with validation message.

## Security Notes

- Student reports are anonymous by default (no PII collection)
- Use environment variables for all secrets (never commit `.env.local`)
- All API responses include `request_id` for tracing
- Input validation on all POST endpoints
- Database connection pooling for performance

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Use managed PostgreSQL (AWS RDS, etc.)
3. Enable SSL for database connections
4. Set up proper logging and monitoring
5. Use secrets manager for DATABASE_URL
6. Build and run: `npm run build && npm start`

## Troubleshooting

**Database connection fails:**
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env.local`
- Ensure database exists: `createdb school_safety`

**Migration errors:**
- Ensure you're connected to the correct database
- Check PostgreSQL logs for detailed errors
- Verify table doesn't already exist

**Port already in use:**
- Change PORT in `.env.local`
- Or kill existing process: `lsof -ti:3001 | xargs kill`
