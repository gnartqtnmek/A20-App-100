"""Uvicorn entrypoint for the agent-api service."""

from __future__ import annotations

import uvicorn

from .api.app import app
from .infra.settings import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
