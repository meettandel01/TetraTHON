@echo off
echo ========================================
echo   TetraTHON - Starting Dev Environment
echo ========================================
echo.

echo [1/2] Starting FastAPI Backend...
start "TetraTHON Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting React Frontend...
start "TetraTHON Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Both servers starting!
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo    API Docs: http://localhost:8000/docs
echo.
pause
