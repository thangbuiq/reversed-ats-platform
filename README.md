<div align="center">
<img src="assets/docs/images/logo.png" alt="logo" width="100px"/>
<h3>RATS - Reversed ATS Platform </h3>

Reversed ATS platform, a platform for analyzing job market trends, predicting salaries, and matching candidate to jobs market using real-time data from LinkedIn and Glassdoor.

</div>

<div align="center">
<a href="https://github.com/thangbuiq/reversed-ats-platform/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"/></a>
<a href="https://github.com/thangbuiq/reversed-ats-platform/releases"><img src="https://img.shields.io/github/v/release/thangbuiq/reversed-ats-platform" alt="latest release version"/></a>
</div>

<p align="center">
  <img src="https://repobeats.axiom.co/api/embed/ee98e46bc2a349af73f7be4965defbc12093b7b0.svg" alt="stats"/>
</p>

## Platform Features

- Real-time Job Data Crawling: Automated daily scraping from LinkedIn.
- Salary Prediction: ML models to predict salaries based on skills, location, and experience using data from Glassdoor.
- Job-Resume Matching: Smart matching system using NLP and embeddings.
- Tech Stack Extraction: NER-based automatic skill extraction from job descriptions.

## Table of Contents

- [Platform Features](#platform-features)
- [Table of Contents](#table-of-contents)
- [Monorepo Structure](#monorepo-structure)
- [Architecture Overview](#architecture-overview)
- [Process Showcase](#process-showcase)
- [Output Schema](#output-schema)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Development](#development)

## Monorepo Structure

This project is designed to provide insights into the job market by leveraging machine learning and data engineering techniques. It includes components for data crawling, preprocessing, model training, and deployment, all orchestrated through a robust MLOps pipeline.

The monorepo is organized into the following key components:

- [rats-dashboard-app](./rats-dashboard-app): Next.js application for visualizing job market insights
- [rats-dbt-transformer](./rats-dbt-transformer): dbt models for transforming raw data into analysis-ready datasets
- [rats-kafka-consumer](./rats-kafka-consumer): Spark Streaming application for consuming and preprocessing data from Kafka
- [rats-kafka-producer](./rats-kafka-producer): Data contract definitions and producer application for sending crawled data to Kafka
- [rats-model-serving](./rats-model-serving): FastAPI application for serving trained ML models and providing prediction APIs for web application
- [rats-model-training](./rats-model-training): Scripts and notebooks for training ML models

## Architecture Overview

![Dataflow Diagram](./assets/docs/images/dfd.excalidraw.png)

## Process Showcase

- Producer pipeline output (crawl and send to Confluent Cloud Kafka):

![Producer Output](./assets/docs/images/showcase/producer.png)

- Consumer Delta output (consume from Kafka, preprocess, and write to Delta Lake):

![Consumer Delta Output](./assets/docs/images/showcase/consumed_table.png)

## Output Schema

```text
root
 |-- kafka_event_id: string (nullable = true)
 |-- kafka_timestamp: string (nullable = true)
 |-- part_date: string (nullable = true)
 |-- kafka_headers: array (nullable = true)
 |    |-- element: struct (containsNull = true)
 |    |    |-- key: string (nullable = true)
 |    |    |-- value: binary (nullable = true)
 |-- kafka_payload: struct (nullable = true)
 |    |-- job_id: string (nullable = true)
 |    |-- site: string (nullable = true)
 |    |-- search_term: string (nullable = true)
 |    |-- job: struct (nullable = true)
 |    |    |-- job_url: string (nullable = true)
 |    |    |-- job_url_direct: string (nullable = true)
 |    |    |-- title: string (nullable = true)
 |    |    |-- company: string (nullable = true)
 |    |    |-- location: string (nullable = true)
 |    |    |-- job_type: string (nullable = true)
 |    |    |-- date_posted: string (nullable = true)
 |    |    |-- is_remote: boolean (nullable = true)
 |    |    |-- job_level: string (nullable = true)
 |    |    |-- job_function: string (nullable = true)
 |    |    |-- listing_type: string (nullable = true)
 |    |    |-- emails: string (nullable = true)
 |    |    |-- description: string (nullable = true)
 |    |-- compensation: struct (nullable = true)
 |    |    |-- interval: string (nullable = true)
 |    |    |-- min_amount: double (nullable = true)
 |    |    |-- max_amount: double (nullable = true)
 |    |    |-- currency: string (nullable = true)
 |    |-- company_details: struct (nullable = true)
 |    |    |-- company_industry: string (nullable = true)
 |    |    |-- company_url: string (nullable = true)
 |    |    |-- company_url_direct: string (nullable = true)
 |    |    |-- company_addresses: string (nullable = true)
 |    |    |-- company_num_employees: integer (nullable = true)
 |    |    |-- company_revenue: string (nullable = true)
 |    |    |-- company_description: string (nullable = true)
 |    |    |-- logo_photo_url: string (nullable = true)
 |    |    |-- banner_photo_url: string (nullable = true)
 |    |    |-- ceo_name: string (nullable = true)
 |    |    |-- ceo_photo_url: string (nullable = true)
 |-- kafka_topic: string (nullable = true)
 |-- kafka_offset: long (nullable = true)
 |-- kafka_partition: integer (nullable = true)
```

## Quick Start

To quickly get started with the RATS platform, follow these steps after you met the [Prerequisites](#prerequisites):

1. Clone the repository:

```bash
git clone https://github.com/thangbuiq/reversed-ats-platform
cd reversed-ats-platform
```

2. Explore and run individual components:

   Each component of the platform (e.g., `rats-dashboard-app`, `rats-kafka-consumer`, `rats-model-serving`, etc.) has its own `README.md` with detailed instructions for running and deploying that service.

   After cloning the repository, navigate to the component you're interested in and follow its README. For example:

   ```bash
   cd rats-dashboard-app
   # follow the instructions in rats-dashboard-app/README.md
   ```

## Prerequisites

Before running the RATS platform, ensure you have the following prerequisites installed:

- `docker`: [Install Docker](https://docs.docker.com/get-docker/)
- `uv`: [Install uv](https://docs.astral.sh/uv/)
- `just` (optional): [Install Just](https://github.com/casey/just)

## Development

In each subdirectory, you will find a `README.md` file with specific instructions for development, testing, and deployment of that component. Please refer to those files for detailed guidance on working with each part of the RATS platform.

But for most components, you can use `uv` to manage your development environment. For example, to set up the environment for the Dagster app:

```bash
cd <component-directory>
uv sync --all-groups --all-extras
```

And develop the component as needed.
