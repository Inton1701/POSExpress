@echo off
echo ================================
echo Creating Default Admin Account
echo ================================
echo.
cd backend
call npm run seed:admin
echo.
echo ================================
echo Done!
echo ================================
pause
