@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. index.html dosya olarak aciliyor.
  start "" "%~dp0index.html"
  exit /b
)
node "%~dp0server.js"
