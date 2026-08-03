"""Pre-rendered approved-question audio.

05 §7. The question graph is clinician-approved and versioned, so most prompts
are static — which is not a cost optimisation but a direct consequence of the
product's authority boundary, and it happens to solve three problems at once:

| Problem | Effect |
|---|---|
| TTS is ~4× the STT cost per session | collapses to near zero |
| Aura's 45-stream cap is the system ceiling | removes TTS from the concurrency path |
| approved wording must be exact and reviewable | the audio artifact *is* the reviewed artifact |

The third one is the reason this module is stricter than a cache needs to be.
The cache key includes `prompt_version`, and the manifest additionally records a
hash of the exact text that was rendered. If the text changes without the
version changing, `lookup` treats the entry as a miss and says why — because the
alternative is a patient hearing last month's approved wording while the record
says they heard this month's.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

MANIFEST_NAME = "manifest.json"
_SAFE_ID = re.compile(r"[^a-zA-Z0-9._-]")


@dataclass(frozen=True, slots=True)
class CacheKey:
    """`(question_id, prompt_version, voice, model)` from 05 §7.

    Voice and model are one field here because Aura encodes both in a single
    identifier (`aura-2-harmonia-en`). Sample rate joins them: the same words in
    the same voice at 16 kHz and 24 kHz are different artifacts, and mixing them
    on one socket produces audio that plays at the wrong speed.
    """

    question_id: str
    prompt_version: str
    model: str
    sample_rate: int

    def filename(self) -> str:
        parts = (self.question_id, self.prompt_version, self.model, str(self.sample_rate))
        return _SAFE_ID.sub("_", ".".join(parts)) + ".pcm"


@dataclass(frozen=True, slots=True)
class CachedAudio:
    key: CacheKey
    path: Path
    text: str
    pcm_bytes: int

    @property
    def duration_seconds(self) -> float:
        return self.pcm_bytes / (self.key.sample_rate * 2)


def text_digest(text: str) -> str:
    """Hash of the exact rendered wording. Not PHI — it is approved clinical
    content, identical for every patient."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


class PrerenderedAudioCache:
    """Read-side of the pre-rendered question audio.

    Deliberately read-only. Rendering happens at build time via
    `audio/prerender.py`; a cache that can populate itself at request time is a
    cache that will quietly start making live Aura calls under load, which is
    the exact failure this design exists to prevent.
    """

    def __init__(self, cache_dir: Path) -> None:
        self._dir = cache_dir
        self._manifest: dict[str, dict[str, object]] = {}
        self._hits = 0
        self._misses = 0
        self.reload()

    def reload(self) -> None:
        manifest_path = self._dir / MANIFEST_NAME
        if not manifest_path.is_file():
            logger.warning(
                "no pre-rendered audio manifest at %s — every turn will fall back to "
                "live TTS, which puts the 45-stream Aura cap back on the critical path. "
                "Run `prerender-questions`.",
                manifest_path,
            )
            self._manifest = {}
            return
        self._manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        logger.info("loaded %d pre-rendered question clips", len(self._manifest))

    @property
    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total else 0.0

    def lookup(self, key: CacheKey, text: str) -> CachedAudio | None:
        entry = self._manifest.get(key.filename())
        if entry is None:
            self._misses += 1
            logger.info("audio cache miss for %s", key.question_id)
            return None

        expected = text_digest(text)
        if entry.get("text_digest") != expected:
            # Same question id, same prompt_version, different words. Someone
            # edited approved wording without re-versioning it.
            self._misses += 1
            logger.error(
                "pre-rendered audio for %s does not match the current wording at "
                "prompt_version=%s. The audio artifact is the reviewed artifact — "
                "bump prompt_version and re-render rather than shipping a mismatch.",
                key.question_id,
                key.prompt_version,
            )
            return None

        path = self._dir / key.filename()
        if not path.is_file():
            self._misses += 1
            logger.error("manifest lists %s but the file is missing", path.name)
            return None

        self._hits += 1
        return CachedAudio(
            key=key, path=path, text=text, pcm_bytes=int(entry.get("pcm_bytes", 0)) or path.stat().st_size
        )

    def read(self, cached: CachedAudio) -> bytes:
        return cached.path.read_bytes()
