@echo off
title VOLSIM PRO v6.5 - Titan Engine Control
echo ======================================================
echo    VOLSIM PRO // STARTING FULL STACK ENGINE
echo ======================================================

:: 1. Cleanup old "ghost" processes
echo [!] Killing existing Node and Python processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1

:: 2. Start the API Gateway (Backend)
echo [1/3] Launching API Gateway...
start "VOLSIM_API" cmd /k "python api/main.py"
timeout /t 3 >nul

:: 3. Start the Neural Bridge (MT5 Sync)
echo [2/3] Launching MT5 Bridge and Monitor...
start "VOLSIM_BRIDGE" cmd /k "python bridge/mt5_bridge.py"
timeout /t 3 >nul

:: 4. Start the Dashboard (Frontend)
echo [3/3] Launching Frontend Dashboard...
cd frontend
start "VOLSIM_FRONTEND" cmd /k "npm start"

echo ======================================================
echo    ALL SYSTEMS LIVE - CHECK INDIVIDUAL WINDOWS
echo ======================================================
pause
