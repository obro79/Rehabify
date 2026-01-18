# Rehabify - Devpost Submission

## Inspiration

After spending $8K on physio bills, waiting 3 weeks for my first appointment, and only getting seen once every 2 weeks for a herniated disc, I realized the broken part of physical therapy isn't the clinic—it's what happens at home. Only 35% of patients complete their prescribed exercises because they're unsure about their form and have zero supervision between visits. PTs have no visibility into whether patients are doing exercises correctly, incorrectly, or at all. We built Rehabify to close this gap and make quality PT accessible to everyone.

## What it does

Rehabify is an AI-powered physical therapy coach that provides real-time form correction using just a webcam. Patients perform their prescribed exercises at home, and our computer vision system analyzes their movement in real-time, giving instant voice feedback like "Keep your back straight" or "Lower those hips." On the other side, physical therapists get a dashboard showing completion rates, form quality scores, and problem areas—transforming PT from opaque guesswork into transparent, data-driven care.

**Key features:**
- Real-time pose detection tracking 33 body landmarks at 30fps
- Instant voice coaching with < 1 second feedback
- Privacy-first: all video processing runs locally on device
- PT dashboard for remote progress monitoring
- Safety stops: red flag symptoms trigger immediate doctor referrals

## How we built it

**Frontend:** Next.js 15, React 19, Tailwind CSS with custom "wellness sanctuary" design system
**Computer Vision:** MediaPipe Pose running in WebAssembly via Web Workers for real-time skeleton tracking
**Voice AI:** Vapi integration (Deepgram STT + GPT-4o + ElevenLabs TTS) for natural coaching feedback
**Database:** Neon PostgreSQL with Drizzle ORM for user data and exercise tracking
**Form Analysis:** Custom algorithms analyzing joint angles, body alignment, and movement patterns
**Deployment:** Vercel with edge functions for low-latency performance

We structured the project with detailed specs in `/plan` covering architecture, database schema, component hierarchy, and exercise-specific form detection rules. All exercises were sourced from licensed PT resources and validated for safety.

## Challenges we ran into

**1. Real-time performance:** Getting MediaPipe to run smoothly at 30fps while analyzing complex movements was tough. We solved this by offloading pose detection to Web Workers and implementing the 1-Euro filter for smooth landmark tracking.

**2. Form validation accuracy:** Detecting "good" vs "bad" form is nuanced—what's correct for one person's body might be wrong for another. We built rule-based validation with angle thresholds for 3 core exercises (Cat-Camel, Cobra, Dead Bug) and plan to expand with machine learning for personalization.

**3. Privacy + AI tension:** Patients worry about video privacy. We architected the system so all computer vision runs locally in the browser—video never leaves the device, only anonymized pose landmarks are stored.

**4. Medical liability:** We're not replacing doctors. We implemented safety stops in the intake flow: if patients report serious symptoms (bowel issues, numbness, severe pain), the system doesn't generate a plan and directs them to in-person care immediately.

## Accomplishments that we're proud of

- Built a working real-time form correction system in 48 hours
- Surveyed PTs and got 100% saying this would make therapy more accessible
- Achieved < 1 second latency for voice feedback
- Created a complete design system with "pillowy" wellness aesthetics
- Implemented HIPAA-ready data architecture
- Got 3 exercises working with accurate form detection
- Built both patient and PT dashboards with real progress tracking

Most importantly: we validated that this solves a real problem. The 35% compliance stat is real, and every PT we talked to lit up when they saw the dashboard.

## What we learned

**Technical:**
- MediaPipe Pose is incredibly powerful but requires careful tuning for different body types
- Voice AI has come far—GPT-4o can give nuanced coaching feedback that feels human
- Next.js 15 App Router + React Server Components are perfect for healthcare apps with mixed public/private data
- Privacy-first architecture is possible AND performant with modern browser APIs

**Product:**
- PTs want data, not just completion checkboxes—they want to see HOW exercises were done
- The two-sided value (patient + PT) is what makes this defensible
- Safety stops are non-negotiable in healthcare—better to under-serve than cause harm
- "Movement quality tracking" is a better frame than "AI coach"

**Hackathon strategy:**
- Ship the core experience first, polish later
- Survey your users early—real validation beats assumptions
- Documentation pays off—our `/plan` folder kept us aligned under time pressure

## What's next for Rehabify

**Short-term (next 3 months):**
- Expand from 3 exercises to 52 (full PT library)
- Mobile app (React Native) for better camera angles
- PT onboarding flow to assign custom exercise plans
- Integration with clinic scheduling systems

**Medium-term (6-12 months):**
- Machine learning for personalized form validation (not just rule-based)
- Progress prediction: "You're 73% likely to recover in 4 weeks based on current adherence"
- Insurance integration: bill for "remote therapeutic monitoring" (CPT code 98975)
- Clinical trials with UBC PT department to validate outcomes

**Long-term vision:**
- B2B SaaS for PT clinics: $50/month per therapist, unlimited patients
- Hospital partnerships for post-surgery rehab
- Expand to other movement domains: sports training, elderly fall prevention, Parkinson's gait therapy

**The bigger picture:** We want to make high-quality movement coaching accessible to everyone, everywhere. Physical therapy shouldn't require proximity to an expensive clinic—it should be something you can do confidently at home, with real-time guidance and professional oversight. Rehabify is the infrastructure to make that happen.
