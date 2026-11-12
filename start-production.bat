@echo off
chcp 65001 >nul
echo ========================================================
echo        LUNG VAI TEA - START PRODUCTION SERVERS
echo ========================================================
echo.

echo [1/2] Dang khoi dong Backend API (.NET 8 Production) tai http://localhost:5274...
start "LungVaiTea - Backend API (Production)" cmd /k "cd /d "%~dp0backend-api\seeme-svc\Seeme.API\publish" && set ASPNETCORE_ENVIRONMENT=Production && Seeme.API.exe --urls http://0.0.0.0:5274"

timeout /t 2 /nobreak >nul

echo [2/2] Dang khoi dong Frontend (Next.js Production) tai http://localhost:3000...
start "LungVaiTea - Frontend (Production)" cmd /k "cd /d "%~dp0Outsource-Seeme-Nextjs-main" && npm start"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo [THANH CONG] Ca Backend va Frontend da duoc khoi chay!
echo - Website Frontend : http://localhost:3000
echo - Backend API Docs : http://localhost:5274/SEEME
echo ========================================================
