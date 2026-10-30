"""Pydantic models describing job data and pipeline outcomes."""

import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, field_validator
from rich.console import Console
from rich.table import Table

from rats_neon_backend.config.utils import sanitize_value

_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def compute_job_hash_id(company: str | None, title: str | None, description: str | None, level: str | None) -> str:
    """Return the dedup key shared with the former dbt mart (md5 of company, title, description, level)."""
    return hashlib.md5("||".join(part or "" for part in (company, title, description, level)).encode()).hexdigest()


class JobListing(BaseModel):
    """Represents a single scraped job listing."""

    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site: str | None = None
    job_url: str | None = None
    job_url_direct: str | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    job_type: str | None = None
    date_posted: str | None = None
    interval: str | None = None
    min_amount: float | None = None
    max_amount: float | None = None
    currency: str | None = None
    is_remote: bool | None = None
    job_level: str | None = None
    job_function: str | None = None
    listing_type: str | None = None
    emails: str | None = None
    description: str | None = None
    company_industry: str | None = None
    company_url: str | None = None
    company_url_direct: str | None = None
    company_addresses: str | None = None
    company_num_employees: int | None = None
    company_revenue: str | None = None
    company_description: str | None = None
    logo_photo_url: str | None = None
    banner_photo_url: str | None = None
    ceo_name: str | None = None
    ceo_photo_url: str | None = None

    # Metadata fields
    search_term: str = ""
    ingestion_timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))
    ingestion_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))

    @field_validator("job_id", mode="before")
    @classmethod
    def ensure_uuid_job_id(cls, value: Any) -> str:
        """Ensure job_id is UUID formatted."""
        if value in (None, ""):
            return str(uuid.uuid4())
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, TypeError, AttributeError):
            return str(uuid.uuid4())

    @classmethod
    def from_raw(cls, raw_data: dict[str, Any], search_term: str) -> "JobListing":
        """Create a JobListing from raw scraped data with sanitization."""
        # Sanitize all values
        sanitized = {key: sanitize_value(val) for key, val in raw_data.items()}

        return cls(
            site=sanitized.get("site"),
            job_url=sanitized.get("job_url"),
            job_url_direct=sanitized.get("job_url_direct"),
            title=sanitized.get("title"),
            company=sanitized.get("company"),
            location=sanitized.get("location"),
            job_type=sanitized.get("job_type"),
            date_posted=str(sanitized.get("date_posted")) if sanitized.get("date_posted") else None,
            interval=sanitized.get("interval"),
            min_amount=float(sanitized["min_amount"]) if sanitized.get("min_amount") else None,
            max_amount=float(sanitized["max_amount"]) if sanitized.get("max_amount") else None,
            currency=sanitized.get("currency"),
            is_remote=sanitized.get("is_remote"),
            job_level=sanitized.get("job_level"),
            job_function=sanitized.get("job_function"),
            listing_type=sanitized.get("listing_type"),
            emails=sanitized.get("emails"),
            description=sanitized.get("description"),
            company_industry=sanitized.get("company_industry"),
            company_url=sanitized.get("company_url"),
            company_url_direct=sanitized.get("company_url_direct"),
            company_addresses=sanitized.get("company_addresses"),
            company_num_employees=int(sanitized["company_num_employees"])
            if sanitized.get("company_num_employees")
            else None,
            company_revenue=sanitized.get("company_revenue"),
            company_description=sanitized.get("company_description"),
            logo_photo_url=sanitized.get("logo_photo_url"),
            banner_photo_url=sanitized.get("banner_photo_url"),
            ceo_name=sanitized.get("ceo_name"),
            ceo_photo_url=sanitized.get("ceo_photo_url"),
            search_term=search_term,
        )

    @property
    def job_hash_id(self) -> str:
        return compute_job_hash_id(self.company, self.title, self.description, self.job_level)

    def to_row(self) -> dict[str, Any]:
        """Convert to a linkedin_jobs table row (embedded_at is left to the vector sync)."""
        date_posted = self.date_posted[:10] if self.date_posted and _ISO_DATE.match(self.date_posted) else None
        return {
            "job_hash_id": self.job_hash_id,
            "job_id": self.job_id,
            "site": self.site,
            "search_term": self.search_term,
            "company_name": self.company,
            "company_industry": self.company_industry,
            "company_url": self.company_url,
            "location": self.location,
            "is_remote": self.is_remote,
            "date_posted": date_posted,
            "job_title": self.title,
            "job_type": self.job_type,
            "job_level": self.job_level,
            "job_function": self.job_function,
            "job_description": self.description,
            "job_url": self.job_url,
            "job_url_direct": self.job_url_direct,
            "compensation_interval": self.interval,
            "salary_min_amount": self.min_amount,
            "salary_max_amount": self.max_amount,
            "salary_currency": self.currency,
            "part_date": self.ingestion_date,
            "inserted_at": datetime.fromtimestamp(self.ingestion_timestamp / 1000, tz=timezone.utc).isoformat(),
        }


class SearchTermResult(BaseModel):
    """Outcome of scraping and persisting one search term."""

    search_term: str
    scraped_count: int = 0
    upserted_count: int = 0
    errors: list[str] = Field(default_factory=list)


class PipelineStats(BaseModel):
    """Statistics for a pipeline run."""

    start_time: datetime = Field(default_factory=datetime.now)
    end_time: datetime | None = None
    search_terms: dict[str, SearchTermResult] = Field(default_factory=dict)
    total_jobs_scraped: int = 0
    total_jobs_upserted: int = 0
    total_jobs_embedded: int = 0
    total_jobs_purged: int = 0
    errors: list[str] = Field(default_factory=list)

    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

    @property
    def succeeded(self) -> bool:
        return not self.errors and self.total_jobs_upserted > 0

    def complete(self) -> None:
        self.end_time = datetime.now()

    def print_pretty(self) -> None:
        """Print a human-readable summary of the pipeline stats using rich Table."""
        console = Console()
        table = Table(title="Pipeline Statistics")
        table.add_column("Metric", style="cyan", no_wrap=True)
        table.add_column("Value", style="magenta")
        table.add_row("Start Time", str(self.start_time))
        table.add_row("End Time", str(self.end_time) if self.end_time else "N/A")
        table.add_row("Duration (seconds)", f"{self.duration_seconds:.2f}")
        table.add_row("Total Jobs Scraped", str(self.total_jobs_scraped))
        table.add_row("Total Jobs Upserted", str(self.total_jobs_upserted))
        table.add_row("Total Jobs Embedded", str(self.total_jobs_embedded))
        table.add_row("Total Jobs Purged", str(self.total_jobs_purged))
        table.add_row("Errors", str(len(self.errors)))
        console.print(table)
