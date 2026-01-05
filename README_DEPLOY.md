# RFID POS - Deployment Guide

## What's Fixed

✅ Web server: Nginx in Docker
✅ Windows app: .exe installer & portable 
✅ Linux app: AppImage & .deb
✅ Ubuntu LAN deployment ready

---

## DHCP & Domain Configuration (mDNS)

Like Raspberry Pi, your Ubuntu server gets a `.local` domain that works on all LAN computers, even when IP changes.

### Setup mDNS

```bash
# 1. Install avahi (mDNS service)
sudo apt install -y avahi-daemon avahi-utils

# 2. Set hostname
sudo hostnamectl set-hostname posexpress

# 3. Verify it works
hostname -f
# Should show: posexpress.local

# 4. Reboot to apply
sudo reboot
```

### Access from Any Computer on LAN

After setup, access from any device connected to same WiFi/network:

**Web App:** http://posexpress.local  
**API:** http://posexpress.local/api/health

Works on:
- Windows computers
- Mac computers  
- Linux machines
- Tablets
- Phones

**Even if IP changes, domain always works!**

### How It Works

- mDNS broadcasts your hostname on the network
- `.local` is resolved automatically by all modern devices
- No router configuration needed
- Works like Raspberry Pi's `raspberrypi.local`

---

## Deploy on Ubuntu (Docker)

### 1. Install Docker
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER  # optional
```

### 2. Deploy
```bash
git clone <your-repo> /opt/POSExpress
cd /opt/POSExpress
docker compose up --build -d

# Check status
docker compose ps
```

### 3. Access (via mDNS)
- Web: **http://posexpress.local**
- API: **http://posexpress.local/api/health**

> **Note:** If you need a custom domain (like posexpress.app), configure your router DNS or edit `/etc/hosts` on client machines. But with mDNS, `.local` works automatically!

---

## Deploy Natively (Without Docker)

Perfect for production deployment on Ubuntu/Linux using systemd for process management.

### Quick Deploy (Automated)

The fastest way to deploy using automated scripts:

#### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx
```

#### 2. Deploy Backend (Automated)

```bash
cd /path/to/RFID-POS
sudo bash deploy-backend.sh
```

**What it does:**
- Installs dependencies
- Generates secure JWT secret
- Configures .env file
- Creates systemd service (`posexpress-backend`)
- Enables auto-start on boot
- Creates admin user

#### 3. Deploy Frontend (Automated)

```bash
sudo bash deploy-frontend.sh
```

**What it does:**
- Builds Vue.js web app
- Deploys to Nginx (port 80)
- Builds Electron app (AppImage + .deb)
- Creates systemd service (`posexpress-frontend`)
- Enables auto-start on boot
- Creates desktop entry

### Access Application

- **Web:** http://posexpress.local
- **API:** http://posexpress.local/api/health
- **Desktop:** Launch "RFID POS Express" from Applications menu

### System Architecture

```
System Boot
    ↓
┌──────────────┬──────────────┐
│   Backend    │   Frontend   │
│  (systemd)   │  (systemd)   │
│  Port: 5000  │  Auto-open   │
│  Auto-start  │  Desktop App │
└──────────────┴──────────────┘
```

### Service Management

#### Backend Service

```bash
# Start
sudo systemctl start posexpress-backend

# Stop
sudo systemctl stop posexpress-backend

# Restart
sudo systemctl restart posexpress-backend

# Status
sudo systemctl status posexpress-backend

# View logs (real-time)
sudo journalctl -u posexpress-backend -f

# Disable auto-start
sudo systemctl disable posexpress-backend
```

#### Frontend Service (Electron)

```bash
# Start
sudo systemctl start posexpress-frontend

# Stop
sudo systemctl stop posexpress-frontend

# Restart
sudo systemctl restart posexpress-frontend

# Status
sudo systemctl status posexpress-frontend

# View logs (real-time)
sudo journalctl -u posexpress-frontend -f

# Disable auto-start
sudo systemctl disable posexpress-frontend
```

#### Nginx (Web Server)

```bash
# Status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

#### MongoDB

```bash
# Status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod

# Access database
mongosh

# Backup database
mongodump --db posexpress --out ~/backups/mongo-$(date +%Y%m%d)
```

### Updating the System

#### Full System Update

```bash
# Stop services
sudo systemctl stop posexpress-frontend
sudo systemctl stop posexpress-backend

# Pull latest code
cd /path/to/RFID-POS
git pull

# Redeploy
sudo bash deploy-backend.sh
sudo bash deploy-frontend.sh
```

#### Backend Only

```bash
sudo systemctl stop posexpress-backend
cd backend
npm install
sudo systemctl start posexpress-backend
```

#### Frontend Only

```bash
sudo systemctl stop posexpress-frontend
sudo bash deploy-frontend.sh
```

### Troubleshooting

#### Backend Not Starting

```bash
# Check logs
sudo journalctl -u posexpress-backend -n 50

# Common issues:
# 1. MongoDB not running
sudo systemctl start mongod

# 2. Port already in use
sudo lsof -i :5000

# 3. Permission issues
sudo chown -R $USER:$USER backend/
```

#### Frontend Not Starting

```bash
# Check logs
sudo journalctl -u posexpress-frontend -n 50

# Common issues:
# 1. Backend not running
sudo systemctl status posexpress-backend

# 2. Display not set
echo $DISPLAY  # Should output :0

# 3. X authority issues
xhost +local:
```

#### Web Version Not Accessible

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check port 80
sudo lsof -i :80

# Restart Nginx
sudo systemctl restart nginx
```

### Manual Desktop App Launch

If you don't want auto-start:

```bash
# Find the AppImage
find /path/to/RFID-POS/frontend/dist-electron -name "*.AppImage"

# Run it
/path/to/app.AppImage --no-sandbox

# Or install .deb and launch from menu
sudo dpkg -i /path/to/frontend/dist-electron/*.deb
```

### Backup and Restore

#### Backup

```bash
# Backup MongoDB
mongodump --db posexpress --out ~/backups/mongo-$(date +%Y%m%d)

# Backup configuration
cp backend/.env ~/backups/env-$(date +%Y%m%d)

# Backup uploads/assets
tar -czf ~/backups/uploads-$(date +%Y%m%d).tar.gz backend/public
```

#### Restore

```bash
# Restore MongoDB
mongorestore --db posexpress ~/backups/mongo-YYYYMMDD/posexpress

# Restore configuration
cp ~/backups/env-YYYYMMDD backend/.env

# Restore uploads
tar -xzf ~/backups/uploads-YYYYMMDD.tar.gz -C backend/
```

### Why systemd Instead of PM2?

✅ **Native Integration** - Works seamlessly with Linux  
✅ **Better Logging** - Integrated with journalctl  
✅ **Auto-start** - Reliable boot-time startup  
✅ **Resource Management** - Better process control  
✅ **No Dependencies** - No need to install PM2  
✅ **Standard Tool** - Used by most Linux distributions

---

## Common Commands (Docker)

```bash
# View logs
docker compose logs -f

# Stop everything
docker compose down

# Restart
docker compose restart

# Backup database
docker exec posexpress-db mongodump --out /data/backup

# Update code
git pull
docker compose up --build -d
```

---

## Build Desktop Apps

**Windows EXE:**
```bash
cd frontend && npm install && npm run build:electron:win
# Output: frontend/dist-electron/RFID-POS-System-Setup-*.exe
```

**Linux AppImage:**
```bash
cd frontend && npm install && npm run build:electron:linux
# Output: frontend/dist-electron/RFID-POS-System-*.AppImage
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't reach posexpress.local | Verify mDNS: `avahi-browse -a` on server, check firewall allows port 5353 UDP |
| Services won't start | Run `docker compose logs` to see errors |
| API connection error | Check backend: `curl http://posexpress.local/api/health` |
| Database issue | Restart: `docker compose restart posexpress-db` |

---

## Files Changed

- `frontend/Dockerfile` - Nginx web server
- `frontend/nginx.conf` - Web server config
- `frontend/.env` - Set to `http://posexpress.app/api`
- `docker-compose.yml` - Production setup
- `frontend/package.json` - Windows & Linux builds
- `backend/Dockerfile` - Optimized
- `backend/app.js` - Health check endpoint

---

**That's it! Deploy and done.** 🚀
