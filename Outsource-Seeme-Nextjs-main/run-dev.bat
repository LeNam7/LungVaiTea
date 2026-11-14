@echo off
chcp 65001 >nul
echo ========================================================
echo   LUNG VAI TEA - FRONTEND NEXT.JS (DEVELOPMENT MODE)
echo ========================================================
echo.
cd /d "%~dp0"
npm run dev
pause
