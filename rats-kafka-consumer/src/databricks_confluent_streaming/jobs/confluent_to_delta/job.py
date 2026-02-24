"""Confluent Kafka to Delta job entrypoint."""

from databricks_confluent_streaming.jobs.confluent_to_delta.helpers import (
    build_kafka_jaas_config,
    load_confluent_settings,
    resolve_checkpoint_location,
    topic_to_table_name,
)
from pyspark.sql import SparkSession
from pyspark.sql.avro.functions import from_avro
from pyspark.sql.functions import col


def pipeline():
    spark = SparkSession.getActiveSession()
    settings = load_confluent_settings(spark)
    table_name = topic_to_table_name(settings.datacontract_kafka_topic)
    schema_registry_user_info = (
        f"{settings.confluent_schema_registry_api_key}:{settings.confluent_schema_registry_api_secret}"
    )

    kafka_options = {
        "kafka.bootstrap.servers": settings.datacontract_kafka_bootstrap_servers,
        "subscribe": settings.datacontract_kafka_topic,
        "kafka.security.protocol": "SASL_SSL",
        "startingOffsets": "earliest",
        "includeHeaders": "true",
        "kafka.sasl.mechanism": settings.datacontract_kafka_sasl_mechanism,
        "kafka.sasl.jaas.config": build_kafka_jaas_config(
            settings.datacontract_kafka_sasl_mechanism,
            settings.datacontract_kafka_sasl_username,
            settings.datacontract_kafka_sasl_password,
        ),
    }

    schema_registry_conf = {
        "confluent.schema.registry.basic.auth.credentials.source": "USER_INFO",
        "confluent.schema.registry.basic.auth.user.info": schema_registry_user_info,
        "avroSchemaEvolutionMode": "restart",
        "mode": "FAILFAST",
    }

    spark.readStream.format("kafka").options(**kafka_options).load().createOrReplaceTempView("kafka_source")
    source_df = spark.sql("""
        SELECT
            CAST(`key` AS STRING) AS `kafka_event_id`,
            CAST(`timestamp` AS STRING) AS `kafka_timestamp`,
            DATE_FORMAT(`timestamp`, 'yyyy-MM-dd') AS `part_date`,
            `headers` AS `kafka_headers`,
            `value` AS `kafka_raw_payload`,
            `topic` AS `kafka_topic`,
            `offset` AS `kafka_offset`,
            `partition` AS `kafka_partition`
        FROM kafka_source
    """)

    serialized_df = source_df.withColumn(
        "kafka_payload",
        from_avro(
            col("kafka_raw_payload").cast("binary"),
            subject=f"{settings.datacontract_kafka_topic}-value",
            schemaRegistryAddress=settings.confluent_schema_registry_url,
            options=schema_registry_conf,
        ),
    )

    serialized_df = serialized_df.select(
        "kafka_event_id",
        "kafka_timestamp",
        "part_date",
        "kafka_headers",
        "kafka_payload",
        "kafka_topic",
        "kafka_offset",
        "kafka_partition",
    )

    checkpoint_location = resolve_checkpoint_location(spark, table_name)
    write_stream = (
        serialized_df.writeStream.trigger(availableNow=True)
        .format("delta")
        .outputMode("append")
        .partitionBy("part_date")
        .option("checkpointLocation", checkpoint_location)
        .table(f"bronze_layer.{table_name}")
    )
    write_stream.awaitTermination()
