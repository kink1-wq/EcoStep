@echo off
setlocal
cd /d "%~dp0"

echo Starting EcoStep (backend + frontend)...
echo.

start "EcoStep - backend (localhost:8000)" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak >nul

start "EcoStep - frontend (localhost:3000)" cmd /k "%~dp0start-frontend.bat"

timeout /t 8 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo Two windows opened: backend and frontend. Do not close them while using the app.
echo The site should open in your browser automatically in a few seconds.
pause
