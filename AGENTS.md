# AGENTS instructions

## Monorepo Structure

Reversed ATS platform is a platform for analyzing job market trends, predicting salaries, and matching candidate to jobs market using real-time data from LinkedIn. It includes components for data crawling, preprocessing, model training, and deployment, all orchestrated through a robust MLOps pipeline. The codebase is organized into the following key components:

- [rats-dashboard-app](./rats-dashboard-app): Next.js application for visualizing job market insights
- [rats-dbt-transformer](./rats-dbt-transformer): dbt models for transforming raw data into analysis-ready datasets
- [rats-kafka-consumer](./rats-kafka-consumer): Spark Streaming application for consuming and preprocessing data from Kafka
- [rats-kafka-producer](./rats-kafka-producer): Data contract definitions and producer application for sending crawled data to Kafka
- [rats-model-serving](./rats-model-serving): FastAPI application for serving trained ML models
- [rats-model-training](./rats-model-training): Scripts and notebooks for training ML models

## Code Style Guidelines

- Use type hints for function signatures and naming conventions of variables, functions, classes, and modules should follow PEP 8 guidelines.
- Don't write too much in-line comments. Instead, write code that is self-explanatory and declarative enough to not need comments.
- Write short docstrings for classes and functions. Use [Google style](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings).

## Prek hooks

- Install with `uv tool install prek` and run checks via `prek run --all-files`.
- Enable the hooks with `prek install --install-hooks` so they run automatically on each commit.
