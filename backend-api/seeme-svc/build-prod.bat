@echo off
chcp 65001 >nul
echo ========================================================
echo   LUNG VAI TEA - BACKEND API (BUILD & PUBLISH RELEASE)
echo ========================================================
echo.
cd /d "%~dp0Seeme.API"
dotnet publish -c Release -o publish
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build that bai!
    pause
    exit /b %ERRORLEVEL%
)
if not exist "publish\wwwroot\uploads" (
    mkdir "publish\wwwroot\uploads"
)
echo.
echo [OK] Backend da publish thanh cong vao thu muc Seeme.API\publish!
echo.
pause
