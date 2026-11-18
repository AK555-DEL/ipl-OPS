@echo off
setlocal enabledelayedexpansion
title IPL Auction Room

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js 18 or newer from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -e "console.log(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%a
if %NODE_MAJOR% lss 18 (
    echo [ERROR] Node.js version 18+ is required. Found version: %NODE_MAJOR%
    echo Please install Node.js 18 or newer from https://nodejs.org/
    pause
    exit /b 1
)

start "" /b node scripts/open-browser.js

node server.js

