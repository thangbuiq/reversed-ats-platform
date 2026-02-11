import os

from rats_kafka_producer.config.settings import ScraperConfig


def test_config_loading():
    # Mock env vars
    os.environ["SEARCH_TERMS"] = '["test_term_1", "test_term_2"]'
    os.environ["SITE_NAMES"] = "site1,site2"
    os.environ["LINKEDIN_FETCH_DESCRIPTION"] = "false"
    os.environ["JOB_LOCATION"] = "New York"
    os.environ["RESULTS_WANTED"] = "50"

    config = ScraperConfig.from_env()

    print(f"SEARCH_TERMS: {config.search_terms}")
    print(f"SITE_NAMES: {config.site_names}")
    print(f"LINKEDIN_FETCH_DESCRIPTION: {config.linkedin_fetch_description}")
    print(f"LOCATION: {config.location}")
    print(f"RESULTS_WANTED: {config.results_wanted}")

    assert config.search_terms == ["test_term_1", "test_term_2"]
    assert config.site_names == ["site1", "site2"]
    assert config.linkedin_fetch_description is False
    assert config.location == "New York"
    assert config.results_wanted == 50
    print("Test passed!")
