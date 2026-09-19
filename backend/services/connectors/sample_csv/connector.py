"""
Sample CSV connector for development and demo purposes.
Reads a CSV file in MoSPI PAIMANA-style column format.
"""
import csv
import io
import hashlib
import logging
from pathlib import Path
from typing import Iterator

from services.connectors.base import BaseProjectSource
from services.normalization.normalizers import (
    normalize_currency_to_paise,
    normalize_date,
    normalize_state_name,
    normalize_progress,
)

logger = logging.getLogger(__name__)

# Column mapping from sample CSV headers → platform schema fields
COLUMN_MAP = {
    "Project Name": "name",
    "Project ID": "external_project_id",
    "Ministry": "ministry_name",
    "Department": "department_name",
    "Organization": "organization_name",
    "Sector": "sector_name",
    "State": "state_name",
    "District": "district_name",
    "Original Cost (Cr)": "original_cost_raw",
    "Revised Cost (Cr)": "revised_cost_raw",
    "Expenditure (Cr)": "expenditure_raw",
    "Physical Progress (%)": "progress_raw",
    "Original Start Date": "original_start_date_raw",
    "Revised Start Date": "current_start_date_raw",
    "Original Completion Date": "original_completion_date_raw",
    "Revised Completion Date": "current_completion_date_raw",
    "Status": "source_status",
    "Contractor": "contractor_name",
    "Latitude": "latitude",
    "Longitude": "longitude",
}


class SampleCSVConnector(BaseProjectSource):
    """
    Reads a local CSV file for development/demo ingestion.
    In production this would be replaced or supplemented by
    an automated connector hitting the actual MoSPI data portal.
    """
    source_name = "Sample CSV (Demo)"

    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def fetch(self) -> str:
        """Read the CSV file from disk."""
        logger.info(f"Fetching CSV from {self.file_path}")
        try:
            return self.file_path.read_text(encoding="utf-8-sig")
        except UnicodeDecodeError:
            try:
                return self.file_path.read_text(encoding="latin-1")
            except Exception:
                return self.file_path.read_text(encoding="utf-8", errors="replace")

    def parse(self, raw_data: str) -> Iterator[dict]:
        """Parse CSV into raw row dicts using source column names."""
        reader = csv.DictReader(io.StringIO(raw_data))
        for row in reader:
            yield dict(row)

    def normalize(self, record: dict) -> dict:
        """Map source columns to platform schema and normalize values."""
        normalized = {}

        # Remap known columns
        for src_col, platform_field in COLUMN_MAP.items():
            if src_col in record:
                normalized[platform_field] = record[src_col]

        # Currency
        normalized["original_cost"] = normalize_currency_to_paise(normalized.pop("original_cost_raw", None))
        normalized["current_cost"] = normalize_currency_to_paise(normalized.pop("revised_cost_raw", None))
        normalized["current_expenditure"] = normalize_currency_to_paise(normalized.pop("expenditure_raw", None))

        # Progress
        normalized["current_progress"] = normalize_progress(normalized.pop("progress_raw", None))

        # Dates
        normalized["original_start_date"] = normalize_date(normalized.pop("original_start_date_raw", None))
        normalized["current_start_date"] = normalize_date(normalized.pop("current_start_date_raw", None))
        normalized["original_completion_date"] = normalize_date(normalized.pop("original_completion_date_raw", None))
        normalized["current_completion_date"] = normalize_date(normalized.pop("current_completion_date_raw", None))

        # State name normalization
        if "state_name" in normalized:
            normalized["state_name"] = normalize_state_name(normalized["state_name"])

        # Lat/Lon
        try:
            if normalized.get("latitude"):
                normalized["latitude"] = float(normalized["latitude"])
        except (ValueError, TypeError):
            normalized["latitude"] = None
        try:
            if normalized.get("longitude"):
                normalized["longitude"] = float(normalized["longitude"])
        except (ValueError, TypeError):
            normalized["longitude"] = None

        # Raw record hash for deduplication
        raw_str = str(sorted(record.items()))
        normalized["raw_record_hash"] = hashlib.sha256(raw_str.encode()).hexdigest()

        return normalized

    def validate(self, record: dict) -> tuple[bool, list[str]]:
        """Validate normalized record. Returns (is_valid, errors)."""
        errors = []

        if not record.get("name"):
            errors.append("Missing project name")

        cost = record.get("current_cost") or record.get("original_cost")
        if cost is not None and cost < 0:
            errors.append(f"Negative cost value: {cost}")

        expenditure = record.get("current_expenditure")
        if expenditure is not None and expenditure < 0:
            errors.append(f"Negative expenditure: {expenditure}")

        progress = record.get("current_progress")
        if progress is not None and not (0 <= progress <= 100):
            errors.append(f"Progress out of range: {progress}")

        start = record.get("original_start_date")
        completion = record.get("current_completion_date") or record.get("original_completion_date")
        if start and completion and start > completion:
            errors.append(f"Start date {start} is after completion date {completion}")

        return (len(errors) == 0), errors
