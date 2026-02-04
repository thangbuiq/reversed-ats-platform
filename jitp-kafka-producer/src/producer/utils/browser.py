"""Browser automation utilities using Playwright."""

import asyncio
import random
from typing import Optional

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from producer.config.settings import BrowserConfig
from producer.core.exceptions import BrowserError
from producer.utils.logging import get_logger


class BrowserManager:
    """Manages browser lifecycle and provides utility methods."""

    def __init__(self, config: BrowserConfig):
        self.config = config
        self.logger = get_logger(self.__class__.__name__)
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None

    async def start(self) -> None:
        """Start the browser."""
        try:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=self.config.headless,
                slow_mo=self.config.slow_mo,
            )
            self._context = await self._browser.new_context(
                viewport={
                    "width": self.config.viewport_width,
                    "height": self.config.viewport_height,
                },
                user_agent=self.config.user_agent,
            )
            self.logger.info("Browser started successfully")
        except Exception as e:
            raise BrowserError(f"Failed to start browser: {e}")

    async def stop(self) -> None:
        """Stop the browser and cleanup."""
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self.logger.info("Browser stopped")

    async def new_page(self) -> Page:
        """Create a new page."""
        if not self._context:
            raise BrowserError("Browser not started. Call start() first.")
        page = await self._context.new_page()
        page.set_default_timeout(self.config.timeout)
        return page

    async def random_delay(self, min_sec: float = 1.0, max_sec: float = 3.0) -> None:
        """Add a random delay to mimic human behavior."""
        delay = random.uniform(min_sec, max_sec)
        await asyncio.sleep(delay)

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()
