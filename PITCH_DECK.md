# Rehabify
**AI-powered PT coach with real-time form correction**

---

## The Problem

**Only 35%** of patients do their prescribed exercises
**Zero visibility** for PTs on what happens at home
**$8K** in physio bills, **3 week** wait times

PT doesn't fail in the clinic. **It fails between visits.**

The gap: Patients unsure about form → Skip exercises → Slower recovery

---

## The Solution

**Rehabify closes the visibility gap**

Real-time form correction + PT dashboard = transparent rehab

```
Patient does exercise
    ↓
AI corrects form instantly: "Keep your back straight"
    ↓
PT sees: completion rate, form quality, problem areas
```

**What we track:** Movement quality, not just completion

---

## How It Works

```
Webcam (30fps)
    ↓
MediaPipe Pose (33 body landmarks)
    ↓
Form Analysis (< 1 sec)
    ↓
Voice AI Coach → "Lift those hips up!"
```

All processing runs **locally** - your video never leaves your device.

---

## Demo

[Live demo or video here]

Try exercise: Cat-Camel, Cobra, or Dead Bug

---

## Impact (Survey Results)

**Compliance:** 35% → Higher (transparent tracking)
**Accessibility:** Saves PTs **1-2 hours/week per patient**
**Quality:** Real-time feedback = better outcomes

**100%** of surveyed PTs said this would make therapy more accessible and affordable

---

## "But Can We Trust AI?" - Safety First

**Exercise Library:** All exercises sourced from licensed PTs
**Compliance:** HIPAA-ready data handling
**PT-in-the-Loop:** Human oversight on all plans
**Safety Stops:** Red flag symptoms? → "See a doctor immediately"

Example: Intake asks about serious symptoms (bowel issues, numbness)
→ System won't generate plan, directs to in-person care

---

## Tech Stack

**Frontend:** Next.js 15, React 19, Tailwind
**Vision:** MediaPipe Pose (WebAssembly)
**Voice:** Vapi (Deepgram + GPT-4o + ElevenLabs)
**Database:** Neon PostgreSQL
**Hosting:** Vercel

---

## Why Rehabify Wins

**The gap no one else is solving:** Movement quality tracking at home

Our edge:
- **Privacy-first:** Video processed locally, never uploaded
- **Instant feedback:** < 1 sec form correction
- **PT empowerment:** Dashboard shows what actually happens
- **Safety-first:** Medical validation + serious symptom detection

Market: **$48B global PT market**

---

## What's Next

**Short-term:**
- 49 more exercises
- Mobile app
- PT dashboard for remote monitoring

**Long-term:**
- Insurance partnerships
- Clinical trials
- B2B hospital platform

---

## The Team

Built at **nwHacks 2026** by developers who experienced the pain of inaccessible PT firsthand.

---

## Ask

Looking for:
- Beta testers (patients + PTs)
- Healthcare advisors
- Feedback on product direction

**Try it:** [demo link]
**Contact:** [your email/info]
