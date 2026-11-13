@echo off
chcp 65001 >nul
echo ========================================================
echo   LUNG VAI TEA - BACKEND API (DEVELOPMENT MODE)
echo ========================================================
echo.
cd /d "%~dp0Seeme.API"
dotnet run --urls "http://localhost:5274"
pause
