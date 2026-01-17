# Anticipated Judge Questions & Answers

## Technical Questions

**Q: How accurate is the pose detection?**
> MediaPipe Pose is Google's production-grade model - same tech behind Google Fit and other fitness apps. It tracks 33 body landmarks with sub-centimeter accuracy in good lighting. We're not doing medical diagnosis - we're detecting obvious form errors like "your hips are sagging" or "round your back more." It's coach-level feedback, not X-ray precision.

**Q: What happens if the detection is wrong?**
> Two safeguards: First, we debounce errors for 500ms - so a momentary wobble doesn't trigger correction. Second, our error thresholds are conservative - we only flag obvious mistakes. False positives are annoying; false negatives are just a missed coaching moment. We err toward fewer, more confident corrections.

**Q: Why client-side vision instead of sending video to the cloud?**
> Privacy and latency. Healthcare users care deeply about their body images not being uploaded. And cloud round-trip would add 200-500ms latency - too slow for real-time correction. Running MediaPipe in a Web Worker gives us ~33ms pose detection with zero privacy concerns.

**Q: How do you handle different body types, lighting, camera angles?**
> MediaPipe is trained on diverse datasets and handles most conditions well. We recommend good lighting and full-body framing during onboarding. Edge cases (extreme angles, poor lighting) degrade gracefully - we just don't give corrections if confidence is low, rather than giving wrong feedback.

**Q: What's the latency from error to voice correction?**
> Under 1 second total. ~50ms for detection, 500ms intentional debounce, ~400ms for Vapi (LLM + TTS). The debounce is actually important - immediate corrections feel naggy. The slight delay feels more like a coach observing then commenting.

---

## Business Questions

**Q: How do you make money?**
> B2B2C model. We sell to PT clinics who give it to their patients. Clinics pay $25-50/month per clinician seat. They get a dashboard showing patient compliance and progress. Patients get better outcomes, clinics get data and differentiation.

**Q: What's your market size?**
> 40,000+ PT clinics in North America. Average clinic has 3-5 clinicians. Even 1% penetration at $40/seat = $4.8M ARR. Home exercise compliance is a $2B+ problem - 50-70% of patients don't do their prescribed exercises correctly.

**Q: Who are your competitors?**
> PT exercise apps like Physitrack, PT Pal, Kaia Health. None have real-time AI form correction. They're basically PDF exercise sheets turned into apps. We're the first to close the feedback loop with computer vision + voice.

**Q: Why wouldn't a big player just copy this?**
> They might eventually. But integrating real-time vision + voice is genuinely hard - we've spent months on the architecture. Plus, first-mover advantage with clinic partnerships and the exercise detection library creates a moat. Kaia raised $75M and still doesn't have this.

**Q: What's your go-to-market?**
> Start with Vancouver PT clinics (we're doing customer discovery now). Land 3 pilot clinics, prove outcomes, then expand through PT conferences and referrals. Clinics talk to each other - one happy clinic = warm intros to others.

---

## Healthcare / Liability Questions

**Q: What about liability if someone gets hurt?**
> We're a coaching tool, not a medical device. Like a fitness app, not a prescription. Our terms are clear: this supplements PT guidance, doesn't replace it. The exercises are prescribed by their actual PT - we just help them do it correctly. We're reducing injury risk, not creating it.

**Q: Is this HIPAA compliant?**
> We're designed HIPAA-conscious. Video never leaves the device - only anonymized joint angles and scores are transmitted. No PII in pose data. Audio goes through Vapi (encrypted). For full HIPAA compliance at scale, we'd add BAAs with our cloud providers. For MVP/hackathon, we're privacy-first by architecture.

**Q: Are you FDA regulated?**
> No. We're a wellness/coaching product, not a medical device. We don't diagnose, treat, or claim to cure anything. We help people do exercises their PT already prescribed. Same regulatory category as Peloton or Apple Fitness+.

**Q: What if the AI gives bad advice?**
> The AI doesn't prescribe exercises - it only coaches form on exercises the PT already selected. Worst case: it says "lift your hips" when your hips are fine. Annoying, not dangerous. We're not saying "do 50 more reps" - we're saying "here's how to do the rep your PT prescribed."

---

## Product Questions

**Q: Why not just watch a YouTube video?**
> YouTube can't see you. It can't tell you "your hips are dropping right now." The whole point of PT is personalized feedback - that's what we provide at scale. YouTube is a demo; we're a coach.

**Q: Why would someone use this instead of going to PT?**
> They wouldn't - we're complementary, not a replacement. Patients see their PT 1-2x per week but should exercise 5-7 days. We fill the gap. PTs love this because it extends their reach and improves compliance.

**Q: What exercises do you support?**
> Launch with 3 Tier 1 exercises with full AI form detection (Cat-Camel, Cobra, Dead Bug) - these cover core/spine rehab which is the biggest PT category. Plus 49 Tier 2 exercises with voice guidance and rep counting (no AI form detection). We can add more detection algorithms over time.

**Q: Why voice instead of just visual feedback?**
> You can't look at a screen while doing Cat-Camel - you're facing the floor. Voice lets us give feedback while you're in the pose. It's also more natural - like having a coach in the room. Visual feedback (the skeleton overlay) is secondary confirmation.

**Q: What if I don't want voice / I'm in public?**
> Voice is the primary experience, but we show visual cues too (coral highlighting on problem joints). Future: could add haptic feedback for smartwatches. But honestly, most PT exercises are done at home where voice is fine.

---

## Team Questions

**Q: Why are you the right team to build this?**
> We're UBC CS students working with UBC Physiotherapy students. We have the technical chops (real-time vision/voice is hard) plus direct domain access. We're not guessing what PTs need - we're asking them (customer discovery underway).

**Q: How long have you been working on this?**
> [Adjust based on reality] Started planning X weeks ago, intensive build during this hackathon. The architecture and specs are well thought out - we're not winging it.

**Q: What's your unfair advantage?**
> The intersection of real-time vision + voice AI for healthcare is unexplored territory. Most teams pick one or the other. We've figured out how to make them work together with sub-second latency. Plus our PT student advisors keep us grounded in real clinical needs.

---

## Skeptical Questions (Hardball)

**Q: Isn't this just a feature, not a company?**
> The form detection engine is the hard part - it's an exercise-by-exercise investment. That library becomes our moat. Plus the clinic dashboard, patient progress tracking, plan generation... it's a platform, not a feature.

**Q: What if patients just ignore the corrections?**
> Same problem as human PTs face. But we have data - we can show clinics "this patient ignores hip corrections 80% of the time" so they can address it in-person. We make the invisible visible.

**Q: This seems complicated - what's your MVP?**
> One exercise (Cat-Camel), one user flow (start session → get corrections → see score). That's the demo. Everything else is expansion. The core insight - vision informs voice in real-time - works today.

**Q: What's the biggest risk?**
> Voice latency in production. We've architected for <1 second, but real-world network conditions vary. Mitigation: we can fall back to canned responses for common errors (instant playback) while LLM generates nuanced feedback.
