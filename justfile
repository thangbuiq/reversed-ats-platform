UV_PROJECT_ENVIRONMENT := "../.venv"
UV_PROJECT_PATH := env_var("PWD") + "/jitp-kafka-producer"
UV := "UV_PROJECT_ENVIRONMENT=" + UV_PROJECT_ENVIRONMENT + " uv --project " + UV_PROJECT_PATH

install:
	@echo "Installing development environment..."
	@{{ UV }} sync --all-extras --all-groups --all-packages
	@echo "Installing prek pre-commit hooks..."
	@source .venv/bin/activate
	@{{ UV }} run prek install --install-hooks
	@echo "Development environment setup complete."

format:
	@echo "Formatting code with plugins via prek..."
	@git add --all
	@prek run --all-files

produce:
	@{{ UV }} run python -m producer scrape

kafka-up:
	@cd jitp-kafka-setup && docker-compose up -d

kafka-down:
	@cd jitp-kafka-setup && docker-compose down --remove-orphans
