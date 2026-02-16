UV_PROJECT_ENVIRONMENT := "../.venv"
UV_PROJECT_PATH := env_var("PWD") + "/rats-kafka-producer"
UV := "UV_PROJECT_ENVIRONMENT=" + UV_PROJECT_ENVIRONMENT + " uv --project " + UV_PROJECT_PATH

format:
	@echo "Formatting code with plugins via prek..."
	@git add --all
	@prek run --all-files

produce:
	@cd rats-kafka-producer && uv run python3 src/rats_kafka_producer/cli.py run

contract:
	@echo "Validating data contract..."
	@cd rats-kafka-producer && uv run datacontract lint src/rats_kafka_producer/datacontract/contract/com/rats/jobs/rats.jobs.listing.v1.yaml
	@echo "Data contract validation and compilation completed."
