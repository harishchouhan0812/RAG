@echo off
cls
color 0A
title 🎓 Explainable RAG Lab

echo.
echo ╔════════════════════════════════════════════╗
echo ║                                            ║
echo ║   EXPLAINABLE RAG - VISUAL LEARNING LAB    ║
echo ║                                            ║
echo ╚════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Check virtual environment
if not exist "venv\Scripts\python.exe" (
    echo ❌ ERROR: Python environment not found!
    echo.
    echo Please run: setup.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Python environment found
echo.

REM Kill any existing processes on ports 8000 and 5173
echo 🔄 Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo.

echo 🚀 Starting Backend Server...
start "RAG Backend - DO NOT CLOSE" cmd /k "title RAG Backend && color 0B && venv\Scripts\activate.bat && cd backend && python main.py"

echo ⏳ Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak >nul
echo.

echo 🎨 Starting Frontend...
echo.
echo ════════════════════════════════════════════
echo   APPLICATION READY!
echo ════════════════════════════════════════════
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ════════════════════════════════════════════
echo.
echo 💡 Browser will open automatically
echo 💡 Backend window will stay open (DON'T CLOSE IT!)
echo 💡 Press Ctrl+C here to stop frontend
echo.

npm run dev

echo.
echo 👋 Frontend stopped. Backend is still running.
echo    Close the backend window manually if needed.
pause
