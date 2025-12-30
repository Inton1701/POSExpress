@echo off
REM Multi-platform build script for Windows
REM RFID POS System Builder

setlocal enabledelayedexpansion
setlocal enableextensions

for /f "tokens=3" %%a in ('findstr /R "\"version\"" frontend\package.json') do (
    set "VERSION=%%a"
    set "VERSION=!VERSION:~1,-1!"
    goto version_found
)
:version_found

set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BUILD_DIR=dist-release-%VERSION%

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   RFID POS System - Windows Build v%VERSION%
echo ║   Built: %TIMESTAMP%
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check dependencies
echo [*] Checking dependencies...

where node >nul 2>&1
if errorlevel 1 (
    echo [!] Node.js not found. Please install Node.js v20+
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [!] npm not found. Please install npm
    pause
    exit /b 1
)

echo [+] Node.js and npm found
echo.

REM Install dependencies
echo [*] Installing dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo [!] npm install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [+] Dependencies installed
echo.

REM Build Web
echo [*] Building Web Application (Docker)...
echo.
echo Docker Compose is configured in docker-compose.yml
echo To deploy: docker compose up --build -d
echo.

REM Build Windows EXE
echo [*] Building Windows Executable...
echo This may take several minutes...
echo.

cd frontend
call npm run build:electron:win
if errorlevel 1 (
    echo [!] Windows build failed
    cd ..
    pause
    exit /b 1
)
cd ..

if exist "frontend\dist-electron\RFID-POS-System-Setup-*.exe" (
    echo [+] Windows EXE built successfully
) else (
    echo [!] Windows EXE not found after build
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    Build Complete!                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Find Windows EXE in: frontend\dist-electron\
echo 2. Test the application
echo 3. Review DEPLOYMENT_GUIDE.md for deployment instructions
echo 4. For Linux builds, run build script on Linux or WSL2
echo.
pause
