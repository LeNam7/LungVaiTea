@echo off
chcp 65001 >nul
echo ========================================================
echo   LUNG VAI TEA - BACKEND API (PRODUCTION MODE)
echo ========================================================
echo.
if not exist "%~dp0Seeme.API\publish\Seeme.API.exe" (
    echo [THONG BAO] Chua co ban publish. Dang tien hanh build publish truoc...
    cd /d "%~dp0Seeme.API"
    dotnet publish -c Release -o publish
    if not exist "publish\wwwroot\uploads" (
        mkdir "publish\wwwroot\uploads"
    )
)
cd /d "%~dp0Seeme.API\publish"
set ASPNETCORE_ENVIRONMENT=Production
echo Backend API dang chay tai: http://localhost:5274
echo Swagger UI: http://localhost:5274/SEEME
Seeme.API.exe --urls "http://0.0.0.0:5274"
pause
