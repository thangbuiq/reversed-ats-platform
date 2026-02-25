import os

from src.main import app

if os.getenv("VERCEL") == "1":
    from fastapi.responses import RedirectResponse

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return RedirectResponse("/vercel.svg", status_code=307)

    @app.get("/", include_in_schema=False)
    @app.get("/docs", include_in_schema=False)
    async def docs():
        return RedirectResponse("/swagger", status_code=307)
