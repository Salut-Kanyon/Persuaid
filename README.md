# Persuaid

AI Copilot for Sales Calls - Say the right thing on every sales call.

## About

Persuaid is an AI-powered sales assistant that provides real-time guidance during sales conversations. It helps sales reps, founders, and closers know what to say in real time with live transcripts, AI suggestions, notes, and editable scripts.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment variables

Create a `.env.local` file in the project root. In addition to your existing Supabase and Stripe keys:

- **`DEEPGRAM_API_KEY`** – For live speech-to-text in the dashboard. Get a key at [Deepgram](https://deepgram.com/). Required for real-time transcription when recording.
- **`OPENAI_API_KEY`** – For AI suggestions and “Take notes” from the transcript. Required for the AI Suggestions panel and the Take notes button.

See `supabase/README.md` for database migrations (scripts, notes, sessions).

## Project Structure

```
persuaid/
├── app/              # Next.js app directory
├── components/       # React components
│   └── ui/          # UI components
├── lib/             # Utility functions
└── styles/          # Global styles
```
