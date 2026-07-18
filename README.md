# AI Use Form Builder

A guided Next.js application for completing the Information Technology Investment – Artificial Intelligence Use Form with a Gemini-powered interview agent.

## Run locally

1. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
2. Install dependencies with `pnpm install`.
3. Start the app with `pnpm dev`.

The app supports a bring-your-own-key flow. A key entered in the UI remains in memory for the current browser tab and is sent only to the server-side `/api/form-agent` route for that request. It is never written into form state or exported. A server-side `GEMINI_API_KEY` remains available as a private deployment fallback.

## Current foundation

- Typed schema covering all 11 official form sections
- Server-validated structured Gemini responses
- Real-time higher-risk detection
- Section completion tracking
- Final validated JSON export
- Responsive conversational dashboard
