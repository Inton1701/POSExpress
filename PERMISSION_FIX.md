# Permission Issues - Quick Fix Guide

## Problem
You're seeing these errors:
```
Operation not permitted
insufficient permission for adding an object to repository database
```

## Root Cause
The repository files are owned by a different user (likely root or Administrator), preventing the current user from modifying them.

## Solution

### On Linux Server:

Run the fix-permissions script with sudo:

```bash
cd /home/posexpress/Desktop/POSExpress
sudo ./fix-permissions.sh
```

This will:
- ✓ Fix ownership for all files
- ✓ Repair .git directory permissions
- ✓ Make all .sh scripts executable
- ✓ Fix git repository integrity

### Manual Fix (Alternative):

If the script doesn't work, run these commands:

```bash
# Fix ownership (replace 'posexpress' with your username)
sudo chown -R posexpress:posexpress /home/posexpress/Desktop/POSExpress

# Fix git permissions
sudo chmod -R u+rwX /home/posexpress/Desktop/POSExpress/.git

# Make scripts executable
chmod +x /home/posexpress/Desktop/POSExpress/*.sh
```

### After Fixing:

1. **Test git operations:**
   ```bash
   git pull
   ```

2. **Test auto-update:**
   ```bash
   ./auto-update.sh
   ```

3. **Or use the web UI:**
   - Go to Admin → Settings
   - Click "Check for Updates"
   - Click "Install Update"

## Prevention

**When deploying on Linux:**

1. Always deploy as the same user that runs the application
2. Avoid using `sudo` when cloning/pulling from git
3. Run `./fix-permissions.sh` after any sudo operations

**When using auto-update:**

The system now handles permission errors gracefully, but files must be writable by the user running PM2.

## Common Scenarios

### Scenario 1: Deployed as root, running as normal user
```bash
sudo ./fix-permissions.sh  # Fix ownership
```

### Scenario 2: Multiple users accessing the repo
```bash
sudo chgrp -R developers /path/to/POSExpress
sudo chmod -R g+rwX /path/to/POSExpress
```

### Scenario 3: Auto-update fails with "Operation not permitted"
```bash
sudo ./fix-permissions.sh  # Then try update again
```

## Verification

After fixing, verify with:

```bash
# Check ownership
ls -la | head

# Check git status
git status

# Check script permissions
ls -l *.sh

# All should show your username as owner with correct permissions
```

## Need Help?

If issues persist:
1. Check current user: `whoami`
2. Check file owner: `ls -l auto-update.sh`
3. Check git config: `ls -l .git/config`
4. Run: `sudo ./fix-permissions.sh`
5. Restart PM2: `pm2 restart posexpress-backend`
