@echo off
echo ========================================
echo   Explainable RAG Lab - Starting
echo ========================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start backend in background
echo [1/2] Starting FastAPI backend...
start "RAG Backend" cmd /k "venv\Scripts\activate.bat && cd backend && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Starting React frontend...
echo.
echo ========================================
echo   Application Starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the frontend
echo Close the backend window to stop the backend
echo ========================================
echo.

npm run dev
