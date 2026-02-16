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
- [Project Backlog](#project-backlog)
- [Monorepo Structure](#monorepo-structure)
- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Development](#development)

## Project Backlog

📋 **Want to contribute?** Check out our comprehensive project backlog!

- **[BACKLOG_SUMMARY.md](./BACKLOG_SUMMARY.md)** - Quick overview of all 15 issues with sprint planning
- **[BACKLOG.md](./BACKLOG.md)** - Detailed backlog with requirements and acceptance criteria
- **[ISSUE_TEMPLATES.md](./ISSUE_TEMPLATES.md)** - Ready-to-copy templates for creating GitHub issues
- **[Project Board](https://github.com/users/thangbuiq/projects/2)** - Track progress and manage issues

The backlog includes 15 well-documented issues covering:
- 🔴 Core infrastructure (Kafka consumer, dbt models, ML pipeline)
- 🟡 Enhanced features (Dashboard, NER skills extraction, testing)
- 🟢 Security & performance (Auth, rate limiting, monitoring)
- 🔵 Nice-to-have features (Exports, real-time updates)

## Monorepo Structure

This project is designed to provide insights into the job market by leveraging machine learning and data engineering techniques. It includes components for data crawling, preprocessing, model training, and deployment, all orchestrated through a robust MLOps pipeline.

The monorepo is organized into the following key components:

- [rats-dashboard-app](./rats-dashboard-app): Next.js application for visualizing job market insights
- [rats-dbt-transformer](./rats-dbt-transformer): dbt models for transforming raw data into analysis-ready datasets
- [rats-kafka-consumer](./rats-kafka-consumer): Spark Streaming application for consuming and preprocessing data from Kafka
- [rats-kafka-producer](./rats-kafka-producer): Data contract definitions and producer application for sending crawled data to Kafka
- [rats-model-serving](./rats-model-serving): FastAPI application for serving trained ML models
- [rats-model-training](./rats-model-training): Scripts and notebooks for training ML models

## How It Works

![Dataflow Diagram](./assets/docs/images/dfd.excalidraw.png)

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
