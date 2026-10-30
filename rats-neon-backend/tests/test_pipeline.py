"""Pipeline behaviour with a fake scraper and sink (no network)."""

from rats_neon_backend.config.models import JobListing
from rats_neon_backend.config.settings import ScraperConfig
from rats_neon_backend.pipeline import RATSBackendApp


class FakeScraper:
    def __init__(self, fail_terms: set[str] | None = None) -> None:
        self.fail_terms = fail_terms or set()
        self.hours_old_seen: list[int | None] = []

    def scrape_jobs_for_term(self, term: str, hours_old=None) -> list[JobListing]:
        self.hours_old_seen.append(hours_old)
        if term in self.fail_terms:
            raise RuntimeError("429")
        return [JobListing(company="Acme", title=term, description="d", job_level="mid", search_term=term)]


class FakeSink:
    def __init__(self, empty: bool = False, fail_upsert: bool = False) -> None:
        self.empty = empty
        self.fail_upsert = fail_upsert
        self.upserted: list[JobListing] = []
        self.finished = None

    def start_run(self):
        return "run-1"

    def finish_run(self, run_id, stats) -> None:
        self.finished = (run_id, stats.succeeded)

    def is_empty(self) -> bool:
        return self.empty

    def upsert_jobs(self, jobs) -> int:
        if self.fail_upsert:
            raise RuntimeError("db down")
        self.upserted.extend(jobs)
        return len(jobs)

    def purge_expired(self) -> list[str]:
        return []


def _app(scraper: FakeScraper, sink: FakeSink) -> RATSBackendApp:
    config = ScraperConfig(search_terms=["a", "b"], hours_old=24)
    app = RATSBackendApp(config)
    app.scraper = scraper
    app.sink = sink
    return app


def test_successful_run_upserts_every_term() -> None:
    sink = FakeSink()
    stats = _app(FakeScraper(), sink).run()
    assert stats.succeeded
    assert stats.total_jobs_upserted == 2
    assert sink.finished == ("run-1", True)


def test_empty_table_bootstraps_without_hours_old() -> None:
    scraper = FakeScraper()
    _app(scraper, FakeSink(empty=True)).run()
    assert scraper.hours_old_seen == [None, None]


def test_one_failed_term_does_not_stop_others_but_fails_the_run() -> None:
    sink = FakeSink()
    stats = _app(FakeScraper(fail_terms={"a"}), sink).run()
    assert stats.total_jobs_upserted == 1
    assert not stats.succeeded
    assert sink.finished == ("run-1", False)


def test_sink_failure_is_recorded_not_raised() -> None:
    stats = _app(FakeScraper(), FakeSink(fail_upsert=True)).run()
    assert not stats.succeeded
    assert len(stats.errors) == 2


def test_no_write_never_touches_sink() -> None:
    sink = FakeSink()
    stats = _app(FakeScraper(), sink).run(write_to_database=False)
    assert stats.total_jobs_scraped == 2
    assert sink.upserted == []


def test_zero_scraped_jobs_is_reported_with_a_reason() -> None:
    stats = _app(FakeScraper(fail_terms={"a", "b"}), FakeSink()).run()
    assert not stats.succeeded
    assert any("no jobs scraped" in error for error in stats.errors)
