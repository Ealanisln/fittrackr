# FitTrackr Deployment - Quick Reference

**Domain**: fittrackr.me
**API**: api.fittrackr.me

## Files Created

All deployment files have been created and are ready to use:

### Docker Configuration
- `apps/api/Dockerfile` - API service Docker configuration
- `apps/web/Dockerfile` - Web frontend Docker configuration
- `apps/web/nginx.conf` - Nginx configuration for serving the frontend
- `docker-compose.prod.yml` - Production docker-compose configuration
- `.dockerignore` - Optimizes Docker builds by excluding unnecessary files

### Environment & Documentation
- `.env.production.example` - Template for production environment variables
- `DEPLOYMENT.md` - Complete deployment guide for Coolify
- Enhanced health check endpoint at `apps/api/src/index.ts:26` with DB and Redis checks

## Quick Start Checklist

### 1. Before Deployment
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required environment variables (see below)
- [ ] Push your code to a Git repository (GitHub, GitLab, etc.)
- [ ] Ensure your domain DNS is configured

### 2. Required Environment Variables
```bash
# Generate these first
AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>

# Set your domains
AUTH_URL=https://api.fittrackr.me
CLIENT_URL=https://fittrackr.me
VITE_API_URL=https://api.fittrackr.me

# Add your API keys
OPENAI_API_KEY=sk-...
```

### 3. Coolify Deployment Steps

#### Option A: Docker Compose (Recommended)
1. In Coolify: New Resource → Docker Compose
2. Connect your Git repository
3. Use `docker-compose.prod.yml`
4. Add all environment variables
5. Configure domains:
   - Web: `fittrackr.me` → port 80
   - API: `api.fittrackr.me` → port 3001
6. Deploy!

#### Option B: Individual Services
Deploy in this order:
1. PostgreSQL (Database resource)
2. Redis (Database resource)
3. API (Application with `apps/api/Dockerfile`)
4. Web (Application with `apps/web/Dockerfile`)

### 4. Post-Deployment
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Run database migrations
docker exec -it fittrack-api sh
cd packages/database
npx prisma migrate deploy
exit

# Verify health
curl https://api.fittrackr.me/health
```

## Architecture

```
┌─────────────────────────────────────────┐
│            Users/Clients                │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼────┐      ┌────▼────┐
   │   Web   │      │   API   │
   │ (Nginx) │      │(Node.js)│
   │  :80    │      │  :3001  │
   └─────────┘      └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │ Postgres│          │  Redis  │
         │  :5432  │          │  :6379  │
         └─────────┘          └─────────┘
```

## Health Check

The API now includes a comprehensive health check endpoint:

**Endpoint**: `GET /health`

**Response** (when healthy):
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T12:00:00.000Z",
  "services": {
    "api": "ok",
    "database": "ok",
    "redis": "ok"
  }
}
```

**Status codes**:
- `200`: All services healthy
- `503`: One or more services degraded

## Volumes & Persistence

The following data is persisted:
- PostgreSQL data: `postgres_data` volume
- Redis data: `redis_data` volume
- API uploads: `api_uploads` volume (mounted at `/app/uploads`)

## Monitoring Commands

```bash
# View logs
docker logs -f fittrackr-api
docker logs -f fittrackr-web
docker logs -f fittrackr-postgres

# Check container status
docker ps | grep fittrackr

# Database backup
docker exec fittrackr-postgres pg_dump -U postgres fittrack > backup.sql

# Restart service
docker restart fittrackr-api
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails | Check Dockerfile syntax and package.json dependencies |
| API won't start | Verify DATABASE_URL and REDIS_URL are correct |
| Can't connect to DB | Ensure PostgreSQL container is running and accessible |
| 502 Bad Gateway | API service might not be running or health check failing |
| CORS errors | Check CLIENT_URL matches your frontend domain |

## Security Checklist

- [ ] Strong passwords for all services
- [ ] AUTH_SECRET is at least 32 characters
- [ ] SSL/TLS enabled for both domains
- [ ] Environment variables marked as encrypted in Coolify
- [ ] Firewall configured (only ports 80, 443, 22)
- [ ] Database backups enabled
- [ ] Regular security updates scheduled

## Performance Tips

1. Enable Redis caching for frequently accessed data
2. Set up database indexes on frequently queried fields
3. Use a CDN for static assets
4. Monitor resource usage in Coolify
5. Scale horizontally by adding more API instances if needed

## Next Steps

1. Deploy to Coolify using the steps above
2. Run database migrations
3. Test the health endpoint
4. Create your first user account
5. Configure OAuth (Strava/Google Fit) if needed
6. Set up automated backups
7. Configure monitoring and alerts

## Support

For detailed instructions, see `DEPLOYMENT.md`

For issues:
1. Check logs first
2. Review troubleshooting section in DEPLOYMENT.md
3. Verify all environment variables are set correctly
4. Open an issue on GitHub if needed

---

**Ready to deploy!** Follow the checklist above and refer to `DEPLOYMENT.md` for detailed instructions.
