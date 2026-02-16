# RATS Platform - Project Backlog

This document contains the comprehensive backlog of issues that need to be completed for the RATS (Reversed ATS) Platform project. All issues should be added to the [project board](https://github.com/users/thangbuiq/projects/2).

## Legend

- 🔴 **Critical** - Core functionality, blocks other features
- 🟡 **High** - Important features, needed soon
- 🟢 **Medium** - Nice to have, enhances platform
- 🔵 **Low** - Future enhancements, not urgent

---

## Issue #1: Implement Kafka Consumer with Spark Streaming 🔴

**Priority:** Critical  
**Component:** `rats-kafka-consumer`  
**Estimated Effort:** Large (5-7 days)

### Description

Build a Spark Streaming application to consume job listings from Kafka topics and perform real-time preprocessing. Currently, the `rats-kafka-consumer` directory only contains a stub implementation.

### Requirements

- Set up Spark Structured Streaming to consume from Kafka
- Deserialize Avro messages using Schema Registry
- Implement data cleaning and normalization logic
- Extract and parse key fields (job title, company, location, salary, skills)
- Handle duplicate job postings
- Write processed data to target storage (Delta Lake/Parquet)
- Add comprehensive error handling and logging
- Include unit and integration tests

### Acceptance Criteria

- [ ] Spark Streaming job successfully consumes from Kafka topic
- [ ] Avro messages are correctly deserialized
- [ ] Data is cleaned and normalized according to schema
- [ ] Duplicate detection works correctly
- [ ] Processed data is written to storage in correct format
- [ ] Comprehensive tests with >80% coverage
- [ ] Documentation includes deployment instructions

### Technical Notes

- Use PySpark with Structured Streaming
- Integrate with Confluent Schema Registry
- Consider using Delta Lake for ACID transactions
- Implement watermarking for late data handling

---

## Issue #2: Build dbt Transformation Models 🔴

**Priority:** Critical  
**Component:** `rats-dbt-transformer`  
**Estimated Effort:** Large (5-7 days)

### Description

Create dbt models to transform raw job data into analysis-ready datasets. This includes staging models, intermediate transformations, and final analytical models for the dashboard.

### Requirements

- Set up dbt project structure with proper configuration
- Create staging models for raw job data
- Build intermediate models for:
  - Skills extraction and normalization
  - Location standardization
  - Salary normalization and currency conversion
  - Company information enrichment
- Create fact and dimension tables for analytical queries
- Implement data quality tests
- Add incremental loading strategies
- Document all models with descriptions and column definitions

### Acceptance Criteria

- [ ] dbt project is properly configured
- [ ] Staging models correctly load raw data
- [ ] Intermediate models transform data accurately
- [ ] Fact and dimension tables are optimized for queries
- [ ] All models have data quality tests
- [ ] Incremental loads work correctly
- [ ] Documentation is generated and complete
- [ ] Models run successfully with `dbt run` and `dbt test`

### Technical Notes

- Use dbt-core or dbt-cloud
- Configure for target warehouse (Databricks, Snowflake, BigQuery)
- Implement slowly changing dimensions (SCD Type 2) where needed
- Use dbt macros for reusable transformations

---

## Issue #3: Develop Next.js Dashboard Application 🟡

**Priority:** High  
**Component:** `rats-dashboard-app`  
**Estimated Effort:** Large (7-10 days)

### Description

Build a modern, responsive web dashboard using Next.js to visualize job market insights, salary trends, and skill demand analytics.

### Requirements

- Set up Next.js 14+ project with TypeScript
- Implement responsive UI with Tailwind CSS or Material-UI
- Create dashboard pages:
  - Home/Overview with key metrics
  - Job Market Trends (visualizations)
  - Salary Analysis by role, location, experience
  - Skills Demand heatmap
  - Company insights
- Integrate with backend API for data fetching
- Implement data visualization with Chart.js or Recharts
- Add search and filter functionality
- Implement server-side rendering for better performance
- Add authentication (optional for MVP)

### Acceptance Criteria

- [ ] Next.js project is properly configured
- [ ] All dashboard pages are implemented and responsive
- [ ] Data visualizations are interactive and informative
- [ ] API integration works correctly
- [ ] Search and filters function properly
- [ ] Performance is optimized (Lighthouse score >90)
- [ ] Documentation includes setup and deployment instructions

### Technical Notes

- Use Next.js App Router (latest approach)
- Implement React Server Components where appropriate
- Use SWR or React Query for data fetching
- Deploy to Vercel or similar platform

---

## Issue #4: Build ML Model Training Pipeline 🔴

**Priority:** Critical  
**Component:** `rats-model-training`  
**Estimated Effort:** Large (7-10 days)

### Description

Develop machine learning models for salary prediction and job-resume matching. Set up training pipelines with MLOps best practices.

### Requirements

- Set up ML project structure with proper organization
- Implement salary prediction model:
  - Feature engineering (skills, location, experience, company size)
  - Model selection and training (XGBoost, LightGBM, or neural networks)
  - Hyperparameter tuning
  - Model evaluation and validation
- Implement job-resume matching model:
  - Text preprocessing and cleaning
  - Generate embeddings using BERT or similar
  - Similarity computation
  - Ranking algorithm
- Create training scripts with MLflow tracking
- Implement model versioning and registry
- Add model evaluation metrics and reports
- Create Jupyter notebooks for experimentation

### Acceptance Criteria

- [ ] Salary prediction model achieves R² > 0.75
- [ ] Job-resume matching model achieves accuracy > 80%
- [ ] Training pipeline is automated and reproducible
- [ ] Models are tracked with MLflow
- [ ] Evaluation reports are generated automatically
- [ ] Model artifacts are versioned and stored properly
- [ ] Documentation includes model cards and usage guides

### Technical Notes

- Use scikit-learn, XGBoost, PyTorch or TensorFlow
- Integrate with MLflow for experiment tracking
- Consider using Hugging Face Transformers for NLP tasks
- Implement cross-validation and proper train/test splits

---

## Issue #5: Implement FastAPI Model Serving Application 🔴

**Priority:** Critical  
**Component:** `rats-model-serving`  
**Estimated Effort:** Medium (3-5 days)

### Description

Create a FastAPI application to serve trained ML models via REST API endpoints. This will provide real-time predictions for salary estimation and job matching.

### Requirements

- Set up FastAPI project with proper structure
- Implement endpoints:
  - `POST /predict/salary` - Salary prediction
  - `POST /match/jobs` - Job-resume matching
  - `GET /health` - Health check
  - `GET /metrics` - Model metrics
- Load models from registry
- Implement request validation with Pydantic
- Add caching for improved performance
- Implement rate limiting
- Add comprehensive error handling
- Include API documentation with OpenAPI/Swagger
- Containerize with Docker

### Acceptance Criteria

- [ ] FastAPI application runs successfully
- [ ] All endpoints work correctly with proper validation
- [ ] Models are loaded and cached efficiently
- [ ] Response times are <200ms for predictions
- [ ] API documentation is auto-generated and clear
- [ ] Docker container builds and runs correctly
- [ ] Unit and integration tests with >80% coverage
- [ ] Deployment instructions are documented

### Technical Notes

- Use FastAPI with uvicorn
- Implement async endpoints where appropriate
- Use Redis for caching if needed
- Consider model warm-up on startup
- Deploy using Docker/Kubernetes

---

## Issue #6: Implement Named Entity Recognition for Skills Extraction 🟡

**Priority:** High  
**Component:** `rats-model-training`, `rats-kafka-consumer`  
**Estimated Effort:** Medium (4-6 days)

### Description

Develop an NER model to automatically extract technical skills, tools, and technologies from job descriptions. This is crucial for accurate skill demand analysis.

### Requirements

- Create or fine-tune NER model for skills extraction
- Define skill taxonomy (programming languages, frameworks, tools, soft skills)
- Train model on labeled dataset
- Implement post-processing for skill normalization
- Handle variations and synonyms (e.g., "React.js" vs "ReactJS")
- Integrate into Kafka consumer pipeline
- Create evaluation metrics specific to skills extraction
- Build skill knowledge graph for relationships

### Acceptance Criteria

- [ ] NER model achieves F1 score > 0.85 for skills
- [ ] Skill taxonomy covers major technical domains
- [ ] Model handles variations and synonyms correctly
- [ ] Integration with pipeline processes jobs in real-time
- [ ] Skill knowledge graph is created and maintained
- [ ] Evaluation report shows performance across categories
- [ ] Documentation includes model details and examples

### Technical Notes

- Use spaCy, Hugging Face Transformers, or BERT for NER
- Consider using pre-trained models and fine-tuning
- Build skill taxonomy from existing sources (LinkedIn, GitHub)
- Implement fuzzy matching for normalization

---

## Issue #7: Set Up Data Quality Monitoring and Alerting 🟡

**Priority:** High  
**Component:** All components  
**Estimated Effort:** Medium (3-5 days)

### Description

Implement comprehensive data quality monitoring across the entire pipeline to detect anomalies, data drift, and quality issues early.

### Requirements

- Set up data quality framework (Great Expectations or similar)
- Define data quality rules and expectations:
  - Schema validation
  - Null checks
  - Value range validation
  - Freshness checks
  - Volume anomaly detection
- Implement automated quality checks in pipeline
- Create alerting mechanism (email, Slack, PagerDuty)
- Build data quality dashboard
- Generate automated data quality reports
- Add data lineage tracking

### Acceptance Criteria

- [ ] Data quality framework is configured and running
- [ ] Quality checks cover all critical data points
- [ ] Alerts are triggered correctly for quality issues
- [ ] Dashboard shows real-time quality metrics
- [ ] Reports are generated automatically
- [ ] Documentation includes quality standards and SLAs

### Technical Notes

- Use Great Expectations, deequ, or custom solution
- Integrate with existing monitoring (Prometheus/Grafana)
- Set up alerting via email or Slack webhooks
- Consider using dbt tests for transformation quality

---

## Issue #8: Add Comprehensive Testing Suite 🟡

**Priority:** High  
**Component:** All components  
**Estimated Effort:** Large (5-7 days)

### Description

Establish a comprehensive testing strategy across all components including unit tests, integration tests, and end-to-end tests.

### Requirements

- Set up testing frameworks for each component:
  - Python: pytest with coverage
  - JavaScript/TypeScript: Jest and React Testing Library
- Implement unit tests for all modules (target: >80% coverage)
- Create integration tests for:
  - Kafka producer → consumer flow
  - API endpoints
  - Database queries
  - Model predictions
- Add end-to-end tests for critical user journeys
- Set up test data fixtures and factories
- Implement contract testing for APIs
- Configure CI/CD to run tests automatically
- Add test coverage reporting

### Acceptance Criteria

- [ ] Unit test coverage >80% for all components
- [ ] Integration tests cover critical paths
- [ ] E2E tests validate key user workflows
- [ ] Tests run automatically in CI/CD
- [ ] Coverage reports are generated
- [ ] All tests pass consistently
- [ ] Documentation includes testing guide

### Technical Notes

- Use pytest, pytest-mock, pytest-cov for Python
- Use Jest, Testing Library for JavaScript
- Consider using testcontainers for integration tests
- Implement mocking for external dependencies
- Use factory patterns for test data

---

## Issue #9: Implement CI/CD Pipeline for All Components 🟡

**Priority:** High  
**Component:** `.github/workflows`, all components  
**Estimated Effort:** Medium (4-6 days)

### Description

Extend existing CI/CD workflows to cover all components with automated testing, building, and deployment.

### Requirements

- Create GitHub Actions workflows for each component
- Implement automated checks:
  - Linting and code formatting
  - Unit and integration tests
  - Security scanning
  - Docker image building
  - Deployment to staging/production
- Add branch protection rules
- Implement semantic versioning and releases
- Set up automated dependency updates (Dependabot)
- Create deployment pipelines for:
  - Databricks jobs (consumer, producer)
  - Model serving API
  - Dashboard application
- Implement blue-green or canary deployments
- Add rollback mechanisms

### Acceptance Criteria

- [ ] CI/CD workflows exist for all components
- [ ] All checks run automatically on PRs
- [ ] Deployments are automated and reliable
- [ ] Branch protection prevents broken code
- [ ] Version tags are created automatically
- [ ] Rollback process is documented and tested
- [ ] Deployment status is visible in dashboard

### Technical Notes

- Use GitHub Actions for CI/CD
- Implement multi-stage Docker builds
- Use environment secrets securely
- Consider using ArgoCD for GitOps
- Implement approval gates for production

---

## Issue #10: Add Authentication and Authorization 🟢

**Priority:** Medium  
**Component:** `rats-dashboard-app`, `rats-model-serving`  
**Estimated Effort:** Medium (3-5 days)

### Description

Implement user authentication and role-based authorization to secure the dashboard and API endpoints.

### Requirements

- Choose authentication provider (Auth0, Clerk, or custom)
- Implement user login/logout flows
- Add OAuth2/OIDC integration
- Implement role-based access control (RBAC):
  - Admin: full access
  - Analyst: read-only dashboard access
  - API User: API access only
- Secure API endpoints with JWT tokens
- Add user management interface
- Implement session management
- Add audit logging for security events

### Acceptance Criteria

- [ ] Users can register and login successfully
- [ ] OAuth2 integration works with major providers
- [ ] RBAC restricts access appropriately
- [ ] API endpoints require valid JWT tokens
- [ ] Session management is secure
- [ ] Admin can manage users
- [ ] Security audit logs are captured
- [ ] Documentation includes security best practices

### Technical Notes

- Use NextAuth.js for Next.js authentication
- Implement JWT validation in FastAPI
- Store tokens securely (httpOnly cookies)
- Follow OWASP security guidelines
- Implement rate limiting on auth endpoints

---

## Issue #11: Implement Real-time Data Streaming Dashboard 🟢

**Priority:** Medium  
**Component:** `rats-dashboard-app`  
**Estimated Effort:** Medium (3-5 days)

### Description

Add real-time data streaming capabilities to the dashboard to show live job postings and market trends as they are ingested.

### Requirements

- Implement WebSocket connection to backend
- Create real-time components for:
  - Live job feed (new postings)
  - Real-time metrics (jobs/hour, trending skills)
  - Live salary distribution updates
- Add notifications for significant events
- Implement efficient data streaming protocol
- Add auto-refresh for static data
- Optimize for performance (virtualization for lists)
- Handle connection failures gracefully

### Acceptance Criteria

- [ ] WebSocket connection establishes successfully
- [ ] Real-time data updates appear instantly
- [ ] Performance remains smooth with streaming data
- [ ] Connection failures are handled gracefully
- [ ] Notifications work correctly
- [ ] UI remains responsive during updates
- [ ] Documentation includes architecture diagram

### Technical Notes

- Use WebSockets or Server-Sent Events
- Consider using Socket.io for reliability
- Implement connection pooling
- Use React virtualization for large lists
- Add reconnection logic with exponential backoff

---

## Issue #12: Add Data Export and Reporting Features 🔵

**Priority:** Low  
**Component:** `rats-dashboard-app`, `rats-model-serving`  
**Estimated Effort:** Small (2-3 days)

### Description

Implement functionality to export data and generate custom reports from the dashboard.

### Requirements

- Add export functionality for:
  - Job listings (CSV, JSON, Excel)
  - Charts and visualizations (PNG, SVG, PDF)
  - Custom reports
- Implement report scheduling (daily, weekly, monthly)
- Create report templates for common analyses
- Add email delivery for scheduled reports
- Implement data filtering before export
- Add pagination for large exports

### Acceptance Criteria

- [ ] Users can export data in multiple formats
- [ ] Charts can be exported as images
- [ ] Scheduled reports are generated correctly
- [ ] Reports are delivered via email
- [ ] Export functionality handles large datasets
- [ ] Documentation includes export guide

### Technical Notes

- Use libraries like Papa Parse for CSV, ExcelJS for Excel
- Use Puppeteer or similar for PDF generation
- Implement background jobs for large exports
- Add rate limiting for exports
- Use pre-signed URLs for secure downloads

---

## Issue #13: Implement Comprehensive Logging and Monitoring 🟡

**Priority:** High  
**Component:** All components  
**Estimated Effort:** Medium (4-5 days)

### Description

Set up centralized logging and monitoring infrastructure to track application health, performance, and errors across all services.

### Requirements

- Implement structured logging across all services
- Set up log aggregation (ELK stack or cloud solution)
- Create monitoring dashboards:
  - System metrics (CPU, memory, disk)
  - Application metrics (requests/sec, latency)
  - Business metrics (jobs processed, predictions made)
  - Error rates and types
- Implement distributed tracing
- Set up alerting for critical issues
- Add performance profiling
- Create runbooks for common issues

### Acceptance Criteria

- [ ] All services use structured logging
- [ ] Logs are aggregated in central location
- [ ] Monitoring dashboards show key metrics
- [ ] Distributed tracing works across services
- [ ] Alerts trigger correctly for issues
- [ ] Performance bottlenecks are identified
- [ ] Runbooks are documented and accessible

### Technical Notes

- Use Python logging with JSON formatter
- Consider ELK stack, Grafana Loki, or cloud solutions
- Use OpenTelemetry for distributed tracing
- Implement Prometheus metrics
- Use Grafana for visualization
- Set up PagerDuty or similar for alerts

---

## Issue #14: Add API Rate Limiting and Caching 🟢

**Priority:** Medium  
**Component:** `rats-model-serving`  
**Estimated Effort:** Small (2-3 days)

### Description

Implement rate limiting and caching strategies to protect API endpoints and improve performance.

### Requirements

- Implement rate limiting per API key/user
- Add different rate limit tiers (free, premium)
- Implement caching for:
  - Model predictions (with TTL)
  - Static data
  - Aggregated metrics
- Use Redis or similar for distributed caching
- Add cache invalidation strategies
- Implement graceful degradation under load
- Add rate limit headers in responses

### Acceptance Criteria

- [ ] Rate limiting works correctly per user
- [ ] Different tiers have appropriate limits
- [ ] Caching improves response times
- [ ] Cache hit rate is monitored
- [ ] Rate limit info is shown in responses
- [ ] System degrades gracefully under load
- [ ] Documentation includes rate limit info

### Technical Notes

- Use FastAPI middleware for rate limiting
- Implement Redis for caching and rate limit tracking
- Use token bucket algorithm
- Add cache warming strategies
- Monitor cache hit ratios
- Implement circuit breakers

---

## Issue #15: Create Comprehensive Documentation 🟡

**Priority:** High  
**Component:** Documentation  
**Estimated Effort:** Medium (3-5 days)

### Description

Create comprehensive documentation for the entire platform including architecture, API references, deployment guides, and user manuals.

### Requirements

- Create documentation site (using Docusaurus, MkDocs, or similar)
- Document architecture:
  - System architecture diagrams
  - Data flow diagrams
  - Component interaction diagrams
- API documentation:
  - OpenAPI/Swagger specs
  - Example requests/responses
  - Authentication guide
- Deployment guides for each component
- User guides for dashboard
- Developer onboarding guide
- Contributing guidelines
- Troubleshooting guides

### Acceptance Criteria

- [ ] Documentation site is deployed and accessible
- [ ] Architecture is clearly documented with diagrams
- [ ] All APIs have complete reference docs
- [ ] Deployment guides cover all scenarios
- [ ] User guides include screenshots and examples
- [ ] Developer guide helps new contributors
- [ ] Troubleshooting section covers common issues

### Technical Notes

- Use Docusaurus or MkDocs for docs site
- Auto-generate API docs from OpenAPI specs
- Use Mermaid for diagrams
- Deploy docs to GitHub Pages or Read the Docs
- Version documentation with code
- Include code examples and tutorials

---

## Summary

**Total Issues:** 15

**By Priority:**
- 🔴 Critical: 5 issues
- 🟡 High: 6 issues
- 🟢 Medium: 3 issues
- 🔵 Low: 1 issue

**By Component:**
- `rats-kafka-consumer`: 2 issues
- `rats-dbt-transformer`: 1 issue
- `rats-dashboard-app`: 4 issues
- `rats-model-training`: 2 issues
- `rats-model-serving`: 3 issues
- All components: 3 issues

**Estimated Total Effort:** 65-90 days (for a single developer)

**Recommended Implementation Order:**
1. Issue #1: Kafka Consumer (Critical path blocker)
2. Issue #2: dbt Transformations (Critical path blocker)
3. Issue #4: ML Model Training (Core feature)
4. Issue #5: Model Serving API (Core feature)
5. Issue #6: Skills Extraction (Enhances core features)
6. Issue #3: Dashboard Application (User-facing)
7. Issue #8: Comprehensive Testing (Quality assurance)
8. Issue #9: CI/CD Pipeline (Automation)
9. Issue #13: Logging and Monitoring (Operations)
10. Issue #7: Data Quality Monitoring (Data integrity)
11. Issue #15: Documentation (Knowledge sharing)
12. Issue #10: Authentication (Security)
13. Issue #11: Real-time Dashboard (Enhancement)
14. Issue #14: Rate Limiting and Caching (Performance)
15. Issue #12: Export and Reporting (Nice to have)

---

## Notes for Project Board

When adding these issues to the [GitHub Project Board](https://github.com/users/thangbuiq/projects/2):

1. Add all issues to the **Backlog** column initially
2. Use GitHub labels to categorize:
   - Priority: `critical`, `high`, `medium`, `low`
   - Component: `kafka-consumer`, `dbt-transformer`, `dashboard`, `model-training`, `model-serving`
   - Type: `feature`, `enhancement`, `infrastructure`, `documentation`
3. Add size estimates: `S`, `M`, `L`, `XL`
4. Assign to milestones for sprint planning
5. Link related issues together
6. Add acceptance criteria as task lists in issue descriptions

## Getting Started

To begin implementation:
1. Review and prioritize issues based on your current goals
2. Start with critical path items (Issues #1, #2, #4, #5)
3. Set up project board with appropriate columns
4. Assign issues to team members or sprints
5. Create feature branches for each issue
6. Follow the development workflow outlined in AGENTS.md
