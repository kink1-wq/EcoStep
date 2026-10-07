@echo off
setlocal
cd /d "%~dp0frontend"

if not exist ".env.local" (
    echo ================================================
    echo   ERROR: frontend\.env.local not found
    echo   Run setup.bat in the project root first.
    echo ================================================
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ================================================
    echo   ERROR: node_modules not found
    echo   Run setup.bat in the project root first.
    echo ================================================
    pause
    exit /b 1
)

echo Starting frontend: http://localhost:3000
echo (keep this window open while using EcoStep)
echo.

call npm run dev

echo.
echo Frontend stopped.
pause
