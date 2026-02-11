from rats_kafka_producer.config.settings import ScraperConfig


def test_config_loading(monkeypatch):
    """Test configuration loading from environment variables."""
    # Mock env vars using monkeypatch
    monkeypatch.setenv("SEARCH_TERMS", '["test_term_1", "test_term_2"]')
    monkeypatch.setenv("SITE_NAMES", "site1,site2")
    monkeypatch.setenv("LINKEDIN_FETCH_DESCRIPTION", "false")
    monkeypatch.setenv("JOB_LOCATION", "New York")
    monkeypatch.setenv("RESULTS_WANTED", "50")
    monkeypatch.setenv("HOURS_OLD", "24")

    config = ScraperConfig.from_env()

    assert config.search_terms == ["test_term_1", "test_term_2"]
    assert config.site_names == ["site1", "site2"]
    assert config.linkedin_fetch_description is False
    assert config.location == "New York"
    assert config.results_wanted == 50
    assert config.hours_old == 24
