"""Logging utilities using Loguru."""

import sys
from pathlib import Path

from loguru import logger


def setup_logging(
    level: str = "INFO",
    log_file: str | None = None,
    rotation: str = "100 MB",
    retention: str = "30 days",
) -> None:
    """Configure Loguru logging for the application."""
    # Remove default handler
    logger.remove()

    # Add stdout handler
    logger.add(
        sys.stdout,
        level=level.upper(),
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan> | "
        "<level>{message}</level>",
    )

    # Add file handler if specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.add(
            log_file,
            level=level.upper(),
            rotation=rotation,
            retention=retention,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} | {message}",
        )
