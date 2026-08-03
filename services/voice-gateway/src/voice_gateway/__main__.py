"""Entry point: `uv run voice-gateway`."""

from __future__ import annotations

import logging

import uvicorn

from voice_gateway.config import get_settings


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)-7s %(name)s: %(message)s",
    )
    settings = get_settings()
    uvicorn.run(
        "voice_gateway.app:app",
        host=settings.host,
        port=settings.port,
        log_level="warning",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
