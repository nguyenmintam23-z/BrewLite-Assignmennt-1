@echo off
setlocal
cd /d "%~dp0apps\web"
call npm test
pause
