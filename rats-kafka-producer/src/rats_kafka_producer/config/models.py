"""Pydantic models describing job data and pipeline outcomes."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator
from rich.console import Console
from rich.table import Table

from rats_kafka_producer.config.utils import sanitize_value


class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    TEMPORARY = "temporary"
    UNKNOWN = "unknown"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    DIRECTOR = "director"
    EXECUTIVE = "executive"
    UNKNOWN = "unknown"


class SearchCriteria(BaseModel):
    """Search criteria for job scraping."""

    keywords: list[str] = Field(default_factory=list)
    location: str | None = None
    max_results: int = Field(default=100, ge=1, le=1000)
    job_type: JobType | None = None
    experience_level: ExperienceLevel | None = None
    posted_within_days: int | None = Field(default=None, ge=1, le=30)

    model_config = ConfigDict(use_enum_values=True)


class JobPosting(BaseModel):
    """Represents a single job posting."""

    id: str
    platform: str
    title: str
    company: str
    location: str | None = None
    description: str | None = None
    url: HttpUrl | None = None

    job_type: JobType = JobType.UNKNOWN
    experience_level: ExperienceLevel = ExperienceLevel.UNKNOWN

    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None

    skills: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)

    posted_date: datetime | None = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

    raw_data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("id", mode="before")
    @classmethod
    def ensure_uuid_id(cls, value: Any) -> str:
        """Ensure IDs are UUID formatted."""
        if value in (None, ""):
            return str(uuid.uuid4())
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, TypeError, AttributeError):
            return str(uuid.uuid4())

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return self.model_dump(mode="json")


class JobListing(BaseModel):
    """Represents a single job listing with Avro-compatible fields."""

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

    def to_avro_dict(self) -> dict[str, Any]:
        """Convert to dictionary for Avro serialization."""
        return {
            "job_id": self.job_id,
            "site": self.site,
            "search_term": self.search_term,
            "job": {
                "job_url": self.job_url,
                "job_url_direct": self.job_url_direct,
                "title": self.title,
                "company": self.company,
                "location": self.location,
                "job_type": self.job_type,
                "date_posted": self.date_posted,
                "is_remote": self.is_remote,
                "job_level": self.job_level,
                "job_function": self.job_function,
                "listing_type": self.listing_type,
                "emails": self.emails,
                "description": self.description,
            },
            "compensation": {
                "interval": self.interval,
                "min_amount": self.min_amount,
                "max_amount": self.max_amount,
                "currency": self.currency,
            },
            "company_details": {
                "company_industry": self.company_industry,
                "company_url": self.company_url,
                "company_url_direct": self.company_url_direct,
                "company_addresses": self.company_addresses,
                "company_num_employees": self.company_num_employees,
                "company_revenue": self.company_revenue,
                "company_description": self.company_description,
                "logo_photo_url": self.logo_photo_url,
                "banner_photo_url": self.banner_photo_url,
                "ceo_name": self.ceo_name,
                "ceo_photo_url": self.ceo_photo_url,
            },
        }

    def to_kafka_headers(self) -> list[tuple[str, str]]:
        """
        Build Kafka headers.

        All custom headers use the kafka_ prefix.
        """
        return [
            ("kafka_job_id", self.job_id),
            ("kafka_ingestion_timestamp", str(self.ingestion_timestamp)),
            ("kafka_ingestion_date", self.ingestion_date),
        ]


class ScrapeResult(BaseModel):
    """Result of a scraping operation."""

    scraper_name: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    jobs: list[JobPosting] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @property
    def job_count(self) -> int:
        return len(self.jobs)

    @property
    def has_errors(self) -> bool:
        return len(self.errors) > 0

    @property
    def is_successful(self) -> bool:
        return self.job_count > 0 and not self.has_errors

    def add_job(self, job: JobPosting) -> None:
        self.jobs.append(job)

    def add_error(self, error: str) -> None:
        self.errors.append(error)

    def complete(self) -> None:
        self.completed_at = datetime.utcnow()

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump(mode="json")


class ScrapeProducerResult(BaseModel):
    """Result of a scraping operation."""

    search_term: str
    jobs: list[JobListing] = Field(default_factory=list)
    scraped_count: int = 0
    produced_count: int = 0
    failed_count: int = 0
    errors: list[str] = Field(default_factory=list)

    @property
    def is_successful(self) -> bool:
        return self.scraped_count > 0 and len(self.errors) == 0


class PipelineStats(BaseModel):
    """Statistics for a pipeline run."""

    start_time: datetime = Field(default_factory=datetime.now)
    end_time: datetime | None = None
    search_terms: dict[str, ScrapeResult] = Field(default_factory=dict)
    total_jobs_scraped: int = 0
    total_jobs_produced: int = 0
    total_jobs_failed: int = 0

    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

    def complete(self) -> None:
        self.end_time = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump(mode="json")

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
        table.add_row("Total Jobs Produced", str(self.total_jobs_produced))
        table.add_row("Total Jobs Failed", str(self.total_jobs_failed))
        console.print(table)
