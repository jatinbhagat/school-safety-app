# CLAUDE CODE CONTEXT — School Safety App

## Purpose (one line)
A secure, anonymous, AI-assisted reporting system that helps students report safety issues instantly and helps schools respond faster, smarter, and with full compliance.

## Quick summary
- Student-facing PWA kiosk (anonymous, no login)
- Staff-facing native app (Expo) for triage & assignment
- Admin dashboard (Next.js / web) for analytics & one-click compliance export
- Backend: Node (Express) or FastAPI, Postgres (RDS), S3 for attachments, SQS for triage queue
- AI: OpenAI GPT-4o/GPT-5-mini (low token budget per incident < 200 tokens)

## Tech stack & constraints
- Frontend PWA: Next.js 14 (React), exportable static with service worker (PWAs)
- Staff app: Expo (React Native)
- Backend: Node.js (Express) with small Lambdas for production (option: FastAPI)
- DB: PostgreSQL (local: docker/postgres)
- Storage: MinIO locally; S3 in prod (server-side encryption with KMS)
- CI: GitHub Actions, using OIDC to assume deployment role (no long-lived secrets)
- Dev environment: Docker compose for local Postgres & MinIO
- Token/cost target: triage AI call ≤ 200 tokens per incident, cost-sensitive prompts

## Coding style & rules
- TypeScript where possible for JS/Node (prefer `.ts` for backend and frontend)
- Keep functions small and testable
- Add simple unit tests if feasible (jest)
- All changes should create a branch named `feat/<short>` or `fix/<short>` and open PR to `develop`.
- Commit messages: `type(scope): short description` (conventional commits)
- No secrets in code; use `.env` and AWS Secrets Manager in prod
- All API responses must be JSON and include `request_id` when applicable for tracing

## Security & compliance notes
- Student reports must be anonymous by default; do not collect or store PII unless explicitly opted-in
- Attachments uploaded via presigned URLs (server validates and quarantines before showing to staff)
- Keep audit trail for all triage AI outputs (store model output + prompt hashed)
- Ensure TLS, KMS encryption, and CloudTrail auditing in prod

## Useful dev endpoints (dev server)
- `POST /report` — create new incident
- `GET /incidents` — list incidents (staff auth required)
- `POST /upload-url` — generate presigned URL
- `POST /incidents/:id/assign` — assign incident to staff

## Contact / context
- Repo: github.com/jatinbhagat/school-safety-app
- Local dev: docker compose starts postgres (5432) and minio (9000)
- Token & model constraints: keep triage prompt to the minimal structured JSON output
