@echo off
setlocal
cd /d "%~dp0"

echo ================================================
echo   EcoStep - first-time project setup
echo ================================================
echo.

set PYEXE=python
where py >nul 2>nul && set PYEXE=py

echo [1/4] Backend: checking .env ...
cd backend

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo     Created backend\.env from template.
    echo     IMPORTANT: open backend\.env and fill in your real keys!
) else (
    echo     backend\.env already exists - skipping.
)

echo.
echo [2/4] Backend: virtual environment and dependencies ...
if not exist ".venv" (
    echo     Creating .venv using "%PYEXE%" ...
    %PYEXE% -m venv .venv
)
call ".venv\Scripts\activate.bat"
pip install -r requirements.txt
call ".venv\Scripts\deactivate.bat"
cd ..

echo.
echo [3/4] Frontend: checking .env.local ...
cd frontend

if not exist ".env.local" (
    copy ".env.local.example" ".env.local" >nul
    echo     Created frontend\.env.local from template.
    echo     IMPORTANT: open frontend\.env.local and fill in your real keys!
) else (
    echo     frontend\.env.local already exists - skipping.
)

echo.
echo [4/4] Frontend: installing npm dependencies - this can take a couple of minutes ...
call npm install
cd ..

echo.
echo ================================================
echo   Done!
echo.
echo   If .env or .env.local were just created above -
echo   open them and fill in your real keys
echo   (the same ones you use on your other PCs).
echo.
echo   After that, run start-all.bat
echo ================================================
pause
