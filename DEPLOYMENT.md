# FitTrackr Deployment Guide for Coolify

This guide will walk you through deploying FitTrackr to your VPS using Coolify.

**Domain**: fittrackr.me

## Prerequisites

- A VPS with Coolify installed
- Domain names configured (or you can use Coolify's generated domains)
- SSH access to your VPS
- Git repository with your FitTrack code

## Architecture Overview

FitTrackr consists of three main services:
- **PostgreSQL**: Database for storing user data and workouts
- **Redis**: Cache and queue management
- **API**: Node.js/Express backend API
- **Web**: React frontend (static files served by Nginx)

## Step 1: Prepare Your Environment Variables

1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in the required values:

### Critical Variables to Set:

```env
# Generate a secure secret (minimum 32 characters)
AUTH_SECRET=$(openssl rand -base64 32)

# Set your domain URLs
AUTH_URL=https://api.fittrackr.me
CLIENT_URL=https://fittrackr.me
VITE_API_URL=https://api.fittrackr.me

# Database credentials (use strong passwords)
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_USER=postgres
POSTGRES_DB=fittrack

# Redis password
REDIS_PASSWORD=<generate-strong-password>

# OpenAI API Key (for OCR enhancement)
OPENAI_API_KEY=sk-...

# OAuth Credentials (if using Strava/Google Fit)
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
GOOGLE_FIT_CLIENT_ID=your-google-fit-client-id
GOOGLE_FIT_CLIENT_SECRET=your-google-fit-client-secret
```

## Step 2: Coolify Setup

### Option A: Using Docker Compose (Recommended)

1. **Create a new project in Coolify**:
   - Go to your Coolify dashboard
   - Click "New Resource" → "Docker Compose"
   - Name it "FitTrackr"

2. **Configure Git Repository**:
   - Add your Git repository URL
   - Select the branch (e.g., `main`)
   - Set the base directory to `/` (root of your repo)

3. **Add the docker-compose file**:
   - Use the `docker-compose.prod.yml` file from this repository
   - Or paste the contents directly in Coolify

4. **Configure Environment Variables**:
   - In Coolify, go to your project's Environment Variables section
   - Add all variables from your `.env.production` file
   - Make sure to mark sensitive values as "Encrypted"

5. **Configure Domains**:
   - **Web Frontend**: `fittrackr.me` → Service: `web`, Port: `80`
   - **API Backend**: `api.fittrackr.me` → Service: `api`, Port: `3001`

6. **Deploy**:
   - Click "Deploy" button
   - Monitor the build logs for any errors

### Option B: Deploying Services Individually

If you prefer to deploy services separately:

#### 1. PostgreSQL Database

1. Create a new PostgreSQL database in Coolify:
   - Go to "New Resource" → "Database" → "PostgreSQL"
   - Set the database name, username, and password
   - Note down the connection details

#### 2. Redis Cache

1. Create a new Redis instance:
   - Go to "New Resource" → "Database" → "Redis"
   - Set a password
   - Note down the connection URL

#### 3. API Service

1. Create a new service:
   - Go to "New Resource" → "Application"
   - Connect your Git repository
   - Set build pack to "Dockerfile"
   - Set Dockerfile location to `apps/api/Dockerfile`

2. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<postgresql-connection-url>
   REDIS_URL=<redis-connection-url>
   AUTH_SECRET=<your-auth-secret>
   AUTH_URL=https://api.fittrackr.me
   CLIENT_URL=https://fittrackr.me
   OPENAI_API_KEY=<your-openai-key>
   ```

3. Configure domain: `api.fittrackr.me` → Port: `3001`

4. Add persistent volume for uploads:
   - Mount `/app/uploads` to a persistent volume

#### 4. Web Frontend

1. Create a new service:
   - Go to "New Resource" → "Application"
   - Connect your Git repository
   - Set build pack to "Dockerfile"
   - Set Dockerfile location to `apps/web/Dockerfile`

2. Build Arguments:
   ```
   VITE_API_URL=https://api.fittrackr.me
   ```

3. Configure domain: `fittrackr.me` → Port: `80`

## Step 3: Database Migration

After the API service is deployed, you need to run database migrations:

1. **SSH into your VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Find the API container**:
   ```bash
   docker ps | grep fittrack-api
   ```

3. **Run migrations**:
   ```bash
   docker exec -it <api-container-id> sh
   cd packages/database
   npx prisma migrate deploy
   ```

   Or if using docker-compose:
   ```bash
   docker-compose exec api sh -c "cd packages/database && npx prisma migrate deploy"
   ```

## Step 4: SSL/TLS Configuration

Coolify automatically handles SSL certificates through Let's Encrypt:

1. Make sure your domains are properly configured in DNS
2. Enable SSL in Coolify for both domains
3. Coolify will automatically obtain and renew certificates

## Step 5: Verify Deployment

1. **Check API health**:
   ```bash
   curl https://api.fittrackr.me/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "services": {
       "api": "ok",
       "database": "ok",
       "redis": "ok"
     }
   }
   ```

2. **Test the frontend**:
   - Visit `https://fittrackr.me`
   - You should see the FitTrackr login page

3. **Create a test user**:
   - Sign up with an email and password
   - Verify you can log in

## Step 6: Monitoring and Maintenance

### View Logs

In Coolify:
- Go to your service
- Click "Logs" tab to view real-time logs

Or via SSH:
```bash
# API logs
docker logs -f fittrackr-api

# Web logs
docker logs -f fittrackr-web

# PostgreSQL logs
docker logs -f fittrackr-postgres
```

### Database Backups

1. **Manual backup**:
   ```bash
   docker exec fittrackr-postgres pg_dump -U postgres fittrack > backup.sql
   ```

2. **Automated backups** (in Coolify):
   - Go to your PostgreSQL resource
   - Enable "Automatic Backups"
   - Set backup frequency and retention

### Updating the Application

1. **Push changes to Git**:
   ```bash
   git push origin main
   ```

2. **In Coolify**:
   - Go to your project
   - Click "Redeploy"
   - Or enable "Auto Deploy" to automatically deploy on git push

3. **Run migrations if needed**:
   ```bash
   docker exec -it fittrackr-api sh -c "cd packages/database && npx prisma migrate deploy"
   ```

## Troubleshooting

### API won't start

1. Check logs:
   ```bash
   docker logs fittrackr-api
   ```

2. Verify environment variables are set correctly

3. Ensure database is accessible:
   ```bash
   docker exec fittrackr-api sh -c "node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(console.error)\""
   ```

### Build failures

1. Check Dockerfile syntax
2. Verify all dependencies are listed in package.json
3. Check build logs in Coolify for specific errors

### Database connection issues

1. Verify DATABASE_URL is correct
2. Check if PostgreSQL container is running:
   ```bash
   docker ps | grep postgres
   ```

3. Test connection from API container:
   ```bash
   docker exec -it fittrackr-api sh
   nc -zv postgres 5432
   ```

### Redis connection issues

1. Verify REDIS_URL is correct
2. Check if Redis container is running:
   ```bash
   docker ps | grep redis
   ```

## Security Best Practices

1. **Use strong passwords** for all services
2. **Keep secrets encrypted** in Coolify
3. **Enable firewall** on your VPS (allow only 80, 443, and SSH)
4. **Regular updates**: Keep your containers updated
5. **Monitor logs** for suspicious activity
6. **Database backups**: Set up automated backups
7. **Rate limiting**: Consider adding rate limiting to your API

## Performance Optimization

1. **Enable caching** in Redis for frequently accessed data
2. **CDN**: Consider using a CDN for static assets
3. **Database indexing**: Ensure proper indexes on frequently queried fields
4. **Monitor resources**: Use Coolify's monitoring tools
5. **Horizontal scaling**: Add more API instances if needed

## Support

For issues or questions:
- Check the logs first
- Review this documentation
- Check the project README.md
- Open an issue on GitHub

---

**Last Updated**: January 2025
