@echo off
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║     🎓 Explainable RAG Lab - Starting Application       ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found. Running setup...
    call setup.bat
    if errorlevel 1 (
        echo ❌ Setup failed. Please check the errors above.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo ✅ Activating Python environment...
call venv\Scripts\activate.bat

REM Start backend in a new window
echo.
echo 🚀 Starting Backend Server...
start "RAG Backend" cmd /k "cd backend && python main.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo.
echo 🎨 Starting Frontend...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💡 The frontend will open automatically in your browser
echo 💡 Backend is running in a separate window
echo.
npm run dev
