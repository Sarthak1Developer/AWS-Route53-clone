@echo off
echo ========================================================
echo Starting AWS Route 53 Clone (Backend and Frontend)
echo ========================================================

echo Starting FastAPI Backend on http://localhost:8000 ...
start "FastAPI Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo Starting Next.js Frontend on http://localhost:3000 ...
start "Next.js Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services are starting!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo ========================================================
