# Project Overview

## 📋 Executive Summary

**ChatBot Presqu'Accident (Agent Secu)** is a modern web application designed to report near-miss accidents via an AI-powered chat interface. It features advanced audio transcription capabilities using Voxtral (Mistral AI), enabling users to report incidents vocally.

The application is built on a robust **Next.js** foundation, incorporating real-time animations, secure authentication, and a responsive design.

## 🛠 Technology Stack

| Category | Technology | Version | Description |
|----------|------------|---------|-------------|
| **Core** | Next.js | 15.5.2 | React framework with App Router |
| **UI** | React | 19.1.0 | Component library |
| **Language** | TypeScript | 5.x | Static typing |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **Auth** | NextAuth.js | 4.24.11 | Authentication handling |
| **AI** | Mistral AI | API | Voxtral model for transcription |
| **Animations**| Anime.js | 4.2.0 | UI animations |

## 🏗 Architecture Classification

- **Type:** Monolith
- **Pattern:** Layered Web Application
- **Style:** Component-Based UI usually consuming internal API routes.

## 📂 Repository Structure

The project follows a standard Next.js App Router structure:

- `app/`: Pages and API routes (Next.js 13+ App Directory).
- `src/`: Shared components and libraries.
- `public/`: Static assets.

## 🔗 Key Documentation

- [Architecture](./architecture.md)
- [Development Guide](./development-guide.md) _(To be generated)_
- [API Contracts](./api-contracts.md) _(To be generated)_
