# 🏥 CareOrchestrator Live

CareOrchestrator Live is a professional-grade healthcare orchestration system built on **Google’s Agent Development Kit (ADK)** and powered by **Vertex AI**. It demonstrates a seamless, multi-agent workflow that automates patient triage, scheduling, and insurance verification.

## 🚀 Quick Start (One-Command)

To run the application on your local machine, use one of the following commands:

### 🍎 Mac / 🐧 Linux
```bash
./start.sh
```
*(Note: You may need to run `chmod +x start.sh` first to give it permission.)*

### 🪟 Windows
```cmd
start.bat
```

### 📦 Standard npm
```bash
npm install
npm start
```

## 🛠️ Configuration

The application requires a Google Gemini API key. 
1. Create a `.env` file in the root directory.
2. Add your key: `GEMINI_API_KEY=your_key_here`

## 🧠 The "Agentic" Proof
This system demonstrates true agentic behavior: the **Insurance Agent** doesn't just "talk"—it **knows**. By pulling shared context directly from the **Appointment Agent**, it verifies eligibility and submits pre-auth forms without the user ever having to repeat their symptoms or details.

## 🏗️ Infrastructure
Built using:
- **Google ADK**: For robust agent orchestration.
- **Vertex AI (Gemini 3 Flash)**: As the core reasoning engine.
- **React & Tailwind CSS**: For a modern, responsive dashboard.
- **Motion**: For fluid, real-time visual feedback.
