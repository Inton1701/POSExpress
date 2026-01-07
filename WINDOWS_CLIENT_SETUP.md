# Windows Client Setup Guide

## Making `posexpress.local` Work on Windows

Your Ubuntu server with mDNS (Avahi) is working correctly! Windows just needs a small addition to support `.local` domains.

---

## ✅ Solution: Install Bonjour (2 minutes)

Bonjour is Apple's mDNS implementation for Windows - the same technology Raspberry Pi uses (just called "Avahi" on Linux).

### Option 1: Bonjour Print Services (Lightweight)

**Download & Install:**
1. Download: https://support.apple.com/kb/DL999
2. Run `BonjourPSSetup.exe`
3. Click "Next" → "Install" → "Finishs"
4. **Done!** No restart needed.

**Test:**
```cmd
ping posexpress.local
```

Should now work reliably!

### Option 2: Install iTunes (Already includes Bonjour)

If you use iTunes, Bonjour is already installed.

---

## 🎯 What This Does

**Without Bonjour:**
- Windows can only access: `http://192.168.1.49` ❌

**With Bonjour:**
- Windows can access: `http://posexpress.local` ✅
- Works even if server IP changes!
- Same experience as Mac/Linux/Raspberry Pi

---

## 📱 Other Devices

- **Android**: Works automatically ✅
- **iOS**: Works automatically ✅
- **Mac**: Works automatically ✅
- **Linux**: Works automatically ✅
- **Windows**: Needs Bonjour (one-time install) ⚙️

---

## 🔧 Silent Installation (For IT/Multiple PCs)

Deploy Bonjour silently across multiple Windows machines:

```cmd
# Download installer first
BonjourPSSetup.exe /quiet /norestart
```

Or via PowerShell:
```powershell
# Download
Invoke-WebRequest -Uri "https://support.apple.com/downloads/DL999/en_US/BonjourPSSetup.exe" -OutFile "BonjourPSSetup.exe"

# Install silently
Start-Process -FilePath "BonjourPSSetup.exe" -ArgumentList "/quiet","/norestart" -Wait
```

---

## ✅ Verification

After installation:

```cmd
# Test mDNS resolution
ping posexpress.local

# Test web access
curl http://posexpress.local
```

Both should work!

---

## 🌐 How It Works (Technical)

**mDNS (Multicast DNS):**
- Ubuntu server broadcasts: "I am posexpress.local at 192.168.1.X"
- Clients listen for broadcasts on 224.0.0.251:5353
- No router configuration needed!
- Works even when DHCP changes server IP

**Same as Raspberry Pi:**
- Raspberry Pi: Avahi (built-in) → broadcasts as `raspberrypi.local`
- Your Ubuntu: Avahi (installed via setup-mdns.sh) → broadcasts as `posexpress.local`
- Windows: Needs Bonjour to receive broadcasts

---

## 🚀 Access Your POS System

After Bonjour installation:

**Web Browser:**
```
http://posexpress.local
```

**API:**
```
http://posexpress.local/api
```

**Desktop App:**
- Built-in Electron app connects to `posexpress.local/api`
- No configuration needed!

---

## 📝 Summary

**Server (Ubuntu) - Already Done ✅**
```bash
./setup-mdns.sh  # Already configured mDNS
```

**Clients (Windows) - One-Time Setup**
```
1. Download Bonjour: https://support.apple.com/kb/DL999
2. Install (2 minutes)
3. Done! posexpress.local now works
```

**That's it! Your system now has Raspberry Pi-style dynamic IP resolution across all devices!** 🎉

---

## 🆘 Troubleshooting

**If `posexpress.local` still doesn't resolve:**

1. **Restart Windows** (sometimes needed after Bonjour install)

2. **Check Bonjour service:**
   - Press `Win + R`, type `services.msc`
   - Look for "Bonjour Service"
   - Status should be "Running"

3. **Firewall:**
   - Allow UDP port 5353
   - Usually works automatically

4. **Verify from Ubuntu server:**
   ```bash
   avahi-browse -a
   # Should show posexpress.local
   ```

**Still issues?** Use IP as fallback: `http://192.168.1.49`
