# 05 — Voice Pipeline

> **Decision:** composed **Deepgram STT → GPT-5.6 → Deepgram Aura TTS**, orchestrated
> by Rehabify. Not Vapi. Not Deepgram's end-to-end Voice Agent API.
>
> Supersedes [ADR-001](./09-decision-log.md) (Gemini 2.0 Flash Live) and removes
> the Vapi dependency entirely. Tracked as **ADR-007**.
>
> All Deepgram facts verified against `developers.deepgram.com` on **2026-08-02**.
> Claims that could not be verified are marked **⚠️ UNVERIFIED** and must be
> confirmed with Deepgram sales before infrastructure is committed.

---

## 1. Why composed, not managed

Vapi (current) and Deepgram Voice Agent (the obvious alternative) both bundle
STT + LLM + TTS behind one socket and run the turn loop for you. Rehabify cannot
use either, for a product reason rather than a cost reason.

Intake is **a controlled questionnaire wearing a conversation's clothes**. The
question graph is clinician-approved; the LLM is allowed to *phrase* an approved
question and *select* among approved follow-ups, and nothing else
([01-product-definition.md](./01-product-definition.md)). A managed agent owns
the turn loop, which means it owns the decision about what to say next. That is
precisely the authority we must not delegate.

Composing also gives us three things we need independently:

- The transcript and the structured extraction land **server-side**, inside the
  PHI boundary, before anything is written. The current implementation extracts
  on the client and writes to Zustand — see [02-current-state.md §4](./02-current-state.md).
- `mip_opt_out=true` (§6) can be enforced in one server-side URL builder rather
  than trusted to a browser.
- The question graph transition is a **deterministic** step between STT and the
  LLM, not a prompt instruction the model may ignore.

Cost is a secondary benefit, not the argument. See §7.

---

## 2. Topology

```text
browser
  mic → AudioWorklet → linear16 @ 16 kHz
    │
    └──WSS──► Rehabify voice gateway  ◄── the PHI boundary starts here
                 │
                 ├──WSS──► Deepgram /v1/listen   (nova-3-medical, mip_opt_out=true)
                 │            └─ turn commit (§4)
                 │
                 ├── deterministic question-graph transition   ← no LLM
                 ├── GPT-5.6 Luna: phrase the allowed question / extract structured answer
                 ├── Zod validation + clinical-rule checks
                 │
                 ├── static approved-question audio (cache hit, ~90% of turns)
                 └──WSS──► Deepgram /v1/speak    (aura-2, mip_opt_out=true)
                 │
  ◄──WSS─────────┘  PCM frames + the visible text that produced them
```

**Browser → Deepgram direct is technically supported and we are not doing it.**
Deepgram issues 30-second ephemeral JWTs from `POST /v1/auth/grant` that only
need to be valid at handshake, and the browser `WebSocket` header limitation is
worked around by passing the token as `Sec-WebSocket-Protocol`. It would work.
It is rejected because `mip_opt_out=true` would live in a client-constructed URL
— a stale or tampered client silently enters PHI into a training corpus — and
because we need the audio and transcript server-side regardless. The extra hop
costs tens of milliseconds against a turn budget measured in hundreds.

We still use `/v1/auth/grant` **server-side**, so the long-lived API key never
sits in the outbound request path and per-session revocation is clean.

---

## 3. The model choice — and the tradeoff we cannot avoid

Deepgram shipped `flux-general-en` since Nova-3: a turn-based conversational
model on `/v2/listen` that emits `EndOfTurn` natively and replaces the entire
`endpointing` + `utterance_end_ms` + `speech_final` heuristic stack. It is
better at exactly the thing that is hard here.

**Flux has no medical variant.** `nova-3-medical` is `/v1/listen` only. You
cannot have both.

| | `nova-3-medical` (`/v1/listen`) | `flux-general-en` (`/v2/listen`) |
|---|---|---|
| Medical vocabulary | 11% WER reduction vs Nova-3 general streaming; 2.7× keyword recall | general model |
| Turn detection | heuristic; you implement it (§4) | model-native `EndOfTurn`, `eot_threshold` |
| Smart formatting | ✅ | ❌ (numerals only) |
| Keyterms | ✅, fixed per connection | ✅, swappable mid-stream via `Configure` |
| Batch re-processing | ✅ | ❌ streaming-only |
| Self-hosted | ⚠️ "coming soon" as of the streaming announcement | ✅ |

**Decision: `nova-3-medical`.** The reasoning is asymmetric-risk, not accuracy
score. Our answer space per question node is *narrow and known* — the question
graph tells us whether we expect a number, a date, a body region, or a yes/no.
That means we can compensate for a turn-detection false positive (re-prompt,
or accept a partial and confirm). We cannot compensate for a mis-transcribed
anatomy term, because we will not know it was wrong.

This is testable and should be tested. Run both against recorded intake audio
and measure **term accuracy vs premature-cutoff rate**. If cutoffs prove worse
in practice than vocabulary errors, Flux at Deepgram's own documented
"High-Reliability Mode" (`eot_threshold=0.85`, `eot_timeout_ms=8000`, no eager)
is the fallback — that profile is explicitly recommended for medical settings
and suits a patient who pauses to think.

### Connection parameters

```
wss://api.deepgram.com/v1/listen
  ?model=nova-3-medical
  &encoding=linear16&sample_rate=16000&channels=1
  &interim_results=true          # REQUIRED for utterance_end_ms — silent failure otherwise
  &endpointing=400
  &utterance_end_ms=1500         # min 1000, max 5000
  &vad_events=true               # SpeechStarted, for barge-in
  &numerals=true
  &smart_format=false            # see below
  &mip_opt_out=true              # see §6 — non-negotiable
  &keyterm=...&keyterm=...       # repeated param, see below
```

**`smart_format=false` is deliberate.** Smart formatting delays finalization
while it waits for an entity to complete, which suppresses `speech_final`
mid-utterance — the documented "waits for more audio when speaking a phone
number" behavior. Since the question graph already tells us the expected answer
type, parsing `"seven out of ten"` → `7` and `"since March"` → a date is more
robust in our own normalization layer, and it decouples formatting from turn
detection.

### Keyterm prompting

Nova-3 and Flux only (Nova-2 and older use the legacy `keywords` feature). The
limit is **500 tokens across all keyterms, not 500 terms**; Deepgram's own
guidance is to stay at 20–50 well-chosen terms.

Three ways to fail silently, all of which we must unit-test:

| Wrong | Right |
|---|---|
| `keyterm=a,b,c` | `keyterm=a&keyterm=b&keyterm=c` |
| `keyterm=rotator cuff` | `keyterm=rotator%20cuff` |
| `keyterm=patella:0.15` (that's `keywords` syntax) | `keyterm=patella` — **weights are not supported** |

**None of these return an error.** The API accepts the value as one literal
keyterm and boosts nothing. A single unit test on the URL builder is the whole
mitigation, and it is required.

Case is preserved and influences output: lowercase common nouns (`patellofemoral`),
capitalize proper nouns. Because Nova-3 cannot swap keyterms mid-stream, we ship
one pruned union list for the knee pathway rather than per-node scoping. (Per-node
scoping is a reason to revisit Flux later.)

---

## 4. Turn detection — implement it exactly

This is the part most likely to be built wrong, so it is specified rather than
described. Deepgram's docs are explicit: **"Do not use `speech_final: true`
alone to capture full transcripts."**

- **`is_final`** — that *audio segment* is frozen. A long answer produces
  **several** `is_final` messages before the turn ends. You must accumulate them.
- **`speech_final`** — VAD saw `endpointing` ms of silence. This is the
  *utterance* boundary. Commit the buffer.
- **`UtteranceEnd`** — a safety net computed from word timings, not acoustics.
  It exists because background noise can keep the VAD triggered and suppress
  `speech_final` entirely. Clinic rooms have background noise.
- **`SpeechStarted`** — start of speech, for barge-in.

```ts
let buffer = "";
let committedRecently = false;

onResults(msg => {
  if (msg.is_final) buffer += msg.transcript;
  if (msg.speech_final && buffer) {
    commitTurn(buffer);
    buffer = "";
    committedRecently = true;
  }
});

onUtteranceEnd(msg => {
  // Documented: -1 means the result was already finalized before the
  // utterance_end_ms condition was met. Processing it duplicates the turn.
  if (msg.last_word_end === -1) return;
  if (!committedRecently && buffer) {
    commitTurn(buffer);
    buffer = "";
  }
  committedRecently = false;
});
```

**Known false-trigger source:** `UtteranceEnd` fires on a word-timing gap even
when the patient is still speaking. Deepgram's own worked example shows it
firing mid-thought and concludes it "can make it less ideal for voice agent
applications where you want to wait for truly complete utterances." For a
patient recalling when their knee started hurting, this will happen. Mitigation
is client-side gap logic plus — critically — **the question graph's expected
answer type**: if we expect a number and got `"it started maybe"`, that is a
schema validation failure, not a turn, and we re-prompt rather than advance.

---

## 5. Connection lifecycle — the failure modes

| Behavior | Consequence for us |
|---|---|
| **10s no-data timeout** (`NET-0001`). Send `KeepAlive` every 3–5s during silence. ⚠️ Docs conflict: Keep Alive page says 10s, the Flux comparison table says 12s. 3–5s intervals make it moot. | An 8–12 min intake has long silences while the patient thinks. Without `KeepAlive` the socket dies mid-question. |
| **`KeepAlive` must be a TEXT frame.** Sent as binary it is "handled incorrectly" and causes audio processing to "choke or hiccup." No server ACK. | Classic silent degradation. Assert frame type in the transport layer. |
| **Audio must start within 10s of opening.** | We greet with TTS before the patient speaks. **Open the STT socket late**, or `KeepAlive` from the moment it opens. |
| **Max send rate 1.25× realtime.** | Bounds reconnect catch-up. A 30s buffered gap takes 24s to drain. |
| **Timestamps reset to 00:00:00 on every new connection.** | The clinical record needs per-answer timing for provenance ([stage D](./01-product-definition.md)). Track a session-level offset and add it. |
| **Audio during reconnect is lost** unless buffered client-side. | On reconnect, discard in-flight turn state and **re-ask the current question**. Do not guess at a partial answer. |
| **TTS WebSocket: hard 60-minute cap.** | Per-session sockets are fine. A long-lived shared TTS socket is not. |
| **TTS `Flush` capped at 20 per 60s.** | Flush **per turn**, never per sentence. |
| `diarize` is deprecated, and halves EU/AU streaming concurrency. | Not needed — single-speaker intake. |

Close cleanly with `{"type":"CloseStream"}` so the server flushes remaining
audio and sends summary metadata.

Close codes worth handling distinctly: `1008 DATA-0000` (undecodable audio —
usually wrong `encoding`/`sample_rate`, or a control message sent as binary),
`1011 NET-0001` (client silent — `KeepAlive` does **not** reset this one),
`1011 NET-0002` (no-audio timeout — `KeepAlive` **does** reset this one).

### Concurrency ceiling

Limits are **per project, not per API key**, and Deepgram's ToS explicitly
forbids splitting traffic across projects to evade them.

| | PAYG | Growth (NA) |
|---|---|---|
| Nova-3 / Flux streaming | 150 | 225 |
| **TTS streaming (Aura-2)** | **45** | **60** |

**TTS is the real ceiling, not STT.** One STT + one TTS socket per session caps
us at ~45 concurrent intakes on PAYG. §7 removes TTS from the concurrency path
entirely.

---

## 6. Compliance — the residency problem

This is the section that gates the whole design.

| | Status |
|---|---|
| BAA | ✅ but **Enterprise tier only** — "for Enterprise customers handling electronic Protected Health Information (ePHI)" |
| SOC 2 | Type 1 and Type 2 |
| Encryption | TLS 1.3, AES-256, in flight and at rest |
| EU residency | ✅ `api.eu.deepgram.com` |
| AU residency | ✅ `api.au.deepgram.com` |
| **Canadian residency** | ❌ **No public endpoint exists.** |

The TTS latency doc states it flatly: **"Deepgram's servers are exclusively in
the United States."** The only regional endpoints are EU and AU.

### Model training — read this twice

The pricing page footnote: **"Rates listed above opt in to the Model Improvement
Partnership Program."** For a self-serve account, **the default posture is
opt-in to training on your audio.**

The opt-out is a per-request query parameter:

> "Add `mip_opt_out=true` as a query parameter of **all** API requests that you
> want to be excluded from the Model Improvement Program. **Data from opted-out
> requests is retained only for the duration necessary to process the request.**"

That second sentence is our zero-retention guarantee, and it is **per request**,
not per account. Consequences:

1. It must be on **STT, TTS, and every other** Deepgram call.
2. It is enforced in **one** URL builder, server-side, with a unit test.
3. **A single request missing the flag is a PHI disclosure.** Treat the builder
   as security-critical code — same review bar as the RLS boundary in
   [03-data-architecture.md](./03-data-architecture.md).
4. Deepgram's published rates assume opt-in. **Get the opt-out rate in writing**
   during the Enterprise negotiation; the MIP doc lists "discounted pricing for
   program participants" as a benefit without publishing the delta.

Deepgram's privacy policy was last updated **2021-10-26** and is silent on model
training. The MIP doc is the operative source. That staleness is itself worth
raising in the contract conversation.

### Paths to Canadian residency

**Deepgram Dedicated** — single-tenant, fully managed, "runs on AWS
infrastructure in your preferred region." AWS has `ca-central-1` (Montreal) and
`ca-west-1` (Calgary), so this is the most likely path without running our own
GPUs. **⚠️ Deepgram publishes no region list. Unconfirmed.**

**Self-hosted** — Enterprise plan, Docker/Podman/Kubernetes in our own VPC,
**requires NVIDIA GPUs**. The license server phones home with metadata only:
"no audio, transcripts, or other identifying markers of the request content are
sent to Deepgram." Flux is available self-hosted. **⚠️ `nova-3-medical`
self-hosted was "coming soon" as of the streaming announcement and I found no
doc confirming it shipped.** If it has not, self-hosting forces the Flux
tradeoff from §3. (Also note the public AWS Marketplace Nova-3 Medical listing is
labelled **batch** — not usable for streaming intake.)

> **Decided 2026-08-02 — self-hosted is now the plan, not one of two options.**
> [ADR-013](./09-decision-log.md#adr-013) selects self-hosting in `ca-central-1`,
> funded by cloud credits, and re-aims the Deepgram conversation from a residency
> *request* to an Enterprise *sales* call. Dedicated remains the fallback if the
> GPU operational burden proves unjustified. Question 2 below is now the one that
> decides the architecture.

### Questions for Deepgram sales — before infrastructure is provisioned

1. Can Dedicated be provisioned in AWS `ca-central-1`, and does the BAA cover it?
2. Is `nova-3-medical` available on Dedicated and/or self-hosted **today**?
3. What rate applies with `mip_opt_out=true`, and can **zero retention be
   written into the contract** rather than depending on a query parameter?
4. Where does Aura-2 TTS run for a Dedicated customer? Question text is
   PHI-adjacent — a question can encode the answer to the previous one.

> **This is a gating dependency, not a detail.** If the answer to (1) or (2) is
> no, either the medical model or Canadian residency has to give, and that is a
> decision for the clinical lead and counsel — not an engineering call.
>
> *Updated: the Canada-vs-US market question this note originally hedged against
> is settled — [ADR-011](./09-decision-log.md#adr-011) accepted British Columbia,
> so the "a US market makes this moot" escape hatch is closed. This section is
> load-bearing.*

---

## 7. TTS — pre-render the approved questions

**The question graph is clinician-approved and versioned. Most prompts are
static.** That is not a cost optimization, it is a direct consequence of the
product's authority boundary — and it happens to solve three problems at once.

**Pre-render every approved question to audio at build time**, keyed by
`(question_id, prompt_version, voice, model)`. Use live TTS only for
LLM-generated clarifications and confirmations.

| Problem | Effect of pre-rendering |
|---|---|
| TTS is ~4× the STT cost per session (§ below) | Collapses to near zero |
| TTS concurrency cap of 45 is the system ceiling | Removes TTS from the concurrency path |
| Approved wording must be exact and reviewable | The audio artifact *is* the reviewed artifact, pinned to a `prompt_version` |
| `Flush` rate limit of 20/60s | Rarely approached |

Cost model, 10-minute session, PAYG promo rates:

| | Rate | Session cost |
|---|---|---|
| STT, Nova-3 mono streaming | $0.0048/min | **$0.048** |
| TTS Aura-2, ~6,000 chars | $0.030/1k chars | **$0.180** |
| TTS Aura-1, ~6,000 chars | $0.0150/1k chars | $0.090 |
| | | **~$0.23/session, TTS-dominated** |

Billing is **true per-second**. Against the current Vapi bundle at ~$0.15/min
(~$40/patient/month per [02-current-state.md](./02-current-state.md)), the
composed pipeline with pre-rendered audio is roughly two orders of magnitude
cheaper. Enterprise pricing will differ; treat these as shape, not budget.

### Voice and API shape

Aura-2, `aura-2-{voice}-{lang}`. Deepgram's own descriptors point at two
candidates for clinical tone: **`aura-2-harmonia-en`** ("Empathetic, Clear,
Calm, Confident") and **`aura-2-vesta-en`** ("Natural, Expressive, Patient,
Empathetic"). Pick one with the clinical lead; it is a product decision.

**Do not use Flux TTS** (`/v2/speak`). It is Early Access and Deepgram states
"the API surface and voice catalog may change before general availability."
Not a foundation for a clinical product.

Encoding split that shapes the client:

> "The streaming WebSocket emits raw audio only: `linear16`, `mulaw`, or
> `alaw`. Compressed and containerized encodings (`mp3`, `opus`, `flac`, `aac`)
> are available on the **REST endpoint only**."

So: WS gives PCM that must go through Web Audio / AudioWorklet — no
`<audio src>`. REST gives MP3 that plays directly, but **REST from the browser
is blocked by Deepgram's CORS headers and requires a proxy** (WebSocket is
unaffected). Since we proxy everything server-side anyway (§2), this is a
non-issue: pre-rendered questions ship as cached MP3 from our own origin, and
live clarifications stream as PCM over our gateway socket.

WS message flow: multiple `{"type":"Speak","text":"..."}` as LLM tokens arrive,
then `{"type":"Flush"}` to synthesize. `{"type":"Clear"}` drops queued audio —
that is the barge-in primitive, paired with `SpeechStarted` from STT.

Latency: Aura-2 TTFB is ~90ms steady-state (p95 under 200ms). REST is
`≈600ms + 40ms per 100 characters`, max 2,000 chars per request — and that
~600ms constant "includes network latency" measured from the US, so it will be
worse from Canada until residency is settled.

---

## 8. LLM in the loop — GPT-5.6 Luna

Full rationale and the routing table live in
[06-ai-pipelines.md](./06-ai-pipelines.md); the voice-specific parts:

- **Luna handles intake turns.** Phrasing an approved question and extracting a
  structured answer against a known schema is a bounded task at high volume —
  the tier is well matched, and the ~1M context window means the full episode
  transcript fits without retrieval gymnastics.
- **Structured outputs are mandatory**, not best-effort. Every extraction is a
  Zod schema round-trip. The current codebase's `findClosestSlug` fuzzy matcher
  is deleted, not ported — see [02-current-state.md §5](./02-current-state.md).
- **The LLM never decides the next question.** It receives the allowed set from
  the deterministic graph transition and selects or phrases within it.
- **Safety, consent, and outcome content is exact reviewed wording** and never
  passes through the model at all. It goes straight to the pre-rendered audio
  cache.
- Every turn emits a trace with `prompt_version`, model ID, token counts, and
  the validation verdict — see [06-ai-pipelines.md](./06-ai-pipelines.md).

---

## 9. What gets deleted

From [02-current-state.md](./02-current-state.md), the following are removed
rather than migrated:

- `@vapi-ai/web` and all of `src/lib/vapi/` (8 files)
- `src/hooks/use-vapi.ts`, `use-assessment-vapi.ts`, `assessment-vapi-config.ts`
- `src/app/api/vapi/webhook/`, `src/app/api/vapi/assessment-webhook/` — both
  unauthenticated and unsigned, both accept patient data
- `VAPI_PRIVATE_KEY`, `VAPI_WEBHOOK_SECRET` (declared required in `src/lib/env.ts`,
  referenced by zero files)
- The 13-node workflow graph in `workflow-nodes.ts` / `workflow-edges.ts`, which
  is declared but never executed
- Client-side structured extraction into `voice-store.ts`

The one thing worth porting is the **provider-neutral adapter boundary** from
`rehabifyy/packages/speech/` — `SttProvider` / `TtsProvider` / `PinnedSpeechProfile`,
with its residency, retention, and deletion evidence refs. Given §6 is unresolved
and Flux remains a live fallback, that boundary is load-bearing, not ceremony.

---

## 10. Open items

| # | Item | Blocks |
|---|---|---|
| 1 | Dedicated in `ca-central-1`? BAA coverage? | Infrastructure provisioning |
| 2 | `nova-3-medical` self-hosted/Dedicated availability today | §3 model decision |
| 3 | `mip_opt_out=true` rate card; zero retention contractual vs runtime | Enterprise negotiation |
| 4 | Where Aura-2 runs for a Dedicated customer | §6 |
| 5 | `nova-3-medical` pricing — not listed separately; premium or Nova-3 mono rate? | §7 cost model |
| 6 | Aura-2 availability on EU/AU regional endpoints (docs list `/v1/speak` but not which models) | Fallback planning |
| 7 | Whether the BAA covers `mip_opt_out` behavior contractually | §6 |
| 8 | Flux vs `nova-3-medical` bake-off on recorded intake audio | §3 — **do this before the pilot** |

---

*Sources: `developers.deepgram.com`, `deepgram.com/pricing`, retrieved 2026-08-02.*
