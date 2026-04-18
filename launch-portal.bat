@echo off
title ERP Support Portal

echo ============================================
echo   ERP Support Portal - Startup
echo ============================================
echo.

REM ── Check Java ───────────────────────────────
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found. Install JDK 17 and add it to PATH.
    pause & exit /b 1
)

REM ── Check Maven ──────────────────────────────
mvn -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven not found. Install Maven 3.9+ and add it to PATH.
    pause & exit /b 1
)

REM ── Check Node ───────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ and add it to PATH.
    pause & exit /b 1
)

echo [OK] Prerequisites verified.
echo.

REM ── Start Backend ────────────────────────────
echo [1/2] Starting backend on http://localhost:8081 ...
start "ERP Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

REM Wait for backend to boot
echo     Waiting for backend to start (15 seconds)...
timeout /t 15 /nobreak >nul

REM ── Start Frontend ───────────────────────────
echo [2/2] Starting frontend on http://localhost:4200 ...
start "ERP Frontend" cmd /k "cd /d %~dp0frontend && npm install --prefer-offline && npx ng serve"

echo.
echo ============================================
echo   Both services are starting up.
echo   Backend  : http://localhost:8081
echo   Frontend : http://localhost:4200
echo   Swagger  : http://localhost:8081/swagger-ui/index.html
echo ============================================
echo.
echo Close the Backend and Frontend windows to stop the application.
pause
