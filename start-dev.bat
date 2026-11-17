@echo off
echo =======================================================
echo   FixMyCampus - AI-Powered Campus Problem Solver
echo =======================================================
set PATH=%~dp0.tools\node;%PATH%

start "FixMyCampus Backend API (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "FixMyCampus Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are launching:
echo   - Backend API: http://localhost:5000/api/health
echo   - Frontend:    http://localhost:5173
echo.
pause
