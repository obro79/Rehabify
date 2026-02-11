# Glossary

Domain terms used across the Rehabify B2B redesign specification.

---

| Term | Definition |
|------|-----------|
| **ADL** | Activities of Daily Living. Functional tasks (dressing, bathing, walking) used to measure rehabilitation outcomes. |
| **BAA** | Business Associate Agreement. HIPAA-required contract between a covered entity and a business associate that handles PHI. |
| **CPT** | Current Procedural Terminology. Standardized codes used by healthcare providers to bill for medical services. |
| **CPT 98977** | Remote physiologic monitoring treatment management, each additional 20 minutes. Used for device-based data transmission (16+ days/month triggers billing eligibility). |
| **CPT 98980** | Remote therapeutic monitoring treatment management services, first 20 minutes. Used for PT interactive communication based on monitoring data. |
| **DTW** | Dynamic Time Warping. Algorithm for measuring similarity between temporal sequences that may vary in speed. Used to compare patient movements against reference motions. |
| **EHR** | Electronic Health Record. Digital version of a patient's paper chart, used by clinics to manage patient data. |
| **HIPAA** | Health Insurance Portability and Accountability Act. US federal law establishing standards for PHI protection. |
| **Landmark** | A 3D coordinate point on a human body detected by MediaPipe Pose (33 landmarks per frame: nose, shoulders, elbows, wrists, hips, knees, ankles, etc.). |
| **MediaPipe** | Google's open-source framework for building multimodal ML pipelines. Rehabify uses the Pose Landmarker task for body tracking. |
| **Multi-tenancy** | Architecture pattern where a single software instance serves multiple tenants (clinics) with data isolation. |
| **PHI** | Protected Health Information. Any individually identifiable health information covered under HIPAA. |
| **RLS** | Row-Level Security. PostgreSQL feature that restricts which rows a given user can access. Used for multi-tenant data isolation. |
| **ROM** | Range of Motion. Measurement of joint movement extent, a key PT metric tracked by the vision system. |
| **RTM** | Remote Therapeutic Monitoring. CMS-defined category of services for monitoring patient-reported outcomes and device-based data outside of clinical settings. CPT 98977 and 98980 fall under RTM. |
| **Silero VAD** | Voice Activity Detection model from Silero. Runs as client-side WASM to detect when a user is speaking before sending audio to the server. |
| **STT** | Speech-to-Text. Converting audio to text. Current: Deepgram (via Vapi). Target: Gemini 2.0 Flash Live (native). |
| **TTS** | Text-to-Speech. Converting text to audio. Current: ElevenLabs (via Vapi). Target: Gemini 2.0 Flash Live (native). |
| **VAD** | Voice Activity Detection. Determines whether audio contains speech. Used to avoid sending silence to the LLM and reduce costs. |
| **Vapi** | Voice AI platform currently used by Rehabify. Bundles STT + LLM + TTS into a managed service at ~$0.15/min. |
| **WASM** | WebAssembly. Binary instruction format for stack-based virtual machines. MediaPipe and Silero VAD both run as WASM modules in the browser. |
