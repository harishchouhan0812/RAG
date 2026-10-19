@echo off
title Explainable RAG Lab - Launcher
cls

echo.
echo ========================================
echo   EXPLAINABLE RAG LAB - LAUNCHER
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python environment...
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)
echo     OK - Virtual environment found
echo.

echo [2/3] Starting Backend Server...
start "RAG Backend" cmd /k "venv\Scripts\activate.bat && cd backend && python main.py"
echo     Backend starting in new window...
echo     Waiting 8 seconds for models to load...
timeout /t 8 /nobreak > nul
echo.

echo [3/3] Starting Frontend...
echo     Frontend will open in your browser automatically
echo.
echo ========================================
echo   SERVERS RUNNING:
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop the frontend
echo (Close the Backend window to stop it)
echo.

npm run dev

pause
