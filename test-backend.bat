@echo off
echo Testing Backend Connection...
echo.

curl http://localhost:8000/ 2>nul
if errorlevel 1 (
    echo.
    echo ERROR: Backend is not responding!
    echo Make sure it's running with: cd backend ^&^& python main.py
) else (
    echo.
    echo SUCCESS: Backend is responding!
)

echo.
echo Testing /api endpoint...
curl http://localhost:8000/api 2>nul

echo.
echo Testing /api/pipeline/status endpoint...
curl http://localhost:8000/api/pipeline/status 2>nul

echo.
pause
