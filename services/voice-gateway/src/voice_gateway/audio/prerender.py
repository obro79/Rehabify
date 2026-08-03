"""Build-time renderer for the approved question set.

Run this whenever the question graph or its `prompt_version` changes. The output
is checked against the manifest at runtime and a mismatch is a hard miss, so
forgetting to re-run it is loud rather than silent.

    uv run prerender-questions            # real Aura render, needs credentials
    uv run prerender-questions --offline  # placeholder tones, no credentials

`--offline` is not a fallback the server uses — it exists so the turn loop,
the tests, and a demo can run without Deepgram access. The tones are obviously
not speech, which is the intent: nobody should be able to mistake an offline
render for a rendered question.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import math
import struct
import sys
from pathlib import Path

import httpx

from voice_gateway.audio.cache import MANIFEST_NAME, CacheKey, text_digest
from voice_gateway.config import Settings, get_settings
from voice_gateway.contracts import QuestionNode
from voice_gateway.deepgram.auth import EphemeralTokenProvider
from voice_gateway.deepgram.urls import build_speak_url
from voice_gateway.graph.mock_graph import all_prerenderable_nodes

logger = logging.getLogger(__name__)


def _placeholder_pcm(text: str, sample_rate: int) -> bytes:
    """A short two-tone chirp, length proportional to the text.

    Deliberately not speech-like. An offline render must never be mistaken for
    an approved recording.
    """
    duration = min(4.0, max(0.6, len(text) / 45))
    total = int(duration * sample_rate)
    frames = bytearray()
    for i in range(total):
        t = i / sample_rate
        freq = 440.0 if (i // (sample_rate // 4)) % 2 == 0 else 330.0
        envelope = min(1.0, t * 8, (duration - t) * 8)
        value = int(6000 * envelope * math.sin(2 * math.pi * freq * t))
        frames += struct.pack("<h", value)
    return bytes(frames)


async def _render_via_deepgram(
    node: QuestionNode, settings: Settings, tokens: EphemeralTokenProvider, client: httpx.AsyncClient
) -> bytes:
    token = await tokens.get_token()
    url = build_speak_url(
        model=settings.tts_model,
        sample_rate=settings.tts_sample_rate,
        over_http=True,
    )
    response = await client.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"text": node.text},
        timeout=60.0,
    )
    response.raise_for_status()
    return response.content


async def render_all(*, offline: bool, settings: Settings | None = None) -> Path:
    settings = settings or get_settings()
    out_dir = settings.audio_cache_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    nodes = all_prerenderable_nodes()
    manifest: dict[str, dict[str, object]] = {}

    tokens: EphemeralTokenProvider | None = None
    client: httpx.AsyncClient | None = None
    if not offline:
        if not settings.has_deepgram_credentials:
            raise SystemExit(
                "no Deepgram credentials configured. Set VOICE_GATEWAY_DEEPGRAM_API_KEY, "
                "or pass --offline to write placeholder tones."
            )
        tokens = EphemeralTokenProvider(settings)
        client = httpx.AsyncClient()

    try:
        for node in nodes:
            key = CacheKey(
                question_id=node.id,
                prompt_version=node.prompt_version,
                model=settings.tts_model,
                sample_rate=settings.tts_sample_rate,
            )
            if offline:
                pcm = _placeholder_pcm(node.text, settings.tts_sample_rate)
            else:
                assert tokens is not None and client is not None
                pcm = await _render_via_deepgram(node, settings, tokens, client)

            path = out_dir / key.filename()
            path.write_bytes(pcm)
            manifest[key.filename()] = {
                "question_id": node.id,
                "prompt_version": node.prompt_version,
                "model": key.model,
                "sample_rate": key.sample_rate,
                # The runtime check that catches approved wording edited
                # without a version bump.
                "text_digest": text_digest(node.text),
                "pcm_bytes": len(pcm),
                "offline_placeholder": offline,
            }
            logger.info("rendered %s (%d bytes)", node.id, len(pcm))
    finally:
        if client is not None:
            await client.aclose()
        if tokens is not None:
            await tokens.aclose()

    manifest_path = out_dir / MANIFEST_NAME
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    return manifest_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--offline",
        action="store_true",
        help="write placeholder tones instead of calling Deepgram",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING)
    manifest = asyncio.run(render_all(offline=args.offline))
    print(f"wrote {manifest}")
    if args.offline:
        print("NOTE: placeholder tones, not speech. Re-run without --offline before any demo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
