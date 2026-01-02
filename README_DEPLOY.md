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

Perfect for local development or running directly on your Ubuntu/Linux machine.

### 1. Install Dependencies

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

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Setup Backend (API)

```bash
# Clone or navigate to project
cd ~/POSExpress/backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/posexpress
JWT_SECRET=your-secret-key-here-change-this
NODE_ENV=production
EOF

# Start with PM2
pm2 start app.js --name posexpress-backend
pm2 save
pm2 startup  # Follow the command it gives you
```

### 3. Setup Frontend (Web)

```bash
cd ~/POSExpress/frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://posexpress.local/api
EOF

# Build for production
npm run build

# Copy to Nginx
sudo rm -rf /var/www/html
sudo cp -r dist /var/www/html
sudo chown -R www-data:www-data /var/www/html
```

### 4. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/posexpress
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name posexpress.local;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and restart:

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/posexpress /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Create Admin User

```bash
cd ~/POSExpress/backend
node seedAdmin.js
```

### 6. Access Application

- **Web:** http://posexpress.local
- **API:** http://posexpress.local/api/health

### Native Management Commands

```bash
# Backend
pm2 status                    # Check status
pm2 logs posexpress-backend     # View logs
pm2 restart posexpress-backend  # Restart
pm2 stop posexpress-backend     # Stop
pm2 delete posexpress-backend   # Remove

# Frontend
cd ~/POSExpress/frontend
npm run build                 # Rebuild
sudo cp -r dist/* /var/www/html/  # Update

# Nginx
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart
sudo nginx -t                 # Test config

# MongoDB
sudo systemctl status mongod  # Check status
sudo systemctl restart mongod # Restart
mongosh                       # Access database

# Backup database
mongodump --out ~/backup/$(date +%Y%m%d)
```

### Run Electron Desktop App (Linux)

Instead of accessing via browser, run the native desktop app:

```bash
cd ~/POSExpress/frontend

# Development mode
npm run electron:dev

# Or build and install
npm run build:electron:linux

# Install the AppImage
sudo chmod +x dist-electron/*.AppImage
./dist-electron/*.AppImage

# Or install the .deb package
sudo dpkg -i dist-electron/*.deb
```

The Electron app will automatically connect to your local API at `http://localhost:5000/api` or `http://posexpress.local/api`.

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
