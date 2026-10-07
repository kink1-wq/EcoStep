@echo off
setlocal
cd /d "%~dp0backend"

if not exist ".env" (
    echo ================================================
    echo   ERROR: backend\.env not found
    echo   Run setup.bat in the project root first.
    echo ================================================
    pause
    exit /b 1
)

if not exist ".venv" (
    echo ================================================
    echo   ERROR: .venv not found
    echo   Run setup.bat in the project root first.
    echo ================================================
    pause
    exit /b 1
)

call ".venv\Scripts\activate.bat"

echo Starting backend: http://localhost:8000
echo (keep this window open while using EcoStep)
echo.

uvicorn app.main:app --reload

echo.
echo Backend stopped.
pause
