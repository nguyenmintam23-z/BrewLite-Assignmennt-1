@echo off
setlocal
cd /d "%~dp0apps\web"
if not exist ".env.local" copy ".env.example" ".env.local"
echo.
echo =============================================
echo BrewLite Assignment 1 - Frontend Phuc DEMO
 echo =============================================
echo.
call npm install
if errorlevel 1 (
  echo Cai dat dependencies that bai. Kiem tra Node.js >=22 va ket noi Internet.
  pause
  exit /b 1
)
echo.
echo Mo trinh duyet vao http://localhost:3000
call npm run dev
pause
