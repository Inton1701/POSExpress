# Docker & Deployment Commands Reference

Quick reference for common Docker and deployment commands.

## Docker Compose Basics

### Start Services
```bash
# Start all services (build if needed)
docker compose up --build -d

# Start without rebuilding
docker compose up -d

# View running services
docker compose ps

# View all services (including stopped)
docker compose ps -a
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop and remove all data (WARNING: deletes database!)
docker compose down -v

# Stop specific service
docker compose stop posexpress-api

# Restart specific service
docker compose restart posexpress-api
```

### Logs & Monitoring
```bash
# View all logs (live)
docker compose logs -f

# View last 100 lines
docker compose logs --tail 100

# View specific service logs
docker compose logs -f posexpress-api
docker compose logs -f posexpress-web
docker compose logs -f posexpress-db

# Save logs to file
docker compose logs > logs.txt

# View real-time resource usage
docker stats
```

## Service Status

### Check Health
```bash
# View service status and health
docker compose ps

# Test API endpoint
curl http://localhost:5000/api/health

# Test web server
curl http://localhost

# Check specific service
docker compose ps posexpress-api
```

### Service Details
```bash
# Get detailed container information
docker compose inspect posexpress-api

# View container network info
docker network ls
docker network inspect rfid-pos_app-net

# View volumes
docker volume ls
docker volume inspect rfid-pos_mongodb_data
```

## Database Operations

### MongoDB
```bash
# Access MongoDB shell
docker compose exec posexpress-db mongosh

# List databases
docker compose exec posexpress-db mongosh --eval "show dbs"

# Backup database
docker exec posexpress-db mongodump --out /data/backup/$(date +%Y%m%d)

# Restore from backup
docker exec posexpress-db mongorestore /data/backup/20240101

# Delete all data
docker compose exec posexpress-db mongosh --eval "db.dropDatabase()"

# Database stats
docker compose exec posexpress-db mongosh --eval "db.stats()"
```

## Maintenance

### Clean Up
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (be careful!)
docker system prune -a
```

### Update & Rebuild
```bash
# Pull latest images
docker compose pull

# Rebuild services (uses cache)
docker compose build

# Rebuild without cache
docker compose build --no-cache

# Full rebuild and restarts
docker compose down
docker compose up --build -d
```

### Scaling
```bash
# Run multiple backend instances
docker compose up --scale posexpress-api=3 -d

# Note: Frontend should remain 1 instance (Nginx handles routing)
```

## Troubleshooting Commands

### Find Issues
```bash
# See container errors
docker compose logs --tail 50 posexpress-api

# Check event logs
docker events --filter type=container

# Inspect container
docker compose inspect posexpress-api

# View container processes
docker compose top posexpress-api
```

### Fix Common Issues
```bash
# Service won't start - check logs first
docker compose logs posexpress-api

# Stuck service - kill and restart
docker compose kill posexpress-api
docker compose restart posexpress-api

# Network issues - restart network
docker compose down
docker network prune
docker compose up -d

# Database corrupted - backup and reset
docker compose exec posexpress-db mongodump --out /data/backup
docker compose down -v
docker compose up -d

# Clear all containers
docker compose down
docker container prune -f
docker compose up --build -d
```

## Access Services

### Web Application
```bash
# Access web app
http://localhost

# View in curl
curl http://localhost

# With authentication
curl -H "Authorization: Bearer TOKEN" http://localhost/api/
```

### Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# With authentication
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/products

# Pretty print JSON
curl http://localhost:5000/api/health | json_pp
```

### MongoDB
```bash
# Connect to MongoDB
docker compose exec posexpress-db mongosh

# List all collections
db.getCollectionNames()

# Count documents
db.products.countDocuments()

# Find sample product
db.products.findOne()

# Exit mongosh
exit
```

## Environment & Configuration

### View Environment Variables
```bash
# Show all environment variables in service
docker compose exec posexpress-api env

# Show specific variable
docker compose exec posexpress-api env | grep MONGODB
```

### Check Configurations
```bash
# View Nginx config in container
docker compose exec posexpress-web cat /etc/nginx/nginx.conf

# View mounted volumes
docker volume inspect rfid-pos_mongodb_data

# Check network settings
docker inspect rfid-pos-posexpress-api
```

## Building Desktop Applications

### Windows EXE
```bash
# Build Windows installer and portable
cd frontend
npm run build:electron:win

# Output location
# frontend/dist-electron/RFID-POS-System-Setup-1.0.0.exe
# frontend/dist-electron/RFID-POS-System-1.0.0.exe
```

### Linux AppImage/DEB
```bash
# Build Linux packages
cd frontend
npm run build:electron:linux

# Output location
# frontend/dist-electron/RFID-POS-System-1.0.0.AppImage
# frontend/dist-electron/rfidpos-system-1.0.0.deb
```

### Build Scripts
```bash
# Linux/Mac - build all platforms
./build-all-platforms.sh

# Windows - build Windows EXE
build-windows.bat

# Manual - build specific platform
cd frontend
npm install
npm run build:electron:win
npm run build:electron:linux
```

## Docker Hub Operations (Optional)

### Push to Registry
```bash
# Tag images
docker tag posexpress-api:latest myregistry/posexpress-api:1.0.0
docker tag posexpress-web:latest myregistry/posexpress-web:1.0.0

# Push to registry
docker push myregistry/posexpress-api:1.0.0
docker push myregistry/posexpress-web:1.0.0

# Pull from registry
docker pull myregistry/posexpress-api:1.0.0
docker compose up -d
```

## Performance Monitoring

### Check Resource Usage
```bash
# Real-time stats
docker stats

# Container-specific stats
docker stats posexpress-api

# Historical stats
docker stats --no-stream

# Memory usage
docker ps -a --format "{{.Names}}\t{{.MemoryUsage}}"
```

### Monitor Logs Over Time
```bash
# Watch for errors
docker compose logs -f --since 10m | grep ERROR

# Count errors
docker compose logs | grep -c ERROR

# Get last 1000 lines
docker compose logs --tail 1000
```

## Production Deployment Commands

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/your/repo.git
cd RFID-POS

# 2. Create environment
cp frontend/.env.example frontend/.env
# Edit .env with production settings

# 3. Start services
docker compose -f docker-compose.yml up --build -d

# 4. Verify
docker compose ps
curl http://localhost/api/health
```

### SSL/HTTPS Setup
```bash
# 1. Install Certbot (Ubuntu/Debian)
sudo apt-get install certbot python3-certbot-nginx

# 2. Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Update nginx.conf with SSL settings
# See DEPLOYMENT_GUIDE.md for configuration

# 4. Reload Nginx
docker compose exec posexpress-web nginx -s reload
```

### Backup Before Updates
```bash
# Backup database
docker exec posexpress-db mongodump --out /data/backup/$(date +%Y%m%d_%H%M%S)

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up --build -d

# Verify
docker compose ps
curl http://localhost/api/health
```

## Common Scenarios

### Server Crash - Recovery
```bash
# 1. Check what's running
docker compose ps

# 2. View crash logs
docker compose logs --tail 100 posexpress-api

# 3. Restart the service
docker compose restart posexpress-api

# 4. If still failing, rebuild
docker compose down
docker compose up --build -d

# 5. Restore from backup if data corrupted
docker volume rm rfid-pos_mongodb_data
docker exec posexpress-db mongorestore /backup/latest
```

### Network Issues
```bash
# Test connectivity
docker compose exec posexpress-api curl http://backend:5000/api/health

# Check DNS resolution
docker compose exec posexpress-api nslookup mongodb

# Inspect network
docker network inspect rfid-pos_app-net

# Restart network
docker compose down
docker network prune
docker compose up -d
```

### Adding New Service
```bash
# Edit docker-compose.yml to add new service

# Apply changes
docker compose up --build -d

# Verify new service
docker compose ps
```

---

## Quick Command Summary

| Task | Command |
|------|---------|
| Start all | `docker compose up -d` |
| Stop all | `docker compose down` |
| View status | `docker compose ps` |
| View logs | `docker compose logs -f` |
| Backup DB | `docker exec posexpress-db mongodump --out /data/backup` |
| Restart service | `docker compose restart posexpress-api` |
| View health | `curl http://localhost:5000/api/health` |
| Clean up | `docker system prune -a` |
| Test connection | `docker compose exec posexpress-api curl mongodb:27017` |
| Build Windows | `cd frontend && npm run build:electron:win` |
| Build Linux | `cd frontend && npm run build:electron:linux` |

---

**For more information, see DEPLOYMENT_GUIDE.md and QUICK_START.md**
