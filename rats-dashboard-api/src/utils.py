"""Shared utility functions for the RATS Dashboard API."""

from __future__ import annotations

import io
import re

from fastapi import HTTPException, UploadFile

# ---- CV text extraction helpers ----


def decode_text_content(content: bytes) -> str:
    """Try common encodings for plain-text CV content."""
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="ignore")


def extract_pdf_text(content: bytes) -> str:
    """Extract text from a PDF byte stream."""
    try:
        from pypdf import PdfReader
    except ImportError as error:
        raise HTTPException(
            status_code=500,
            detail="PDF parsing requires pypdf. Install it before uploading PDF CV files.",
        ) from error

    try:
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. Try exporting it again or upload a .txt version.",
        ) from error


async def extract_cv_text(cv_file: UploadFile) -> str:
    """Read and extract text from an uploaded CV file (PDF or plain text)."""
    content = await cv_file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded CV file is empty.")

    filename = (cv_file.filename or "").lower()
    content_type = (cv_file.content_type or "").lower()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        text = extract_pdf_text(content)
    else:
        text = decode_text_content(content)

    clean_text = re.sub(r"\s+", " ", text).strip()
    if len(clean_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not find enough text in this CV. Scanned or image-only PDFs are not supported.",
        )
    return clean_text
