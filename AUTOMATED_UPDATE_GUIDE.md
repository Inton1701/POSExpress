# Automated System Update - User Guide

## Overview

The RFID POS system now supports **fully automated updates** via the web GUI. When you click "Install Update" in the Settings page, the system will:

1. ✅ **Automatically download** the latest version from GitHub
2. ✅ **Backup** the current version (for revert capability)
3. ✅ **Update backend** - Install dependencies and restart service
4. ✅ **Update frontend** - Rebuild Vue app and deploy to Nginx
5. ✅ **Rebuild Electron app** - Create new Linux AppImage
6. ✅ **Update systemd services** - Configure auto-start
7. ✅ **Restart everything** - All services restart automatically
8. ✅ **Reopen app** - Electron app launches automatically

**No prompts, no manual intervention required!**

---

## Features

### 1. **One-Click Updates**
- Click "Check for Updates" in Settings → System Updates
- If update available, click "Install Update (Auto)"
- System updates and restarts automatically
- Application reopens in 30-60 seconds

### 2. **Configuration Preservation**
- `.env` files are preserved (backend and frontend)
- Ports and API URLs remain unchanged
- Services configuration maintained
- Auto-login and auto-start settings kept

### 3. **Automatic Backups**
- Every update creates a backup in `~/posexpress-backups/`
- Backups include: backend, frontend, VERSION file, and metadata
- Last 5 backups are kept automatically
- Older backups are cleaned up to save space

### 4. **Revert Capability**
- View all available backups in Settings → System Updates
- Click "Load Backups" to see restore points
- Click "Revert" on any backup to restore that version
- System automatically reverts and restarts

---

## How to Use

### Update System (Web GUI)

1. **Login as Admin** to the web interface
2. **Navigate to**: Settings → System Updates tab
3. **Click**: "Check for Updates"
4. **If update available**:
   - Review release notes
   - Click "Install Update (Auto)"
   - Wait 30-60 seconds for system to restart
   - Application will reopen automatically

### Revert to Previous Version

1. **Login as Admin** to the web interface
2. **Navigate to**: Settings → System Updates tab
3. **Click**: "Load Backups"
4. **Select** the backup version you want to restore
5. **Click**: "Revert" button
6. **Confirm** the action
7. Wait 30-60 seconds for system to restore and restart

### Manual Update (Command Line)

If you prefer manual updates or the web GUI is not accessible:

```bash
cd /path/to/RFID-POS
sudo bash update-system.sh
```

This runs the same automated update process from the command line.

---

## Scripts

### 1. `update-system.sh` - Automated Update
**Location**: `/path/to/RFID-POS/update-system.sh`

**What it does**:
- Checks for latest version on GitHub
- Creates backup of current version
- Downloads and extracts new version
- Preserves all `.env` files
- Updates backend dependencies
- Rebuilds frontend and Electron app
- Updates systemd services
- Restarts all services automatically

**Usage**:
```bash
sudo bash update-system.sh
```

**Logs**: `/var/log/posexpress-update.log`

### 2. `revert-update.sh` - Restore Previous Version
**Location**: `/path/to/RFID-POS/revert-update.sh`

**What it does**:
- Stops all services
- Backs up current state (before revert)
- Restores selected backup version
- Rebuilds everything
- Restarts all services

**Usage**:
```bash
sudo bash revert-update.sh <backup-folder-name>

# Example:
sudo bash revert-update.sh v1.1.11-20260107-143022
```

**Logs**: `/var/log/posexpress-revert.log`

---

## Backup Structure

Backups are stored in: `~/posexpress-backups/`

**Folder format**: `v{VERSION}-{TIMESTAMP}`
- Example: `v1.1.11-20260107-143022`

**Each backup contains**:
- `backend/` - Complete backend code and .env
- `frontend/` - Complete frontend code, dist, and .env
- `VERSION` - Version number file
- `metadata.json` - Backup information

**metadata.json example**:
```json
{
  "version": "1.1.11",
  "timestamp": "20260107-143022",
  "date": "2026-01-07T14:30:22+08:00",
  "services_status": {
    "backend": "active",
    "frontend": "active"
  }
}
```

---

## Configuration Files Preserved

The following files are **automatically preserved** during updates:

| File | Purpose |
|------|---------|
| `backend/.env` | Database URI, JWT secret, port configuration |
| `frontend/.env` | API URL configuration |
| Systemd services | Auto-start configuration |
| Auto-login settings | Display manager configuration |
| Sudoers rules | Passwordless reboot/shutdown |

---

## API Endpoints

### Backend Endpoints (for developers)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/version` | GET | Get current version |
| `/api/system/check-updates` | GET | Check for updates on GitHub |
| `/api/system/update` | POST | Trigger automated update |
| `/api/system/backups` | GET | List available backups |
| `/api/system/revert` | POST | Revert to specific backup |
| `/api/system/reboot` | POST | Reboot system (admin only) |
| `/api/system/shutdown` | POST | Shutdown system (admin only) |

---

## Troubleshooting

### Update Fails

**Check logs**:
```bash
tail -f /var/log/posexpress-update.log
```

**Manual recovery**:
1. Check if services are running:
   ```bash
   sudo systemctl status posexpress-backend
   sudo systemctl status posexpress-frontend
   ```

2. If backend failed:
   ```bash
   cd backend
   npm install
   sudo systemctl restart posexpress-backend
   ```

3. If frontend failed:
   ```bash
   cd frontend
   npm install
   npm run build
   npm run electron:build
   sudo systemctl restart posexpress-frontend
   ```

### Revert Fails

**Check logs**:
```bash
tail -f /var/log/posexpress-revert.log
```

**Manual recovery**:
List available backups:
```bash
ls -la ~/posexpress-backups/
```

Manually restore a backup:
```bash
cd /path/to/RFID-POS
sudo cp -r ~/posexpress-backups/v1.1.11-20260107-143022/* .
# Then follow manual update steps above
```

### Services Won't Start

**Check service status**:
```bash
sudo systemctl status posexpress-backend
sudo systemctl status posexpress-frontend
```

**View detailed logs**:
```bash
sudo journalctl -u posexpress-backend -n 50
sudo journalctl -u posexpress-frontend -n 50
```

**Restart services**:
```bash
sudo systemctl restart posexpress-backend
sudo systemctl restart posexpress-frontend
```

---

## Comparison: Manual vs Automated

| Feature | Manual (`deploy-*.sh`) | Automated (`update-system.sh`) |
|---------|------------------------|--------------------------------|
| User prompts | ❌ Many prompts | ✅ Zero prompts |
| Configuration | ❌ Ask for .env values | ✅ Reuses existing |
| Services | ❌ Ask to enable | ✅ Auto-configured |
| Auto-login | ❌ Prompts for setup | ✅ Preserved |
| Electron rebuild | ❌ Ask to build | ✅ Auto-rebuilt |
| Backup creation | ❌ Manual | ✅ Automatic |
| Revert capability | ❌ Not available | ✅ Built-in |
| Web GUI integration | ❌ No | ✅ Yes |
| Execution time | ~5-10 min (with prompts) | ~2-3 min (automated) |

---

## Security Notes

- Update scripts require `sudo` privileges
- Scripts create detailed logs for audit trail
- Backups are stored in user's home directory (protected)
- `.env` files with secrets are preserved but not logged
- Systemd services run as non-root user
- Auto-login is optional and can be disabled

---

## Best Practices

1. **Always check release notes** before updating
2. **Verify backups** are being created (check `~/posexpress-backups/`)
3. **Test updates** on a non-production system first
4. **Keep at least 3-5 backups** for safety
5. **Monitor logs** during and after updates
6. **Plan updates** during low-traffic periods

---

## For Developers

### Adding Update Automation to Your Workflow

The automated update system can be triggered via:

1. **Web GUI** - User-friendly interface
2. **API Call** - For programmatic updates
3. **Command Line** - For CI/CD integration
4. **Cron Job** - For scheduled updates (not recommended for production)

### Testing Updates Locally

```bash
# Test update script (dry run)
sudo bash update-system.sh

# Test revert
ls ~/posexpress-backups/
sudo bash revert-update.sh <backup-folder>
```

### Creating Custom Backup

```bash
BACKUP_DIR="$HOME/posexpress-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
VERSION=$(cat VERSION)
mkdir -p "$BACKUP_DIR/v$VERSION-$TIMESTAMP"
cp -r backend frontend VERSION "$BACKUP_DIR/v$VERSION-$TIMESTAMP/"
```

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/Inton1701/POSExpress/issues
- **Documentation**: Check `README.md` and other `.md` files
- **Logs**: Always check `/var/log/posexpress-*.log`

---

**Version**: 1.0  
**Last Updated**: January 7, 2026  
**Compatible with**: RFID POS v1.1.11+
