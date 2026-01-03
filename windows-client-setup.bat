@echo off
REM RFID POS - Windows Bonjour Installer
REM Makes posexpress.local work on Windows

echo ========================================
echo   RFID POS - Windows Client Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: Please run as Administrator!
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo Checking for Bonjour...
sc query "Bonjour Service" >nul 2>&1

if %errorLevel% EQU 0 (
    echo [OK] Bonjour is already installed!
    echo.
    echo Testing posexpress.local...
    ping -n 1 posexpress.local >nul 2>&1
    if %errorLevel% EQU 0 (
        echo [SUCCESS] posexpress.local is accessible!
    ) else (
        echo [WARNING] Bonjour installed but posexpress.local not reachable
        echo Make sure Ubuntu server is running and on same network
    )
    pause
    exit /b 0
)

echo [INFO] Bonjour not found
echo.
echo Bonjour is required to access posexpress.local on Windows
echo (Same technology Raspberry Pi uses for .local domains)
echo.
echo Download options:
echo   1. Bonjour Print Services (lightweight, 2MB)
echo      https://support.apple.com/kb/DL999
echo.
echo   2. iTunes (includes Bonjour, 250MB+)
echo      https://www.apple.com/itunes/download/
echo.
echo After installation, run this script again to verify.
echo.

choice /C YN /M "Open download page now"
if errorlevel 2 goto end
if errorlevel 1 start https://support.apple.com/kb/DL999

:end
pause
