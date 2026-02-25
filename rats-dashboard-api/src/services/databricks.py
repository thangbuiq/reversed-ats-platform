"""Small Databricks SQL Statements API client."""

from __future__ import annotations

import json
import os
import time
from http.client import IncompleteRead
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from ..config import (
    POLL_INTERVAL_SECONDS,
    POLL_MAX_ATTEMPTS,
    extract_warehouse_id,
    require_env,
)


class DatabricksStatementClient:
    """Small Databricks SQL Statements API client."""

    def __init__(self) -> None:
        self._host = require_env("DATABRICKS_HOST").rstrip("/")
        self._token = require_env("DATABRICKS_TOKEN")
        warehouse_id = os.getenv("DATABRICKS_WAREHOUSE_ID", "").strip()
        if warehouse_id:
            self._warehouse_id = warehouse_id
        else:
            http_path = require_env("DATABRICKS_HTTP_PATH")
            self._warehouse_id = extract_warehouse_id(http_path)

    def _build_url(self, path: str) -> str:
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if path.startswith("/"):
            return f"{self._host}{path}"
        return f"{self._host}/{path}"

    def _request_json(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(self._build_url(path), data=data, method=method)
        request.add_header("Authorization", f"Bearer {self._token}")
        request.add_header("Accept", "application/json")
        request.add_header("Accept-Encoding", "identity")
        request.add_header("Connection", "close")
        if data is not None:
            request.add_header("Content-Type", "application/json")

        try:
            with urlopen(request, timeout=60) as response:
                try:
                    raw_body = response.read()
                except IncompleteRead as error:
                    raw_body = error.partial
                body = raw_body.decode("utf-8")
        except HTTPError as error:
            try:
                raw_error_body = error.read()
            except IncompleteRead as incomplete:
                raw_error_body = incomplete.partial
            body = raw_error_body.decode("utf-8", errors="ignore")
            raise RuntimeError(f"Databricks request failed ({error.code}): {body}") from error
        except URLError as error:
            raise RuntimeError(f"Cannot reach Databricks: {error.reason}") from error

        if not body:
            return {}
        try:
            return json.loads(body)
        except json.JSONDecodeError as error:
            raise RuntimeError(
                "Databricks returned a partial/invalid JSON response. "
                "Try /materialize-linkedin-jobs with a smaller limit first."
            ) from error

    @staticmethod
    def _result_block(response: dict[str, Any]) -> dict[str, Any]:
        if isinstance(response.get("result"), dict):
            return response["result"]
        return response

    @staticmethod
    def _extract_columns(response: dict[str, Any]) -> list[str]:
        # The Databricks SQL Statement API returns `manifest` at the
        # top level of the response, NOT inside `response["result"]`.
        # Check the top-level response first, then fall back to the
        # result block for compatibility with older response shapes.
        for source in (response, DatabricksStatementClient._result_block(response)):
            manifest = source.get("manifest", {})
            schema = manifest.get("schema", {})
            columns = schema.get("columns", [])
            if not columns and isinstance(source.get("schema"), dict):
                columns = source["schema"].get("columns", [])
            names = [column.get("name") for column in columns if isinstance(column, dict)]
            clean_names = [name for name in names if isinstance(name, str) and name]
            if clean_names:
                return clean_names
        raise RuntimeError("Databricks response does not include result schema columns.")

    @staticmethod
    def _rows_from_block(block: dict[str, Any]) -> list[list[Any]]:
        rows = block.get("data_array", [])
        if not isinstance(rows, list):
            return []
        return rows

    @staticmethod
    def _next_chunk_link(block: dict[str, Any]) -> str | None:
        link = block.get("next_chunk_internal_link")
        return link if isinstance(link, str) and link else None

    def _wait_until_finished(self, initial: dict[str, Any]) -> dict[str, Any]:
        response = initial
        state = str(response.get("status", {}).get("state", "")).upper()
        for _ in range(POLL_MAX_ATTEMPTS):
            if state in {"SUCCEEDED", "FAILED", "CANCELED", "CLOSED"}:
                break
            statement_id = response.get("statement_id")
            if not isinstance(statement_id, str) or not statement_id:
                raise RuntimeError("Databricks response is missing statement_id.")
            time.sleep(POLL_INTERVAL_SECONDS)
            response = self._request_json(
                "GET",
                f"/api/2.0/sql/statements/{statement_id}",
            )
            state = str(response.get("status", {}).get("state", "")).upper()

        if state != "SUCCEEDED":
            status = response.get("status", {})
            error = status.get("error", {})
            message = error.get("message") if isinstance(error, dict) else None
            raise RuntimeError(message or f"Databricks statement did not succeed. State: {state}")

        return response

    def fetch_rows(self, statement: str) -> list[dict[str, Any]]:
        """Execute SQL against Databricks and return rows as dictionaries."""
        payload = {
            "statement": statement,
            "warehouse_id": self._warehouse_id,
            "wait_timeout": "50s",
            "on_wait_timeout": "CONTINUE",
        }
        response = self._request_json("POST", "/api/2.0/sql/statements", payload)
        response = self._wait_until_finished(response)

        columns = self._extract_columns(response)
        result_block = self._result_block(response)
        rows: list[list[Any]] = self._rows_from_block(result_block)

        next_chunk_link = self._next_chunk_link(result_block)
        while next_chunk_link:
            chunk_response = self._request_json("GET", next_chunk_link)
            chunk_block = self._result_block(chunk_response)
            rows.extend(self._rows_from_block(chunk_block))
            next_chunk_link = self._next_chunk_link(chunk_block)

        return [dict(zip(columns, row, strict=False)) for row in rows]
