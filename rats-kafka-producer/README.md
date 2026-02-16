# RATS Kafka Producer

Scrapes job listings (via JobSpy) and publishes Avro messages to Kafka using Confluent Schema Registry.

## What It Does

- Pulls job postings from configured sources (default: LinkedIn)
- Normalizes data with the project data contract
- Publishes records to a Kafka topic

## Quick Start

```bash
uv sync
cp .env.example .env
uv run rats-kafka-producer run
```

Dry run (no Kafka write):

```bash
uv run rats-kafka-producer run --no-produce
```

## CLI

List commands:

```bash
uv run rats-kafka-producer --help
```

Validate runtime config and data contract:

```bash
uv sync --extra datacontract
uv run rats-kafka-producer validate
```

## Configuration

Runtime config can be provided by `.env` or CLI flags on `run`.

Core scraping variables:

- `JOB_LOCATION`
- `RESULTS_WANTED`
- `HOURS_OLD`
- `SITE_NAMES`
- `SEARCH_TERMS` (JSON array string)
- `LINKEDIN_FETCH_DESCRIPTION`
- `LOG_LEVEL`

Kafka / Schema Registry variables:

- `DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS`
- `DATACONTRACT_KAFKA_SASL_USERNAME`
- `DATACONTRACT_KAFKA_SASL_PASSWORD`
- `DATACONTRACT_KAFKA_TOPIC`
- `CONFLUENT_SCHEMA_REGISTRY_URL`
- `CONFLUENT_SCHEMA_REGISTRY_API_KEY`
- `CONFLUENT_SCHEMA_REGISTRY_API_SECRET`
- `CONFLUENT_KAFKA_CLIENT_ID`

Example:

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
CONFLUENT_KAFKA_CLIENT_ID=rats-kafka-producer
DATACONTRACT_KAFKA_TOPIC=rats.jobs.listing.v1
```

## Databricks Bundle

This repository includes a Databricks Asset Bundle to deploy a wheel task job.

Key files:

- `databricks.yml`
- `resources/rats_kafka_producer.job.yml`

Create target overrides:

```bash
mkdir -p .databricks/bundle/prod
```

`.databricks/bundle/prod/variable-overrides.json`:

```json
{
  "job_location": "Ho Chi Minh City, Vietnam",
  "results_wanted": "50",
  "hours_old": "24",
  "site_names": "linkedin",
  "search_terms": "[\"Data Engineer\",\"ML Engineer\"]",
  "datacontract_kafka_topic": "rats.jobs.listing.v1",
  "datacontract_kafka_bootstrap_servers": "pkc-xxxx.us-east-1.aws.confluent.cloud:9092",
  "datacontract_kafka_sasl_username": "{{secrets/rats-prod/kafka-api-key}}",
  "datacontract_kafka_sasl_password": "{{secrets/rats-prod/kafka-api-secret}}",
  "confluent_schema_registry_url": "https://psrc-xxxx.us-east-1.aws.confluent.cloud",
  "confluent_schema_registry_api_key": "{{secrets/rats-prod/schema-api-key}}",
  "confluent_schema_registry_api_secret": "{{secrets/rats-prod/schema-api-secret}}",
  "confluent_kafka_client_id": "rats-kafka-producer-databricks"
}
```

Deploy:

```bash
databricks bundle validate -t prod
databricks bundle deploy -t prod
```

Run now:

```bash
databricks bundle run -t prod rats_kafka_producer_daily
```

Current default schedule in `databricks.yml`:

- `0 0 2,8,14 * * ?` (UTC)

Deploy with paused schedule:

```bash
databricks bundle deploy -t prod --var="schedule_pause_status=PAUSED"
```

## Development

```bash
uv sync --all-extras
prek run --all-files
```
