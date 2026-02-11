# RATS Kafka Producer

The RATS Kafka Producer scrapes job listings and publishes them to Kafka with Avro serialization. It is designed to run against Confluent Cloud or local Kafka brokers, and integrates cleanly with the broader Reversed ATS platform.

**Highlights**

- Scrape LinkedIn job listings via JobSpy.
- Publish Avro-encoded records to Kafka with schema registry support.
- Clean CLI for local runs and operational workflows.

## Quickstart

```bash
uv sync
uv run rats-kafka-producer run
```

## CLI

List commands and options:

```bash
uv run rats-kafka-producer --help
```

Run the pipeline:

```bash
uv run rats-kafka-producer run
```

Disable Kafka publishing (scrape only):

```bash
uv run rats-kafka-producer run --no-produce
```

Validate scraper + data contract config:

```bash
uv run rats-kafka-producer validate
```

## Configuration

Search terms are configured via environment variables. CLI overrides for search terms are intentionally disabled.

### Environment variables

- `JOB_LOCATION`
- `RESULTS_WANTED`
- `HOURS_OLD`
- `SITE_NAMES`
- `SEARCH_TERMS`
- `LINKEDIN_FETCH_DESCRIPTION`
- `LOG_LEVEL`
- `DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS`
- `CONFLUENT_SCHEMA_REGISTRY_URL`
- `DATACONTRACT_KAFKA_SASL_USERNAME`
- `DATACONTRACT_KAFKA_SASL_PASSWORD`
- `CONFLUENT_SCHEMA_REGISTRY_API_KEY`
- `CONFLUENT_SCHEMA_REGISTRY_API_SECRET`
- `CONFLUENT_KAFKA_CLIENT_ID`
- `DATACONTRACT_KAFKA_TOPIC`

### Environment example

```bash
JOB_LOCATION="Ho Chi Minh City, Vietnam"
RESULTS_WANTED=20
HOURS_OLD=24
SITE_NAMES=linkedin
SEARCH_TERMS='["Data Engineer","ML Engineer"]'
DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS=pkc-xxxx.us-east-1.aws.confluent.cloud:9092
CONFLUENT_SCHEMA_REGISTRY_URL=https://psrc-xxxx.us-east-1.aws.confluent.cloud
DATACONTRACT_KAFKA_SASL_USERNAME=...
DATACONTRACT_KAFKA_SASL_PASSWORD=...
CONFLUENT_SCHEMA_REGISTRY_API_KEY=...
CONFLUENT_SCHEMA_REGISTRY_API_SECRET=...
CONFLUENT_KAFKA_CLIENT_ID=ccloud-python-client-xxx
DATACONTRACT_KAFKA_TOPIC=rats.jobs.listing.v1
```

## Development

```bash
uv sync --all-extras
prek run --all-files
```

## Notes

- Kafka publishing requires a schema registry endpoint when Avro is enabled.
- When credentials are missing, the producer will attempt to connect without SASL authentication.
- `hours_old` defaults to `24` for daily runs. On first Kafka topic initialization, the pipeline skips this filter.
