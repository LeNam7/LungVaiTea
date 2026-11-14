@echo off
chcp 65001 >nul
echo ========================================================
echo   LUNG VAI TEA - FRONTEND NEXT.JS (PRODUCTION MODE)
echo ========================================================
echo.
cd /d "%~dp0"
if not exist ".next" (
    echo [THONG BAO] Chua co thu muc .next. Dang build production truoc...
    call npm run build
)
echo Frontend Production dang chay tai: http://localhost:3000
npm start
pause
