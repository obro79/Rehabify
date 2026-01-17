# Rehabify Project Structure

This document outlines the directory structure for the Rehabify application.

```
rehabify/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication routes (grouped)
│   │   │   ├── login/                # Login page
│   │   │   └── register/             # Registration page
│   │   ├── (dashboard)/              # Protected routes (grouped)
│   │   │   ├── dashboard/            # User dashboard
│   │   │   ├── exercise/[type]/      # Exercise session pages (dynamic route)
│   │   │   └── history/              # Session history
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Neon Auth handlers
│   │   │   ├── sessions/             # Session CRUD endpoints
│   │   │   └── vapi/                 # Vapi webhook handlers
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── workout/                  # Exercise session components
│   │   │   ├── ExerciseCamera.tsx    # Webcam feed + skeleton overlay
│   │   │   ├── RepCounter.tsx        # Rep counting display
│   │   │   ├── FormScoreRing.tsx     # Form score visualization
│   │   │   └── VoiceCoach.tsx        # Audio I/O + visualizer
│   │   └── dashboard/                # Dashboard components
│   │       ├── SessionCard.tsx
│   │       └── StatsOverview.tsx
│   │
│   ├── lib/                          # Utilities and services
│   │   ├── vision/                   # MediaPipe integration
│   │   │   ├── worker.ts             # Web Worker entry point
│   │   │   ├── pose-detector.ts      # MediaPipe wrapper
│   │   │   ├── angle-utils.ts        # Joint angle calculations
│   │   │   └── exercises/            # Exercise-specific form detection
│   │   │       ├── cat-camel.ts
│   │   │       ├── cobra.ts
│   │   │       ├── dead-bug.ts
│   │   │       ├── side-plank.ts
│   │   │       └── bird-dog.ts
│   │   ├── voice/                    # Vapi integration
│   │   │   ├── vapi-client.ts        # Vapi SDK wrapper
│   │   │   ├── form-event-bridge.ts  # Vision → voice context bridge
│   │   │   └── prompts/              # System prompts and cues
│   │   └── db/                       # Database clients
│   │       ├── index.ts              # Drizzle client
│   │       ├── schema.ts             # Drizzle schema
│   │       └── middleware.ts         # Auth middleware
│   │
│   ├── stores/                       # Zustand state stores
│   │   ├── exercise-store.ts         # Current exercise, reps, form state
│   │   ├── session-store.ts          # Active session data
│   │   └── voice-store.ts            # Voice connection state
│   │
│   └── types/                        # TypeScript type definitions
│       ├── exercise.ts
│       ├── session.ts
│       └── landmarks.ts
│
├── public/                           # Static assets
│   ├── exercises/                    # Exercise reference images
│   └── audio/                        # Fallback audio clips
│
├── drizzle/                          # Drizzle configuration
│   ├── migrations/                   # Database migrations
│   └── seed.sql                      # Demo data
│
├── plan/                             # Project documentation
│   ├── 00-architecture/              # System architecture docs
│   ├── 01-backend/                   # Backend documentation
│   ├── 02-frontend/                  # Frontend documentation
│   ├── 03-vision/                    # Vision system docs
│   ├── 04-voice-ai/                  # Voice AI documentation
│   ├── 05-contingencies/             # Contingency plans
│   └── 06-sprint-timeline/           # Sprint timeline docs
│
└── Configuration Files
    ├── .env.local                    # Environment variables (not committed)
    ├── next.config.ts                # Next.js configuration
    ├── tailwind.config.ts            # Tailwind CSS configuration
    ├── tsconfig.json                 # TypeScript configuration
    ├── postcss.config.mjs            # PostCSS configuration
    └── package.json                  # Dependencies and scripts
```

## Directory Purposes

### `/src/app`
Next.js 15 App Router structure. Route groups `(auth)` and `(dashboard)` organize pages without affecting URL structure.

### `/src/components`
- **ui/**: Reusable Shadcn/ui primitives (buttons, cards, inputs, etc.)
- **workout/**: Exercise session-specific components
- **dashboard/**: Dashboard page components

### `/src/lib`
Business logic and external service integrations:
- **vision/**: MediaPipe pose detection, Web Worker, form analysis
- **voice/**: Vapi voice AI client and context bridging
- **db/**: Database and auth clients (Neon + Drizzle)

### `/src/stores`
Zustand stores for client-side state management.

### `/src/types`
Shared TypeScript type definitions.

### `/public`
Static assets served directly:
- **exercises/**: Reference images for exercises
- **audio/**: Fallback audio clips for voice coaching

### `/drizzle`
Database schema and seed data for Neon (using Drizzle ORM).

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with providers |
| `src/app/page.tsx` | Landing page |
| `src/lib/vision/worker.ts` | MediaPipe Web Worker |
| `src/lib/voice/vapi-client.ts` | Vapi SDK wrapper |
| `src/lib/db/index.ts` | Drizzle client for Neon |
| `src/lib/db/schema.ts` | Drizzle schema definitions |
| `src/stores/exercise-store.ts` | Exercise state management |
| `drizzle/migrations/0000_initial.sql` | Initial database schema |
