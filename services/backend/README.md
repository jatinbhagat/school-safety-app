# School Safety Backend

Backend API server for SafelyNotify.com school safety platform.

## 🚨 IMPORTANT: Fix "500 Error" on Onboarding

If you're seeing **"Failed to start onboarding"** or **500 Internal Server Error**, the database is not running.

### Quick Fix (3 steps):

```bash
# 1. Start PostgreSQL
cd /home/user/school-safety-app
docker compose up -d postgres

# 2. Create .env.local (if doesn't exist)
cd services/backend
cp .env.example .env.local

# 3. Run migrations
npm run migrate
```

✅ Now start the server: `npm run dev`

Onboarding should work now!

---

## Quick Start

```bash
# 1. Start database
cd /home/user/school-safety-app
docker compose up -d postgres

# 2. Install & setup
cd services/backend
npm install
cp .env.example .env.local

# 3. Run migrations
npm run migrate

# 4. Start server
npm run dev
```

Server: **http://localhost:3001**

Test: `curl http://localhost:3001/health`

## Troubleshooting

| Error | Fix |
|-------|-----|
| 500 on `/api/onboarding/start` | `docker compose up -d postgres && npm run migrate` |
| "DATABASE_URL not set" | `cp .env.example .env.local` |
| "relation 'institutions' does not exist" | `npm run migrate` |
| "Cannot connect to server" (frontend) | `npm run dev` (start backend) |

## Commands

```bash
npm run dev      # Start server with hot reload
npm run migrate  # Run database migrations
npm run build    # Build for production
npm start        # Start production server
```

## Documentation

See [SETUP.md](../../SETUP.md) for complete setup guide.

## Support

- Issues: https://github.com/jatinbhagat/school-safety-app/issues
- Email: support@safelynotify.com
