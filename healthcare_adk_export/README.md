# 🏥 Healthcare Care Orchestrator (Google ADK)

An end-to-end patient journey orchestrator built with the **Google Agent Development Kit (ADK)**. This system manages appointment triage, provider scheduling, and insurance pre-authorization using a multi-agent "Digital Assembly Line" architecture.

## 🚀 Quick Start (Local ADK UI)

To run the **official Google ADK Web UI** on your local machine:

1.  **Clone the repository** and navigate to the project folder.
2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Set your API Key**:
    Create a `.env` file in the root and add:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  **Start the ADK Web UI**:
    ```bash
    adk web agent.py
    ```
    This will launch the official ADK interface in your browser (usually at `http://localhost:8000`).

## 📂 Project Structure

This project follows the standard ADK structure for professional agentic workflows:

-   `agent.py`: The main orchestrator logic. Defines the **Appointment**, **Scheduling**, and **Insurance** agents and their sequential handoff flow.
-   `tools.py`: Contains the custom Python tools (e.g., `check_provider_calendar`, `verify_insurance_eligibility`) that agents use to interact with external systems.
-   `__init__.py`: Standard Python package initialization.

## 🤖 The Digital Assembly Line

1.  **Appointment Agent**: Triages user symptoms and extracts patient details.
2.  **Scheduling Agent**: Uses the `check_provider_calendar` tool to find and confirm available slots.
3.  **Insurance Agent**: Uses the `verify_insurance_eligibility` tool to confirm coverage and submit pre-authorization.

---
*Built for professional-grade healthcare orchestration using Vertex AI and Google ADK.*
