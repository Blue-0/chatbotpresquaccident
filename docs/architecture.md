# Architecture Documentation

## 🏗 System Overview

The **Agent Secu** application is a monolithic web application deployed as a Next.js instance. It handles both the frontend user interface and the backend API logic for chat and audio processing.

### High-Level Components

1.  **Frontend Client**: React-based UI served by Next.js. Handles user interaction, audio recording (MediaRecorder API), and animations.
2.  **Backend API**: Serverless functions in `app/api/` handling authentication and communication with external AI services.
3.  **External Services**:
    - **Mistral AI (Voxtral)**: Used for high-fidelity audio transcription.

## 🧩 Component Architecture

### Frontend (`src/components`, `app/`)
- **Pages**:
    - `/Login`: Authentication entry point.
    - `/Chat`: Main interface for the assistant.
- **Shared Components**:
    - `Particles.tsx`: Visual background effects.
    - `ui/`: Reusable interface elements (Shadcn UI based).

### Backend (`app/api/`)
- **`api/chat/`**: Endpoint for handling text-based interactions with the AI.
- **`api/voxtral/`**: Dedicated endpoint receiving WAV audio buffers and proxing them to Mistral AI.
- **`api/auth/[...nextauth]/`**: Manages session handlers and OAuth providers.

## 💾 Data Architecture

- **Authentication**: Managed via NextAuth.js (Providers/Sessions).
- **State Management**: React features (Hooks, Context) used for local UI state.

## 🔄 Data Flow (Audio Transcription)

1.  **Capture**: Browser MediaRecorder captures audio.
2.  **Processing**: Client converts WebM to WAV (16kHz Mono).
3.  **Transport**: Client POSTs `FormData` to `/api/voxtral`.
4.  **Service**: Backend forwards to Mistral AI Voxtral API.
5.  **Response**: Text transcription returned to Client for display.

## 🚀 Deployment

- **Infrastructure**: Standard Node.js environment (Docker compatible).
- **Environment**: Configured via `.env.local` (API Keys, Secrets).
