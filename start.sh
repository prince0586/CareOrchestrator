#!/bin/bash

# CareOrchestrator Universal Startup Script (Mac/Linux)
echo "------------------------------------------------"
echo "🚀 Initializing CareOrchestrator Live..."
echo "------------------------------------------------"

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install it from https://nodejs.org"
    exit 1
fi

# 2. Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 First-time setup: Installing dependencies..."
    npm install
fi

# 3. Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file missing!"
    echo "Please ensure you have a GEMINI_API_KEY set in your environment."
    echo "Creating a template .env file for you..."
    echo "GEMINI_API_KEY=your_key_here" > .env
fi

# 4. Launch the app
echo "✨ Launching application..."
npm run dev
