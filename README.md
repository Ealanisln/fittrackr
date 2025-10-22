# 🏃‍♂️ FitTrackr - AI-Powered Fitness Tracking Platform

Multi-user fitness tracking platform with AI-powered OCR for workout screenshots, third-party integrations, and analytics.

**Live at**: https://fittrackr.me

## 🚀 Tech Stack

- **Frontend**: Vite + React 19 + TypeScript + TailwindCSS
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Better Auth
- **OCR**: Tesseract.js + **Gemini AI Vision**
- **Job Queue**: BullMQ + Redis
- **Infrastructure**: Docker Compose

## 📦 Project Structure

```
fittrackr/
├── apps/
│   ├── web/          # Vite React frontend
│   └── api/          # Express backend API
├── packages/
│   ├── database/     # Prisma schema & client
│   └── types/        # Shared TypeScript types
└── docker-compose.yml
```

---

## 🏁 How to Run Locally

### Prerequisites

- Node.js 18+ with **pnpm** installed
- Docker Desktop running
- Gemini API key (get one at https://makersuite.google.com/app/apikey)

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Start Docker Services

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

You should see:
- `fittrackr-postgres` running on port 5432
- `fittrackr-redis` running on port 6379

### Step 3: Setup Database

```bash
# Push Prisma schema to PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:push

# (Optional) Seed sample data - adds 7 workouts
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm db:seed
```

### Step 4: Configure Environment Variables

Edit `/apps/api/.env` and add your **Gemini API key**:

```bash
# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public"

# Better Auth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3001"

# Redis
REDIS_URL="redis://localhost:6379"

# ⭐ IMPORTANT: Add your Gemini API key here
GEMINI_API_KEY="your-actual-gemini-api-key"

# Strava Integration (optional - get credentials at https://www.strava.com/settings/api)
STRAVA_CLIENT_ID="your-strava-client-id"
STRAVA_CLIENT_SECRET="your-strava-client-secret"
STRAVA_REDIRECT_URI="http://localhost:3001/api/integrations/strava/callback"
FRONTEND_URL="http://localhost:5173"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
```

### Step 5: Start the App

**Option A - Run Everything at Once:**
```bash
pnpm dev
```

**Option B - Run Separately (for debugging):**

Terminal 1 - Backend:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm --filter @fittrack/api dev
```

Terminal 2 - Frontend:
```bash
pnpm --filter @fittrack/web dev
```

### Step 6: Access Your App

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Workouts**: http://localhost:3001/api/workouts

---

## 📸 Using the OCR Upload Feature

Once your app is running, you can upload workout screenshots:

1. Go to http://localhost:5173
2. Click the **"Upload"** tab
3. Click to select a workout screenshot (or drag & drop)
4. Wait a few seconds while AI extracts the data
5. Check your dashboard - the workout is now saved!

**For detailed OCR setup and troubleshooting, see [GEMINI_SETUP.md](./GEMINI_SETUP.md)**

---

## 📂 Using the GPX/FIT File Upload Feature

You can import workouts from your GPS devices (Garmin, Polar, Suunto, etc.):

1. Go to http://localhost:5173
2. Click the **"Files"** button in the dashboard header
3. Drag and drop your .gpx or .fit files (or click to browse)
4. Click **"Upload"** to import your workouts
5. The system will automatically extract:
   - Distance, pace, and duration
   - Elevation gain
   - Heart rate data (if available)
   - GPS track points
   - Activity type

**Supported Formats:**
- **GPX** (GPS Exchange Format) - From Garmin, Strava, and other GPS devices
- **FIT** (Flexible and Interoperable Data Transfer) - From Garmin watches and bike computers

**Features:**
- Single or multiple file upload
- Duplicate detection
- Automatic workout type detection
- Detailed metrics extraction

---

## 🛠️ Useful Commands

```bash
# Development
pnpm dev              # Run all apps (frontend + backend)
pnpm dev:web          # Run frontend only
pnpm dev:api          # Run backend only (needs DATABASE_URL)

# Database
pnpm db:push          # Push Prisma schema to database
pnpm db:migrate       # Create migration
pnpm db:seed          # Seed sample workouts
pnpm db:studio        # Open Prisma Studio GUI

# Docker
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop services
docker-compose ps     # Check status
docker-compose logs   # View logs

# Build
pnpm build            # Build all packages
pnpm typecheck        # Check TypeScript errors
```

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### "Cannot connect to database"

```bash
# Verify Docker is running
docker-compose ps

# Restart services
docker-compose down
docker-compose up -d
```

### "GEMINI_API_KEY not configured"

Make sure you added your API key to `/apps/api/.env` and restarted the backend.

### Multiple backend processes running

```bash
# List all node processes
ps aux | grep node

# Kill specific process
kill -9 <PID>
```

---

## 📊 Current Features

✅ **Implemented:**
- Multi-user authentication with Better Auth
- User-specific workout isolation and security
- Dashboard with workout analytics (charts, stats)
- Real API integration with PostgreSQL
- OCR upload with Gemini AI Vision
- Workout CRUD operations
- Splits tracking
- Docker infrastructure
- **Strava OAuth integration** - Connect Strava account and import activities
- **GPX/FIT file upload** - Import workouts from GPS files (Garmin, Polar, Suunto, etc.)

🚧 **In Progress:**
- BullMQ job workers for async OCR
- Stripe subscription payments (FREE/PRO/ENTERPRISE tiers)

📅 **Planned for Future Releases:**
- **Garmin Connect integration** - Similar to Strava, will support OAuth and activity sync
- Advanced AI analytics
- Mobile app (React Native)

---

## 📁 Database Models

See `/packages/database/prisma/schema.prisma` for complete schema.

**Main models:**
- `User` - User accounts and authentication
- `Workout` - Workout sessions with metrics
- `Split` - Lap/split data for each workout
- `Integration` - Third-party service connections

---

## 🤝 Contributing

This is a personal project but feel free to submit issues or PRs!

## 📄 License

MIT
