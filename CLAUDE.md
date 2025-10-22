# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FitTrackr** (https://fittrackr.me) is a multi-user AI-powered fitness tracking platform built as a monorepo. The system allows users to track workouts through multiple methods: manual entry, AI-powered OCR from screenshots (using Gemini AI Vision), GPX/FIT file uploads, and third-party integrations (Strava, Google Fit).

**Tech Stack**: Vite + React 19, Express + TypeScript, PostgreSQL + Prisma, Better Auth, BullMQ + Redis, Gemini AI Vision for OCR

## Monorepo Structure

This is a pnpm workspace with the following packages:

```
fittrackr/
├── apps/
│   ├── web/          # Frontend - Vite + React 19 + TailwindCSS
│   └── api/          # Backend - Express + TypeScript
└── packages/
    ├── database/     # Prisma schema, client, and migrations
    └── types/        # Shared TypeScript types and Zod schemas
```

## Essential Commands

### Development
```bash
# Start all services (frontend + backend)
pnpm dev

# Start individual services
pnpm dev:web  # Frontend only (port 5173)
pnpm dev:api  # Backend only (port 3001) - requires DATABASE_URL

# With DATABASE_URL prefix for backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm dev:api
```

### Database Operations
```bash
# Push schema to database (development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:push

# Create migration (production)
pnpm db:migrate

# Seed database with sample data
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:seed

# Open Prisma Studio (database GUI at localhost:5555)
pnpm db:studio

# Generate Prisma client after schema changes
pnpm --filter @fittrack/database db:generate
```

### Docker Infrastructure
```bash
# Start PostgreSQL (5432) and Redis (6379)
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (reset all data)
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Testing & Building
```bash
# Type checking
pnpm typecheck

# Build all packages for production
pnpm build

# Build individual packages
pnpm --filter @fittrack/web build
pnpm --filter @fittrack/api build
```

## Architecture & Data Flow

### Authentication Flow
- Uses **Better Auth** v1.3.28 for authentication
- All workout routes require authentication via `requireAuth` middleware
- User sessions stored in PostgreSQL (not JWT)
- OAuth support for Strava and Google Fit integrations
- Multi-user isolation: Users can only access their own workouts

### Workout Data Sources
Workouts can come from 4 different sources (tracked via `source` field):

1. **MANUAL** - Direct user input
2. **SCREENSHOT** - AI-powered OCR using Gemini AI Vision + Tesseract.js
3. **FILE** - GPX/FIT file uploads from GPS devices
4. **INTEGRATION** - Synced from Strava, Google Fit, etc.

### OCR Processing Pipeline
```
User uploads screenshot
  ↓
1. File saved to /uploads directory
  ↓
2. Tesseract.js extracts raw text
  ↓
3. Gemini AI Vision analyzes image and extracts structured data
  ↓
4. Data validated against Zod schemas
  ↓
5. Workout created with source=SCREENSHOT
  ↓
6. Original file path saved in sourceFileUrl
```

### Database Schema Key Points

**User Model** (packages/database/prisma/schema.prisma):
- Multi-user authentication via Better Auth
- Plan tiers: FREE, PRO, ENTERPRISE
- Relations: workouts, integrations, sessions, accounts

**Workout Model**:
- All standard metrics (distance, pace, calories, heartRate, elevation, etc.)
- `source` field tracks origin (MANUAL | SCREENSHOT | FILE | INTEGRATION)
- `sourceFileUrl` stores original file path
- `sourceMetadata` (JSON) for flexible additional data
- Relations: splits (lap data), user

**Integration Model**:
- Tracks third-party service connections
- Provider types: STRAVA, GOOGLE_FIT, GARMIN, APPLE_HEALTH
- Stores OAuth tokens and sync status

### API Routes (apps/api/src/routes/)

All routes are prefixed with `/api` and most require authentication:

- **`/api/auth`** - Better Auth endpoints (login, signup, sessions)
- **`/api/workouts`** - CRUD operations for workouts (all authenticated)
  - GET `/` - List user's workouts with splits
  - GET `/:id` - Single workout details
  - POST `/` - Create workout
  - PATCH `/:id` - Update workout
  - DELETE `/:id` - Delete workout
- **`/api/upload`** - Screenshot upload and OCR processing
- **`/api/files`** - GPX/FIT file upload and parsing
- **`/api/integrations`** - Third-party service OAuth and sync
  - Strava OAuth flow at `/strava/callback`
- **`/health`** - Health check with DB and Redis connectivity status

### Frontend Structure (apps/web/src/)

- **`pages/`** - Route components (Dashboard, Upload, Files, Integrations)
- **`components/`** - Reusable UI components
- **`lib/`** - Utilities and API client setup
- **`types/`** - Frontend-specific types

Uses React Query (@tanstack/react-query) for server state management and caching.

## Working with the Database

### Important: Always use DATABASE_URL when running Prisma commands

The database connection requires the `DATABASE_URL` environment variable. For local development:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:push
```

### After Schema Changes
1. Update `packages/database/prisma/schema.prisma`
2. Push to database: `DATABASE_URL="..." pnpm db:push` (dev) or `pnpm db:migrate` (prod)
3. Prisma Client auto-regenerates
4. Restart backend to pick up changes

### User Isolation Pattern
All workout queries MUST filter by userId:
```typescript
const workouts = await prisma.workout.findMany({
  where: { userId: req.user!.id }
});
```

Never expose workouts across users.

## Environment Variables

Required environment variables are documented in `.env.example`. Key variables:

**Backend** (apps/api/.env):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `AUTH_SECRET` - Better Auth secret (min 32 chars)
- `AUTH_URL` - Backend URL for auth callbacks
- `CLIENT_URL` - Frontend URL for CORS
- `GEMINI_API_KEY` - For AI-powered OCR (get from https://makersuite.google.com/app/apikey)
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` - Strava OAuth (optional)
- `GOOGLE_FIT_CLIENT_ID`, `GOOGLE_FIT_CLIENT_SECRET` - Google Fit OAuth (optional)

**Frontend** (apps/web/.env):
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)

## Development Workflow

### Starting Fresh
```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Setup database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:push

# 3. (Optional) Seed with sample data
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:seed

# 4. Start development servers
pnpm dev
```

### Adding New Features

**For new workout sources** (e.g., Garmin):
1. Add integration type to `IntegrationProvider` enum in schema.prisma
2. Create OAuth route handler in `apps/api/src/routes/integrations.ts`
3. Add sync logic to fetch workouts from the service
4. Save workouts with appropriate `source` value

**For new workout fields**:
1. Update `Workout` model in schema.prisma
2. Run `DATABASE_URL="..." pnpm db:push`
3. Update Zod schemas in `packages/types/src/index.ts`
4. Update API routes to handle new fields
5. Update frontend components to display new data

## Troubleshooting

### Port Conflicts
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues
```bash
# Check Docker containers are running
docker-compose ps

# Restart if needed
docker-compose down && docker-compose up -d

# Verify connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:studio
```

### Prisma Client Issues
```bash
# Regenerate client
cd packages/database
pnpm db:generate
cd ../..

# Or from root
pnpm --filter @fittrack/database db:generate
```

### Multiple Backend Processes Running
```bash
# List all node processes
ps aux | grep node

# Kill specific process
kill -9 <PID>
```

## Key Integration Points

### Gemini AI Vision for OCR
- Located in: `apps/api/src/routes/upload.ts`
- Requires `GEMINI_API_KEY` environment variable
- Uses Gemini 1.5 Flash model for image analysis
- Falls back to Tesseract.js if Gemini fails

### Strava Integration
- OAuth callback: `/api/integrations/strava/callback`
- Token storage in `Integration` model
- Activity sync creates workouts with `source=INTEGRATION`

### File Parsers
- GPX parser: Uses `gpx-parser-builder` library
- FIT parser: Uses `fit-file-parser` library
- Both located in: `apps/api/src/routes/files.ts`

## Testing Endpoints

```bash
# Health check
curl http://localhost:3001/health

# List workouts (requires auth)
curl http://localhost:3001/api/workouts \
  -H "Cookie: session_token=<your-session-token>"

# Upload screenshot for OCR
curl -X POST http://localhost:3001/api/upload \
  -H "Cookie: session_token=<your-session-token>" \
  -F "file=@/path/to/screenshot.png"
```

## Deployment

See `DEPLOYMENT.md` for complete deployment instructions to Coolify or other platforms.

Production deployment uses:
- `docker-compose.prod.yml` for full stack
- Individual Dockerfiles in `apps/api/` and `apps/web/`
- Environment variables from `.env.production.example`
