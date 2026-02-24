# RATS Kafka Consumer

Consumes Avro messages from Confluent Kafka and writes them to Delta tables on Databricks.

## What It Does

- Reads records from a Kafka topic using Spark Structured Streaming
- Deserializes Avro payloads via Confluent Schema Registry
- Writes records to `bronze_layer.<topic_name_normalized>` in Delta

## Quick Start

```bash
uv sync
cp .env.example .env
```

Run locally with Databricks Connect:

```bash
uv run python -m databricks_confluent_streaming.pipeline --job_name confluent_to_delta
```

## Configuration

Set values in `.env` (or pass them as Databricks job parameters):

- `DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS`
- `DATACONTRACT_KAFKA_SASL_USERNAME`
- `DATACONTRACT_KAFKA_SASL_PASSWORD`
- `DATACONTRACT_KAFKA_SASL_MECHANISM` (default: `PLAIN`)
- `DATACONTRACT_KAFKA_TOPIC` (default: `rats.jobs.listing.v1`)
- `CONFLUENT_SCHEMA_REGISTRY_URL`
- `CONFLUENT_SCHEMA_REGISTRY_API_KEY`
- `CONFLUENT_SCHEMA_REGISTRY_API_SECRET`
- `CHECKPOINT_BASE_PATH` (must be a Unity Catalog Volume path like `/Volumes/<catalog>/<schema>/<volume>/...`)

For local Databricks Connect runs, also set:

- `DATABRICKS_HOST`
- `DATABRICKS_TOKEN`

## Databricks Asset Bundle

This repository includes a Databricks Asset Bundle for deploying the consumer as a wheel task job.

Key files:

- `databricks.yml`
- `resources/rats_kafka_consumer.job.yml`

Create target overrides:

```bash
mkdir -p .databricks/bundle/prod
```

`.databricks/bundle/prod/variable-overrides.json`:

```json
{
  "datacontract_kafka_bootstrap_servers": "pkc-xxxx.us-east-1.aws.confluent.cloud:9092",
  "datacontract_kafka_sasl_username": "{{secrets/rats-prod/kafka-api-key}}",
  "datacontract_kafka_sasl_password": "{{secrets/rats-prod/kafka-api-secret}}",
  "datacontract_kafka_sasl_mechanism": "PLAIN",
  "datacontract_kafka_topic": "rats.jobs.listing.v1",
  "confluent_schema_registry_url": "https://psrc-xxxx.us-east-1.aws.confluent.cloud",
  "confluent_schema_registry_api_key": "{{secrets/rats-prod/schema-api-key}}",
  "confluent_schema_registry_api_secret": "{{secrets/rats-prod/schema-api-secret}}",
  "checkpoint_base_path": "/Volumes/workspace/bronze_layer/spark_streaming_checkpoints"
}
```

Validate and deploy:

```bash
databricks bundle validate -t prod
databricks bundle deploy -t prod
```

Run the job immediately:

```bash
databricks bundle run -t prod rats_kafka_consumer_confluent_to_delta
```

Current default schedule in `databricks.yml`:

- `0 */30 * * * ?` (every 30 minutes, UTC)

Deploy with paused schedule:

```bash
databricks bundle deploy -t prod --var="schedule_pause_status=PAUSED"
```

## Real-Time Sync Note

Using scheduled Databricks bundle runs is not the correct concept for true real-time synchronization because each run starts and stops a batch-like execution window.

For real-time sync, run the consumer as a long-lived streaming process on a VM (or other always-on compute) so it continuously reads Kafka and writes Delta without schedule gaps.

## Development

```bash
uv sync --extra dev
```
