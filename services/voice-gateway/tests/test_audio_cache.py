"""The pre-rendered audio cache, and the mismatch it is built to catch.

05 §7 makes pre-rendering a capacity decision — Aura's 45 concurrent streams
against STT's 150 means TTS is the binding constraint, and serving approved
questions from disk takes it off the critical path entirely. But the reason this
module is stricter than a cache needs to be is clinical: the audio artifact *is*
the reviewed artifact. Wording that drifts from what was rendered must not play.
"""

from __future__ import annotations

import json
from pathlib import Path

from voice_gateway.audio.cache import MANIFEST_NAME, CacheKey, PrerenderedAudioCache
from voice_gateway.audio.prerender import render_all
from voice_gateway.config import Settings
from voice_gateway.graph.mock_graph import all_prerenderable_nodes


def _key(node, settings: Settings) -> CacheKey:
    return CacheKey(
        question_id=node.id,
        prompt_version=node.prompt_version,
        model=settings.tts_model,
        sample_rate=settings.tts_sample_rate,
    )


async def test_every_fixed_utterance_is_pre_rendered(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    """Greeting, closing and reconnect notice included. They are approved
    wording too, and a live Aura call for the reconnect notice would consume a
    stream at exactly the moment the system is already degraded."""
    for node in all_prerenderable_nodes():
        assert cache.lookup(_key(node, settings), node.text) is not None, node.id


async def test_the_cache_reports_a_full_hit_rate_for_the_mock_graph(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    for node in all_prerenderable_nodes():
        cache.lookup(_key(node, settings), node.text)
    assert cache.hit_rate == 1.0


async def test_wording_edited_without_a_version_bump_is_a_miss(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    """The failure mode: a patient hears last month's approved wording while
    the record says they heard this month's. Same id, same prompt_version,
    different words — the digest catches it and the lookup misses."""
    node = all_prerenderable_nodes()[1]
    edited = node.text.replace("knee", "shoulder")
    assert edited != node.text

    assert cache.lookup(_key(node, settings), edited) is None


async def test_a_version_bump_is_a_miss_rather_than_stale_audio(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    node = all_prerenderable_nodes()[1]
    bumped = _key(node, settings).__class__(
        question_id=node.id,
        prompt_version="knee-v1",
        model=settings.tts_model,
        sample_rate=settings.tts_sample_rate,
    )
    assert cache.lookup(bumped, node.text) is None


async def test_sample_rate_is_part_of_the_key(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    """The same words in the same voice at 16 kHz and 24 kHz are different
    artifacts. Mixing them plays audio at the wrong speed."""
    node = all_prerenderable_nodes()[0]
    wrong_rate = CacheKey(
        question_id=node.id,
        prompt_version=node.prompt_version,
        model=settings.tts_model,
        sample_rate=16000,
    )
    assert cache.lookup(wrong_rate, node.text) is None


async def test_a_manifest_entry_whose_file_vanished_is_a_miss(
    settings: Settings, cache: PrerenderedAudioCache
) -> None:
    node = all_prerenderable_nodes()[0]
    key = _key(node, settings)
    (settings.audio_cache_dir / key.filename()).unlink()

    assert cache.lookup(key, node.text) is None


async def test_no_manifest_means_misses_not_a_crash(tmp_path: Path) -> None:
    """A gateway with no pre-rendered audio should degrade to live TTS with a
    loud warning, not refuse to start. The capacity problem is real but it is
    not worth a failed deploy at 2am."""
    cache = PrerenderedAudioCache(tmp_path / "nothing-here")
    assert cache.lookup(CacheKey("q", "v", "m", 24000), "text") is None


async def test_the_offline_render_is_marked_as_a_placeholder(settings: Settings) -> None:
    """`--offline` writes two-tone chirps so the loop is runnable without
    credentials. Nothing should be able to mistake one for an approved
    recording, so the manifest says which it is."""
    await render_all(offline=True, settings=settings)
    manifest = json.loads(
        (settings.audio_cache_dir / MANIFEST_NAME).read_text(encoding="utf-8")
    )
    assert manifest
    assert all(entry["offline_placeholder"] for entry in manifest.values())


async def test_rendering_is_idempotent(settings: Settings) -> None:
    await render_all(offline=True, settings=settings)
    first = json.loads((settings.audio_cache_dir / MANIFEST_NAME).read_text())
    await render_all(offline=True, settings=settings)
    second = json.loads((settings.audio_cache_dir / MANIFEST_NAME).read_text())
    assert first == second


def test_the_cache_has_no_way_to_populate_itself() -> None:
    """A cache that can render on a miss will quietly start making live Aura
    calls under load — which is the exact failure pre-rendering exists to
    prevent. The read side has no write method, by construction."""
    public = {name for name in dir(PrerenderedAudioCache) if not name.startswith("_")}
    assert public == {"lookup", "read", "reload", "hit_rate"}


def test_a_question_id_cannot_escape_the_cache_directory(tmp_path: Path) -> None:
    """Question ids come from the graph, which slice 3 turns into YAML in git.
    That is a file whose contents decide a path, so the traversal has to be
    impossible rather than merely unlikely."""
    key = CacheKey("knee/../../etc/passwd", "v1", "aura-2-harmonia-en", 24000)
    resolved = (tmp_path / key.filename()).resolve()

    assert resolved.parent == tmp_path.resolve()
