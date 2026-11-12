@echo off
chcp 65001 >nul
echo ========================================================
echo        LUNG VAI TEA - BUILD PRODUCTION AUTOMATION
echo ========================================================
echo.

echo [1/2] Dang build va publish Backend (.NET 8 Release)...
cd /d "%~dp0backend-api\seeme-svc\Seeme.API"
dotnet publish -c Release -o publish
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build Backend that bai!
    pause
    exit /b %ERRORLEVEL%
)
if not exist "publish\wwwroot\uploads" (
    mkdir "publish\wwwroot\uploads"
)
echo [OK] Backend da build va publish thanh cong tai:
echo      backend-api\seeme-svc\Seeme.API\publish
echo.

echo [2/2] Dang build Frontend (Next.js 16 Production)...
cd /d "%~dp0Outsource-Seeme-Nextjs-main"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build Frontend that bai!
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Frontend da build Production thanh cong!
echo.
echo ========================================================
echo       BUILD PRODUCTION HOAN TAT THANH CONG!
echo ========================================================
pause
