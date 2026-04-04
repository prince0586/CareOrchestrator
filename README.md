# CareOrchestrator

CareOrchestrator is a production-grade, cloud-native healthcare coordination system designed to improve communication and coordination between patients and healthcare providers.

## Architecture & Cloud Native Integration

- **Backend**: Built as an asynchronous Express application (Node.js equivalent of FastAPI) optimized for Google Cloud Run.
- **Database**: Utilizes **Google Cloud Firestore** for real-time patient-provider data synchronization and longitudinal care tracking.
- **AI Services**: Powered by **Gemini 3.1 Pro** and **Gemini 3 Flash** for clinical-to-patient translation, provider response drafting, and care log analysis.
- **Security**: Implements **Zod** for strict type-checking and data validation (equivalent to Pydantic V2).
- **Authentication**: Uses **Firebase Authentication** for secure patient and provider access.
- **Observability**: Integrated with Google Cloud Logging for structured interaction monitoring.

## Core Features

### 1. Patient Interaction
A real-time messaging interface that allows patients to communicate with their care team. Gemini drafts professional and empathetic responses for providers based on patient history.

### 2. Care Tracker
A longitudinal tracking system for medication adherence and vital signs. Patients can log their daily health data, which is then analyzed by Gemini for clinical insights and trends.

### 3. Clinical Summarization
A "Clinical-to-Patient" translation module that simplifies complex medical jargon into actionable, easy-to-understand summaries for patients.

## Security & Performance

- **PII Scrubbing**: Gemini prompts include a dedicated layer to scrub Personally Identifiable Information (PII) before processing health data.
- **Async I/O**: Non-blocking database and AI operations ensure high performance and scalability.
- **Strict Validation**: All data inputs are validated against Zod schemas before being persisted to Firestore.
- **Least Privilege**: Firestore security rules ensure patients can only access their own data, while providers have managed administrative access.

## Testing Suite

The project includes a comprehensive testing suite using **Vitest**:
- **Unit Tests**: Core logic for clinical translation and response drafting.
- **Integration Tests**: Data validation and Firestore schema compliance.
- **Edge Case Tests**: Handling of malformed JSON, empty inputs, and invalid date formats.

Run tests with:
```bash
npm test
```

## Deployment

The system is designed for deployment on **Google Cloud Run** using a multi-stage Docker build to minimize image size and dependency weight.
