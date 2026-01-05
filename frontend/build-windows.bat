@echo off
echo ========================================
echo   Windows Electron Build Script
echo ========================================
echo.

echo [1/4] Stopping all Electron processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM "RFID POS System.exe" 2>nul
timeout /t 3 /nobreak >nul
echo Done.
echo.

echo [2/4] Cleaning build directories...
if exist "dist-electron" (
    rmdir /s /q "dist-electron" 2>nul
    timeout /t 2 /nobreak >nul
    if exist "dist-electron" (
        echo Warning: Could not remove dist-electron completely
        echo Trying PowerShell method...
        powershell -Command "Remove-Item -Path 'dist-electron' -Recurse -Force -ErrorAction SilentlyContinue"
        timeout /t 2 /nobreak >nul
    )
)
echo Done.
echo.

echo [3/4] Building Vue app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Vue build failed
    exit /b 1
)
echo Done.
echo.

echo [4/4] Building Electron app...
call electron-builder --win
if %ERRORLEVEL% NEQ 0 (
    echo Error: Electron build failed
    exit /b 1
)
echo Done.
echo.

echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Output directory: dist-electron\
dir /b dist-electron\*.exe 2>nul
echo.
pause
