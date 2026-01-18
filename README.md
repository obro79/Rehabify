# Rehabify This is a new commit again

**AI-powered physical therapy coaching with real-time form correction**

## The Problem

Physical therapy is expensive ($100-200/session), hard to access (weeks-long wait times), and patients are left unsupervised at home wondering if they're doing exercises correctly. 60% of PT patients don't complete their rehab program.

## The Solution

Rehabify combines computer vision + voice AI to create an AI coach that watches your form and corrects you in real-time - like having a physio in your living room.

```
Webcam (30fps) --> MediaPipe Pose --> Form Detection --> Voice AI --> "Lift those hips up!"
                        |                   |
                  33 body landmarks    Rule-based analysis
                  (runs locally)       (< 1 second feedback)
```

## Key Features

- **Real-time pose detection** - MediaPipe tracks 33 body landmarks at 30fps
- **Instant voice correction** - AI coach provides feedback in < 1 second
- **Privacy-first** - Video never leaves your device (all CV runs client-side)
- **PT-in-the-loop** - Your physio can monitor your progress remotely

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind, shadcn/ui |
| Vision | MediaPipe Pose (WebAssembly, Web Worker) |
| Voice | Vapi (Deepgram STT + GPT-4o + ElevenLabs TTS) |
| Database | Neon (PostgreSQL + Neon Auth) |
| Hosting | Vercel |

## Quick Start

```bash
pnpm install
cp .env.example .env.local  # Add your API keys
npx drizzle-kit push        # Setup database
pnpm dev                    # http://localhost:3000
```

## Testing

### Test Commands

```bash
pnpm test           # Run all tests
pnpm test:watch     # Run tests in watch mode
pnpm test:smoke     # Fast smoke tests (stores, env, type-guards)
pnpm test:coverage  # Generate coverage report
pnpm test:e2e       # Run Playwright E2E tests
pnpm test:e2e:ui    # Run E2E tests with UI
```

### Test Tiers

| Tier | Trigger | Tests Included | Target Time |
|------|---------|----------------|-------------|
| Smoke | Every push | Lint, type check, unit tests | < 2 min |
| Full | PRs to main/master | Build, all tests, coverage | < 5 min |
| E2E | Manual/nightly | Full user flows | < 15 min |

### CI/CD Workflows

- **ci.yml** - Smoke tests on every push
- **ci-full.yml** - Full test suite on PRs to main/master (required to pass for merge)
- **e2e.yml** - E2E tests (manual trigger or nightly)

### Branch Protection

The `master` and `main` branches are protected with the following requirements:

1. **Required status checks**: The `ci-full` workflow must pass before merging
2. **Coverage reports**: Generated on every PR and optionally uploaded to Codecov
3. **Build verification**: Production build must succeed before tests run

To configure branch protection in GitHub:
1. Go to **Settings > Branches > Branch protection rules**
2. Add rule for `master` (or `main`)
3. Enable **Require status checks to pass before merging**
4. Select **Build, Lint & Full Tests** as a required check
5. Optionally enable **Require branches to be up to date before merging**

## Project Structure

```
plan/                  # Detailed specs and architecture docs
├── 00-architecture/   # System design, data flow
├── 01-backend/        # Database, API routes
├── 02-frontend/       # Components, wireframes
├── 03-vision/         # MediaPipe, form detection per exercise
├── 04-voice-ai/       # Vapi integration, prompts
├── 05-contingencies/  # Scope reduction, troubleshooting
└── 06-sprint-timeline/# Hour-by-hour hackathon plan

src/                   # Application code
├── app/               # Next.js App Router
├── components/        # React components
├── lib/               # Vision, voice, database utilities
└── stores/            # Zustand state management
```

## Exercise Support

| Tier | Exercises | Capabilities |
|------|-----------|--------------|
| **Tier 1** | Cat-Camel, Cobra, Dead Bug | Full AI form detection |
| **Tier 2** | 49 additional exercises | Voice-guided only |

## Hackathon Context

Built for **nwHacks 2026** (UBC Vancouver). Target: Healthcare track.

**Personal motivation**: Herniated disc, $8K in physio bills, 3-week wait for first appointment, could only get seen once every 2 weeks. Built this so others don't have to go through the same thing.

## Documentation

- `CLAUDE.md` - AI assistant instructions for this codebase
- `plan/README.md` - Full technical documentation
- `plan/PLAN_SUMMARY.md` - Consolidated hackathon plan
