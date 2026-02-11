"""Data contract test script."""

import os
import subprocess
from typing import List

from datacontract.data_contract import DataContract
from dotenv import load_dotenv
from loguru import logger
from pyspark.sql import SparkSession
from rich.console import Console
from rich.table import Table

SPARK_VERSION = "4.1.1"
SCALA_VERSION = "2.13"
CONFLUENT_VERSION = "7.6.0"

JAR_DIR = os.path.expanduser("~/spark-jars")
os.makedirs(JAR_DIR, exist_ok=True)


def run_data_contract_test(spark: SparkSession) -> None:
    """Run the data contract test."""
    logger.info("Starting data contract test...")
    data_contract = DataContract(
        spark=spark,
        server="production",
        data_contract_file="datacontract/contract/com/rats/jobs/rats.job-listings.v1.yaml",
    )

    run = data_contract.test()
    console = Console()
    table = Table(title="Data Contract Test Results")
    table.add_column("Check", style="cyan")
    table.add_column("Result", style="magenta")
    table.add_column("Status", style="green")

    for check in run.checks:
        table.add_row(check.name, check.result.value, "✅" if check.result.value == "passed" else "❌")

    console.print(table)
    if not run.has_passed():
        logger.error("Data quality validation failed.")
    else:
        logger.success("Data quality validation passed.")

    logger.info("Data contract test completed.")


def init_spark_session(jar_files: List[str]) -> SparkSession:
    """Initialize and return a Spark session."""
    if "JAVA_HOME" not in os.environ:
        if os.uname().sysname == "Darwin":  # macos, run brew --prefix openjdk@17
            os.environ["JAVA_HOME"] = (
                subprocess.check_output(["brew", "--prefix", "openjdk@17"]).decode("utf-8").strip()
            )
        else:  # linux
            os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"

    logger.info("Initializing Spark session...")
    load_dotenv()
    spark = (
        SparkSession.builder.appName("KafkaAvroReader")
        .config("spark.jars", ",".join([os.path.join(JAR_DIR, jar) for jar in jar_files]))
        # Kafka security
        .config("spark.kafka.security.protocol", "SASL_SSL")
        .config("spark.kafka.sasl.mechanism", os.getenv("DATACONTRACT_KAFKA_SASL_MECHANISM"))
        .config(
            "spark.kafka.sasl.jaas.config",
            f"""org.apache.kafka.common.security.plain.PlainLoginModule required
            username="{os.getenv("DATACONTRACT_KAFKA_SASL_USERNAME")}"
            password="{os.getenv("DATACONTRACT_KAFKA_SASL_PASSWORD")}";""",
        )
        # Schema Registry
        .config("spark.schema.registry.url", os.getenv("CONFLUENT_SCHEMA_REGISTRY_URL"))
        .config("spark.schema.registry.basic.auth.credentials.source", "USER_INFO")
        .config(
            "spark.schema.registry.basic.auth.user.info",
            f"{os.getenv('CONFLUENT_SCHEMA_REGISTRY_API_KEY')}:{os.getenv('CONFLUENT_SCHEMA_REGISTRY_API_SECRET')}",
        )
        .getOrCreate()
    )
    logger.info("Spark session initialized.")
    return spark


def setup_jars() -> List[str]:
    """Setup required jars for Spark."""
    # ====== CONFIGURE YOUR SPARK VERSION HERE ======
    urls = [
        # Spark Kafka
        f"https://repo1.maven.org/maven2/org/apache/spark/spark-sql-kafka-0-10_{SCALA_VERSION}/{SPARK_VERSION}/spark-sql-kafka-0-10_{SCALA_VERSION}-{SPARK_VERSION}.jar",
        "https://repo1.maven.org/maven2/org/apache/kafka/kafka-clients/3.6.1/kafka-clients-3.6.1.jar"
        # Spark Avro
        f"https://repo1.maven.org/maven2/org/apache/spark/spark-avro_{SCALA_VERSION}/{SPARK_VERSION}/spark-avro_{SCALA_VERSION}-{SPARK_VERSION}.jar",
        "https://repo1.maven.org/maven2/org/apache/avro/avro/1.11.3/avro-1.11.3.jar",
        f"https://packages.confluent.io/maven/io/confluent/kafka-avro-serializer/{CONFLUENT_VERSION}/kafka-avro-serializer-{CONFLUENT_VERSION}.jar",
        f"https://packages.confluent.io/maven/io/confluent/kafka-schema-registry-client/{CONFLUENT_VERSION}/kafka-schema-registry-client-{CONFLUENT_VERSION}.jar",
        # utils
        "https://repo1.maven.org/maven2/org/apache/commons/commons-compress/1.21/commons-compress-1.21.jar",
        "https://repo1.maven.org/maven2/com/google/code/findbugs/jsr305/3.0.2/jsr305-3.0.2.jar",
    ]

    for url in urls:
        subprocess.run(["wget", "-nc", "-P", JAR_DIR, url], check=True)

    # list downloaded jars and return as a list
    jar_files = os.listdir(JAR_DIR)
    logger.info(f"Downloaded JAR files: {jar_files}")
    return jar_files


if __name__ == "__main__":
    jar_files = setup_jars()
    spark = init_spark_session(jar_files)
    run_data_contract_test(spark)
