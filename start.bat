@echo off
:: CareOrchestrator Universal Startup Script (Windows)
echo ------------------------------------------------
echo 🚀 Initializing CareOrchestrator Live...
echo ------------------------------------------------

:: 1. Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed. Please install it from https://nodejs.org
    pause
    exit /b
)

:: 2. Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 First-time setup: Installing dependencies...
    call npm install
)

:: 3. Check for .env file
if not exist .env (
    echo ⚠️  Warning: .env file missing!
    echo Please ensure you have a GEMINI_API_KEY set in your environment.
    echo Creating a template .env file for you...
    echo GEMINI_API_KEY=your_key_here > .env
)

:: 4. Launch the app
echo ✨ Launching application...
call npm run dev
