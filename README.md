# 🤝 Volunteer Management System (VMS)

**Version:** 1.0.0 | **Stack:** Node.js · React · PostgreSQL · AWS

A full-stack web platform for nonprofit and community organizations to onboard, manage, schedule, and communicate with volunteers — with AI-powered application summarization.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start (Local Dev)](#quick-start-local-dev)
3. [Project Structure](#project-structure)
4. [User Roles & Access](#user-roles--access)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Configuration](#configuration)
8. [Production Deployment (AWS)](#production-deployment-aws)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [DevOps Runbook](#devops-runbook)
11. [Testing](#testing)

---

## Architecture Overview

```
┌─────────────────┐    HTTPS     ┌──────────────────────┐
│  React SPA      │ ──────────►  │  Node.js/Express API │
│  (Nginx/ECS)    │ ◄──────────  │  (ECS Fargate)       │
└─────────────────┘   REST/JSON  └──────────┬───────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                   ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
                   │ PostgreSQL  │  │   AWS S3     │  │  AI/LLM API │
                   │ (RDS)       │  │  (Files)     │  │  (OpenAI)   │
                   └─────────────┘  └──────────────┘  └─────────────┘
```

**Three-tier architecture:**
- **Presentation** – React.js SPA with role-based dashboards (Volunteer, Org Admin, Super Admin)
- **Application** – Node.js/Express REST API with JWT auth and three-tier RBAC
- **Data** – PostgreSQL on AWS RDS + S3 for file storage

---

## Quick Start (Local Dev)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (recommended)
- OR: Node.js 20+, npm, PostgreSQL 15+

### Option A: Docker Compose (Recommended)

```bash
git clone <your-repo-url>
cd vms

# Start everything (postgres + backend + frontend)
docker-compose up --build

# The first start runs migrations and seeds the Super Admin
```

| Service    | URL                                |
|------------|------------------------------------|
| Frontend   | http://localhost:3000              |
| Backend API| http://localhost:3001              |
| API Docs   | http://localhost:3001/api/docs     |


**Default Super Admin credentials:**
```
Email:    superadmin@vms.com
Password: SuperAdmin@123
```

### Option B: Manual Setup

```bash
# 1. Start PostgreSQL and create database
createdb vms_db

# 2. Backend
cd backend
cp .env.example .env        # Edit with your DB creds
npm install
npm run migrate             # Create all tables
npm run seed                # Seed Super Admin
npm run dev                 # Start on :3001

# 3. Frontend (new terminal)
cd frontend
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
npm install
npm start                   # Start on :3000
```

---

## Project Structure

```
vms/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers (auth, events, applications, etc.)
│   │   ├── services/           # Business logic (AI, email, notifications)
│   │   ├── middleware/         # Auth, RBAC, audit logging, error handling
│   │   ├── routes/             # Express router (all endpoints in routes/index.js)
│   │   ├── db/                 # Knex DB instance
│   │   ├── utils/              # Logger
│   │   └── index.js            # App entry, cron jobs, Swagger
│   ├── migrations/             # Database schema migrations (Knex)
│   ├── seeds/                  # Super Admin seed
│   ├── src/__tests__/          # Jest + Supertest API tests
│   ├── knexfile.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client with JWT interceptor
│   │   ├── context/            # AuthContext (login, logout, refreshUser)
│   │   ├── components/
│   │   │   ├── common/         # Layout, Sidebar
│   │   │   └── notifications/  # NotificationBell
│   │   ├── pages/
│   │   │   ├── AuthPages.js    # Login, Register, VerifyEmail
│   │   │   ├── DashboardPage.js# Role-aware dashboards
│   │   │   ├── EventsPages.js  # List, Detail, Create/Edit
│   │   │   └── OtherPages.js   # Profile, Applications, Messaging, Admin pages
│   │   ├── App.js              # Router + protected routes
│   │   ├── index.css           # Design system (CSS variables + all styles)
│   │   └── index.js
│   ├── public/index.html
│   ├── nginx.conf
│   └── Dockerfile
│
├── .github/workflows/ci-cd.yml # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## User Roles & Access

| Feature | Super Admin | Org Admin | Volunteer |
|---------|:-----------:|:---------:|:---------:|
| Onboard organizations | ✅ | — | — |
| Generate invite tokens | ✅ | — | — |
| Deactivate organizations | ✅ | — | — |
| View all volunteers (cross-org) | ✅ | — | — |
| View audit logs | ✅ | — | — |
| Create / Edit / Delete events | ✅ | ✅ | — |
| View events | ✅ | ✅ (own org) | ✅ (active) |
| Apply for events | — | — | ✅ |
| Review applications | ✅ | ✅ | — |
| View AI summaries | ✅ | ✅ | — |
| Send / receive messages | ✅ | ✅ | ✅ |
| Manage own profile | — | — | ✅ |

---

## API Reference

Full interactive docs at `/api/docs` (Swagger UI).

### Auth
```
POST   /api/auth/register           Register volunteer or org admin (with invite)
POST   /api/auth/login              Login → returns JWT
GET    /api/auth/verify/:token      Verify email
POST   /api/auth/resend-verification Resend verification email
GET    /api/auth/me                 Get current user
```

### Super Admin (`/api/admin/*` — requires super_admin role)
```
GET    /api/admin/dashboard          System-wide metrics
GET    /api/admin/organizations      List all orgs
POST   /api/admin/organizations      Onboard new org + send invites
PATCH  /api/admin/organizations/:id  Toggle active/inactive
POST   /api/admin/invites            Generate additional invite
GET    /api/admin/volunteers         All volunteers (paginated, searchable)
GET    /api/admin/volunteers/:id     Volunteer detail (audit-logged)
GET    /api/admin/audit-logs         Filtered audit log
```

### Events
```
POST   /api/events                  Create event (org_admin+)
GET    /api/events                  List events (role-scoped)
GET    /api/events/:id              Event detail
PUT    /api/events/:id              Update event (org_admin+)
DELETE /api/events/:id              Cancel event + close apps (org_admin+)
```

### Applications
```
POST   /api/applications                    Submit application (volunteer)
GET    /api/applications                    My applications (volunteer)
GET    /api/events/:eventId/applications    Event applications (admin)
PATCH  /api/applications/:id/status         Accept / Reject (admin)
GET    /api/summary/:applicationId          AI summary (admin)
```

### Messaging & Notifications
```
POST   /api/messages                        Send message
GET    /api/messages/conversations          List conversations
GET    /api/messages/unread-count           Unread count
GET    /api/messages/:conversationPartnerId  Thread
GET    /api/notifications                   List notifications
PATCH  /api/notifications/:id/read          Mark read (use "all" for all)
```

### Dashboards
```
GET    /api/dashboard/volunteer     Volunteer dashboard data
GET    /api/dashboard/admin         Org admin dashboard data
```

---

## Database Schema

10 tables with full referential integrity:

| Table | Purpose |
|-------|---------|
| `users` | All users (volunteer / org_admin / super_admin) |
| `organizations` | Organizations onboarded by Super Admin |
| `invite_tokens` | Time-limited, single-use org admin invites |
| `volunteer_profiles` | Extended profile (skills, interests, bio) |
| `events` | Volunteer events created by org admins |
| `applications` | Volunteer applications to events |
| `ai_summaries` | Cached AI-generated application summaries |
| `messages` | In-app messages between users |
| `notifications` | In-app notifications + email triggers |
| `audit_logs` | All Super Admin actions (GDPR-ready audit trail) |
| `email_verification_tokens` | Email verification links |

Run migrations:
```bash
cd backend
npm run migrate          # Apply
npm run migrate:rollback # Rollback one
```

---

## Configuration

### Backend `.env`

```env
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vms_db
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT (change in production!)
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=vms-uploads
AWS_SES_FROM_EMAIL=noreply@yourapp.com

# AI (OpenAI)
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo

# App
FRONTEND_URL=http://localhost:3000
SUPER_ADMIN_EMAIL=superadmin@vms.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

> In production, store all secrets in **AWS Parameter Store** or **Secrets Manager**, not in `.env` files.

---

## Production Deployment (AWS)

### Required AWS Resources

1. **ECS Cluster** (Fargate) — `vms-cluster`
2. **RDS PostgreSQL** — `vms-db` (in private subnet)
3. **S3 Bucket** — `vms-uploads` (for profile images)
4. **ECR Repositories** — `vms-backend`, `vms-frontend`
5. **Application Load Balancer** — routes `/api/*` to backend, `/` to frontend
6. **AWS SES** — for transactional emails
7. **CloudWatch** — log groups + alarms
8. **Parameter Store** — all secrets

### First-time deployment

```bash
# 1. Build and push images
docker build -t vms-backend ./backend
docker build -t vms-frontend ./frontend
# Tag and push to ECR...

# 2. Run migrations on RDS (one-time via ECS task or bastion)
cd backend && DB_HOST=<rds-endpoint> npm run migrate && npm run seed

# 3. Deploy ECS services via GitHub Actions (see .github/workflows/ci-cd.yml)
```

### Environment separation
- Development: `docker-compose.yml`
- Production: ECS task definitions with SSM Parameter Store references

---

## CI/CD Pipeline

The GitHub Actions pipeline in `.github/workflows/ci-cd.yml` does:

1. **On every PR to `main`:**
   - Spins up PostgreSQL service
   - Runs backend migrations + Jest tests
   - Builds frontend (validates no compile errors)

2. **On merge to `main`:**
   - Builds Docker images for backend + frontend
   - Pushes to Amazon ECR (tagged with commit SHA)
   - Updates ECS task definitions with new images
   - Deploys to ECS with `wait-for-service-stability`
   - Runs production smoke test against `/health`
   - Automatic rollback if health check fails

**Required GitHub Secrets:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
PRODUCTION_DOMAIN
```

---

## DevOps Runbook

### View Logs
```bash
# CloudWatch (production)
aws logs tail /ecs/vms-backend --follow

# Docker (local)
docker-compose logs -f backend
```

### Manual Deploy
```bash
# Force new deployment without code change
aws ecs update-service \
  --cluster vms-cluster \
  --service vms-backend-service \
  --force-new-deployment
```

### Rollback
```bash
# Get previous task definition revision
aws ecs describe-task-definition --task-definition vms-backend --query 'taskDefinition.revision'

# Roll back to previous revision (e.g., revision 5)
aws ecs update-service \
  --cluster vms-cluster \
  --service vms-backend-service \
  --task-definition vms-backend:5
```

### Database Backup
```bash
# RDS automated backups: configured for 30-day retention
# Manual snapshot:
aws rds create-db-snapshot \
  --db-instance-identifier vms-db \
  --db-snapshot-identifier vms-manual-$(date +%Y%m%d)
```

### Health Checks
- Backend: `GET /health` → `{ "status": "ok" }`
- CloudWatch alarms: CPU > 80%, Error rate > 5%, DB connections > 80%

---

## Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- api.test.js
```

**Test coverage:**
- Authentication (register, login, verify, RBAC)
- Super Admin (org onboarding, invite flow, volunteer listing)
- Events (CRUD, access control)
- Applications (submit, duplicate check, accept/reject)
- Messaging (send, conversation listing)
- RBAC enforcement across all roles

---

## Sprint Delivery

| Sprint | Theme | Status |
|--------|-------|--------|
| Sprint 1 | Foundation – Auth, Infrastructure, Super Admin | ✅ Complete |
| Sprint 2 | Core Features – Events, Applications, AI, Messaging | ✅ Complete |
| Sprint 3 | Polish, QA, Security, Deployment | ✅ Complete |

**Total: 20 user stories, 157 tasks across 3 sprints.**

---

*Built by Zainab Zahid, Salik Jangda, Nofil Khalid — Habib University, 2026*
