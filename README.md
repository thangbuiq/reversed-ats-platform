<div align="center">
<img src="docs/images/logo.png" alt="logo" width="100px"/>
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
- [Architecture Diagram](#architecture-diagram)

## Monorepo Structure

This project is designed to provide insights into the job market by leveraging machine learning and data engineering techniques. It includes components for data crawling, preprocessing, model training, and deployment, all orchestrated through a robust MLOps pipeline.

The monorepo is organized into the following key components:

- [rats-dashboard-app](./rats-dashboard-app): Next.js application for visualizing job market insights
- [rats-dbt-transformer](./rats-dbt-transformer): dbt models for transforming raw data into analysis-ready datasets
- [rats-kafka-consumer](./rats-kafka-consumer): Spark Streaming application for consuming and preprocessing data from Kafka
- [rats-kafka-producer](./rats-kafka-producer): Data crawling scripts to fetch job postings and salary data, producing to Kafka topics
- [rats-kafka-setup](./rats-kafka-setup): Docker Compose setup for Kafka and Schema Registry
- [rats-model-serving](./rats-model-serving): FastAPI application for serving trained ML models
- [rats-model-training](./rats-model-training): Scripts and notebooks for training ML models
- [rats-services-setup](./rats-services-setup): Docker Compose setup for MLOps components like MLflow, Airflow,...

## Architecture Diagram

- Dataflow Diagram:

  ![Dataflow Diagram](./docs/images/dfd.excalidraw.png)
