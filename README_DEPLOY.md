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

## Deploy on Ubuntu (posexpress.app)

### 1. Install Docker
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER  # optional
```

### 2. Configure Domain
Edit your **router DNS** or on Ubuntu:
```bash
sudo nano /etc/hosts
# Add this line (replace 192.168.1.100 with your server IP):
192.168.1.100 posexpress.app
```

### 3. Deploy
```bash
git clone <your-repo> /opt/rfid-pos
cd /opt/rfid-pos
docker compose up --build -d

# Check status
docker compose ps
```

### 4. Access
- Web: **http://posexpress.app**
- API: **http://posexpress.app/api/health**

---

## Common Commands

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
| Can't reach posexpress.app | Check `/etc/hosts` has correct IP |
| Services won't start | Run `docker compose logs` to see errors |
| API connection error | Check backend: `curl http://posexpress.app/api/health` |
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
