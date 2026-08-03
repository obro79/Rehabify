"""Stand-in for the Next.js route that will persist intake turns.

This exists so the hop in `client.py` is a real network call during development
rather than a `TODO` and an in-process function. The shape of the request is the
deliverable; the storage is not.

**It is a stub, and it must stay one in this repo.** The real route belongs in
the TypeScript tier, which owns Drizzle, RLS, and the `db.rls`/`db.admin` split
(doc 03 §4). Slice 1 builds the schema; slice 3 wires the route. If you find
yourself adding a database client to *this* file, the thing that has gone wrong
is that it is in the wrong repository.

    uv run python -m voice_gateway.persistence.stub_server
"""

from __future__ import annotations

import argparse
import logging

import uvicorn
from fastapi import FastAPI, Header, HTTPException

from voice_gateway.contracts import TurnEvent

logger = logging.getLogger(__name__)

app = FastAPI(title="Intake persistence stub", docs_url=None, redoc_url=None)

# In-memory, per-process, and discarded on restart. Nothing here is a record.
_received: list[TurnEvent] = []


@app.post("/api/internal/intake/turn", status_code=201)
async def persist_turn(
    event: TurnEvent,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    """Validate and acknowledge. The real route writes through db.rls."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")

    _received.append(event)
    # Identifiers only, matching what the real route may log. The transcript is
    # PHI and is not a log line here or there.
    logger.info(
        "stub accepted turn session=%s index=%d question=%s outcome=%s cache_hit=%s",
        event.session_id,
        event.turn_index,
        event.question_id,
        event.outcome,
        event.tts_cache_hit,
    )
    return {"accepted": True, "turn_index": event.turn_index}


@app.get("/api/internal/intake/turn/_debug")
async def list_received() -> dict[str, object]:
    """Development affordance for the demo page and the integration test.

    Returns identifiers and counts, not transcripts — the same discipline the
    real service is held to, so that reading this file does not teach the wrong
    habit.
    """
    return {
        "count": len(_received),
        "turns": [
            {
                "session_id": e.session_id,
                "turn_index": e.turn_index,
                "question_id": e.question_id,
                "outcome": e.outcome,
                "tts_cache_hit": e.tts_cache_hit,
                "answer_chars": len(e.answer.transcript) if e.answer else 0,
            }
            for e in _received
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the intake persistence stub.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s stub: %(message)s")
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
