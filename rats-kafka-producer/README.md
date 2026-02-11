# RATS Kafka Producer

The RATS Kafka Producer scrapes job listings and publishes them to Kafka with Avro serialization. It is designed to run against Confluent Cloud or local Kafka brokers, and integrates cleanly with the broader Reversed ATS platform.

**Highlights**

- Scrape LinkedIn job listings via JobSpy.
- Publish Avro-encoded records to Kafka with schema registry support.
- Clean CLI for local runs and operational workflows.

## Quickstart

```bash
uv sync
uv run rats-kafka-producer run --search-term "Data Engineer" --location "Ho Chi Minh City, Vietnam"
```

## CLI

List commands and options:

```bash
uv run rats-kafka-producer --help
```

Run the pipeline:

```bash
uv run rats-kafka-producer run \
  --search-term "Data Engineer" \
  --location "Ho Chi Minh City, Vietnam" \
  --results 25
```

Disable Kafka publishing (scrape only):

```bash
uv run rats-kafka-producer run --no-produce
```

Print the effective configuration:

```bash
uv run rats-kafka-producer config
```

## Configuration

Configuration is loaded in this order:

1. CLI overrides
2. Config file (YAML or JSON)
3. Environment variables
4. Defaults

### Environment variables

- `JOB_LOCATION`
- `RESULTS_WANTED`
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
- `LINKEDIN_KAFKA_TOPIC`

### Config file example

```yaml
location: Ho Chi Minh City, Vietnam
results_wanted: 20
search_terms:
  - Data Engineer
  - ML Engineer
kafka:
  bootstrap_servers: pkc-xxxx.us-east-1.aws.confluent.cloud:9092
  schema_registry_url: https://psrc-xxxx.us-east-1.aws.confluent.cloud
  api_key: ${DATACONTRACT_KAFKA_SASL_USERNAME}
  api_secret: ${DATACONTRACT_KAFKA_SASL_PASSWORD}
  schema_registry_api_key: ${CONFLUENT_SCHEMA_REGISTRY_API_KEY}
  schema_registry_api_secret: ${CONFLUENT_SCHEMA_REGISTRY_API_SECRET}
  client_id: ccloud-python-client-862dcf68-e5e6-4941-85b6-06dcb7fbff2a
```

## Development

```bash
uv sync --all-extras
prek run --all-files
```

## Notes

- Kafka publishing requires a schema registry endpoint when Avro is enabled.
- When credentials are missing, the producer will attempt to connect without SASL authentication.
