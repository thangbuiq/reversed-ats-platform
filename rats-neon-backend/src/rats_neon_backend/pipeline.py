"""Pipeline orchestration for scraping jobs and writing them to Neon."""

from rats_neon_backend.config.models import JobListing, PipelineStats, SearchTermResult
from rats_neon_backend.config.settings import ScraperConfig
from rats_neon_backend.config.utils import logger
from rats_neon_backend.sinks.postgres import PostgresJobSink
from rats_neon_backend.sources.linkedin import JobSpyScraper

PENDING_EMBED_PAGE_SIZE = 1000


class RATSBackendApp:
    """Main pipeline orchestrating job scraping, Neon upserts and optional vector sync."""

    def __init__(self, config: ScraperConfig | None = None):
        self.config = config or ScraperConfig.from_env()
        self.scraper = JobSpyScraper(self.config)
        self.sink: PostgresJobSink | None = None
        logger.success("RATSBackendApp initialized")

    def run(
        self,
        search_terms: list[str] | None = None,
        write_to_database: bool = True,
        sync_vectors: bool = True,
        recreate_collection: bool = False,
    ) -> PipelineStats:
        """Run the pipeline: scrape, upsert, purge expired rows, then embed new rows into Qdrant."""
        logger.info("Starting Job Scraper Pipeline")
        stats = PipelineStats()
        effective_hours_old = self.config.hours_old
        run_id = None

        if write_to_database:
            self.sink = self.sink or PostgresJobSink(self.config)
            run_id = self.sink.start_run()
            if self.sink.is_empty():
                effective_hours_old = None
                logger.info("Jobs table is empty. Skipping hours_old filter for first bootstrap scrape.")

        terms_to_process = search_terms or self.config.search_terms
        logger.info(f"Processing {len(terms_to_process)} search terms")

        for search_term in terms_to_process:
            result = SearchTermResult(search_term=search_term)
            jobs: list[JobListing] = []

            try:
                jobs = self.scraper.scrape_jobs_for_term(search_term, hours_old=effective_hours_old)
                result.scraped_count = len(jobs)
            except Exception as e:
                logger.error(f"Failed to scrape jobs for '{search_term}': {str(e)}")
                result.errors.append(f"scrape '{search_term}': {e}")

            if jobs and write_to_database:
                try:
                    result.upserted_count = self.sink.upsert_jobs(jobs)
                except Exception as e:
                    logger.error(f"Failed to upsert jobs for '{search_term}': {str(e)}")
                    result.errors.append(f"upsert '{search_term}': {e}")

            stats.search_terms[search_term] = result
            stats.total_jobs_scraped += result.scraped_count
            stats.total_jobs_upserted += result.upserted_count
            stats.errors.extend(result.errors)

        if stats.total_jobs_scraped == 0:
            stats.errors.append("no jobs scraped (LinkedIn unreachable or blocking this IP?)")

        if write_to_database:
            self._purge_and_sync(stats, sync_vectors, recreate_collection)
            self.sink.finish_run(run_id, stats)

        stats.complete()
        stats.print_pretty()
        return stats

    def _purge_and_sync(self, stats: PipelineStats, sync_vectors: bool, recreate_collection: bool) -> None:
        """
        Drop expired rows, then embed pending rows.

        Failures are recorded, never raised.
        """
        vectors = None
        if sync_vectors and self.config.qdrant.enabled:
            try:
                from rats_neon_backend.sinks.qdrant import QdrantVectorSink

                vectors = QdrantVectorSink(self.config.qdrant)
                vectors.ensure_collection(recreate=recreate_collection)
                if recreate_collection:
                    self.sink.reset_embedded()
            except Exception as e:
                logger.error(f"Qdrant unavailable, skipping vector sync: {e}")
                stats.errors.append(f"qdrant init: {e}")
        elif sync_vectors:
            logger.info("Qdrant not configured. Skipping vector sync.")

        try:
            purged = self.sink.purge_expired()
            stats.total_jobs_purged = len(purged)
            if purged and vectors:
                vectors.delete(purged)
        except Exception as e:
            logger.error(f"Purge failed: {e}")
            stats.errors.append(f"purge: {e}")

        if vectors is None:
            return
        try:
            while pending := self.sink.fetch_pending_embedding(PENDING_EMBED_PAGE_SIZE):
                embedded = vectors.upsert_rows(pending)
                self.sink.mark_embedded(embedded)
                stats.total_jobs_embedded += len(embedded)
        except Exception as e:
            logger.error(f"Vector sync failed (rows stay pending and retry next run): {e}")
            stats.errors.append(f"vector sync: {e}")
