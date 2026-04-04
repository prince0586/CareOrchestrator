# 🏥 Healthcare Care Orchestrator (Google ADK)

An end-to-end patient journey orchestrator built with the **Google Agent Development Kit (ADK)**. This system manages appointment triage, provider scheduling, and insurance pre-authorization using a multi-agent "Digital Assembly Line" architecture.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/prince0586/CareOrchestrator.git
cd CareOrchestrator
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEN_FAST_MODEL=gemini-2.5-flash
GEN_ADVANCED_MODEL=gemini-2.5-pro
```

### 3. Install Dependencies

You'll need both Python (for ADK agents) and Node.js (for the React frontend).

**Python Dependencies:**
```bash
pip install -r requirements.txt
```

**Node.js Dependencies:**
```bash
npm install
```

### 4. Run the Application

**Option A: Official ADK Web UI (Python)**
This launches the standard Google ADK interface for interacting with your agents.
```bash
adk web agents
```
*Usually accessible at `http://localhost:8000`.*

**Option B: Custom Healthcare Dashboard (React + Express)**
This launches the custom, healthcare-focused frontend simulation.
```bash
npm run dev
```
*Accessible at `http://localhost:3000`.*

## 📂 Project Structure

-   `agents/`: Python-based agent logic using Google ADK.
    -   `agent.py`: Orchestrator defining the sequential handoff flow.
    -   `tools.py`: Custom tools for EHR calendar and insurance verification.
-   `src/`: React frontend source code (Tailwind CSS 4 + Framer Motion).
-   `server.ts`: Express server serving the React app and handling API routes.
-   `package.json`: Node.js project configuration and dependencies.
-   `requirements.txt`: Python package requirements.

## 🤖 The Digital Assembly Line

1.  **Knowledge Agent (Wikipedia + KB)**: Fetches medical summaries from Wikipedia and internal policies from the knowledge base to provide context.
2.  **Appointment Agent**: Triages user symptoms and extracts patient details using the medical context.
3.  **Scheduling Agent**: Uses `check_provider_calendar` to find and book slots.
4.  **Insurance Agent**: Uses `verify_insurance_eligibility` and KB policies for coverage and pre-auth.

## 🔗 Model Context Protocol (MCP) & ADK

This project leverages **Google ADK** to implement core **Model Context Protocol (MCP)** concepts:
-   **Shared State**: Agents pass context (e.g., `patient_details`, `medical_context`) through a unified state protocol.
-   **Tool Interoperability**: Custom tools like `search_medical_knowledge` act as MCP-style resources that any agent can call.
-   **Sequential Orchestration**: The `SequentialAgent` manages the lifecycle and context handoffs between specialized models.

This application is designed to be deployed to **Google Cloud Run**.

### 1. Build the Frontend
```bash
npm run build
```

### 2. Deploy to Cloud Run
You can deploy using the Google Cloud CLI:

```bash
gcloud run deploy healthcare-orchestrator \
  --source . \
  --env-vars-file .env \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Alternatively, use the **Deploy to Cloud Run** button in the AI Studio interface if available.

---
*Built for professional-grade healthcare orchestration using Vertex AI and Google ADK.*
