"""
Tests for the MoSPI Flash Report CSV connector.
Tests parsing, normalization, validation, hashing, and field mapping.
"""
import io
from django.test import SimpleTestCase
from services.connectors.mospi_flash_report.connector import (
    MoSPIFlashReportCSVConnector,
    _normalize_record,
    _validate_normalized,
    _derive_platform_status,
)

CRORE = 10_000_000

# Minimal valid Flash Report CSV row
VALID_CSV = """Name of Project,Ministry/Deptt.,Sector,State,Approved Cost (Rs Cr),Latest Revised Cost (Rs Cr),Cumm. Expenditure (Rs Cr),Date of Compl. (Orig.),Date of Compl. (Rev.),Physical Progress (%),Source Status
"NH-44 Four-Laning Package I",Ministry of Road Transport & Highways,Roads,Telangana,1247.00,1485.00,1102.50,Mar-2022,Sep-2024,89.5,Ongoing
"NTPC Lara STPS",Ministry of Power,Power,Chhattisgarh,12300.00,14800.00,13100.00,Mar-2021,Dec-2024,91.0,Ongoing
"""

INVALID_ROW_CSV = """Name of Project,Ministry/Deptt.,Sector,State,Approved Cost (Rs Cr),Latest Revised Cost (Rs Cr),Cumm. Expenditure (Rs Cr),Date of Compl. (Orig.),Date of Compl. (Rev.),Physical Progress (%),Source Status
"",Ministry of Power,Power,Chhattisgarh,-100.00,14800.00,13100.00,Mar-2021,Dec-2024,150.0,Ongoing
"""


class NormalizeRecordTests(SimpleTestCase):
    """Test the shared _normalize_record function."""

    def _make_raw(self, **kwargs):
        defaults = {
            "name": "Test Highway Project",
            "ministry_name": "Ministry of Road Transport & Highways",
            "sector_name": "Roads",
            "state_name": "Maharashtra",
            "original_cost_raw": "500",
            "revised_cost_raw": "600",
            "expenditure_raw": "450",
            "original_completion_date_raw": "Mar-2022",
            "current_completion_date_raw": "Sep-2024",
            "progress_raw": "75",
            "source_status": "Ongoing",
        }
        defaults.update(kwargs)
        return defaults

    def test_basic_normalization(self):
        raw = self._make_raw()
        result = _normalize_record(raw)
        self.assertEqual(result["name"], "Test Highway Project")
        self.assertEqual(result["ministry_name"], "Ministry of Road Transport & Highways")
        self.assertEqual(result["sector_name"], "Roads")
        self.assertEqual(result["state_name"], "Maharashtra")

    def test_cost_normalized_to_paise(self):
        raw = self._make_raw(original_cost_raw="500", revised_cost_raw="600")
        result = _normalize_record(raw)
        self.assertEqual(result["original_cost"], 500 * CRORE)
        self.assertEqual(result["current_cost"], 600 * CRORE)

    def test_progress_normalized(self):
        raw = self._make_raw(progress_raw="75.5")
        result = _normalize_record(raw)
        self.assertEqual(result["current_progress"], 75.5)

    def test_source_match_key_generated(self):
        """Composite hash key should be generated deterministically."""
        raw = self._make_raw()
        result1 = _normalize_record(raw)
        result2 = _normalize_record(raw)
        self.assertEqual(result1["source_match_key"], result2["source_match_key"])

    def test_raw_record_hash_deterministic(self):
        """Same input should always produce same hash."""
        raw = self._make_raw()
        result1 = _normalize_record(raw)
        result2 = _normalize_record(raw)
        self.assertEqual(result1["raw_record_hash"], result2["raw_record_hash"])

    def test_different_data_different_hash(self):
        raw1 = self._make_raw(progress_raw="75")
        raw2 = self._make_raw(progress_raw="80")
        r1 = _normalize_record(raw1)
        r2 = _normalize_record(raw2)
        self.assertNotEqual(r1["raw_record_hash"], r2["raw_record_hash"])

    def test_date_normalization(self):
        raw = self._make_raw(original_completion_date_raw="Mar-2022")
        result = _normalize_record(raw)
        self.assertIsNotNone(result["original_completion_date"])
        self.assertEqual(result["original_completion_date"].year, 2022)
        self.assertEqual(result["original_completion_date"].month, 3)

    def test_none_cost_allowed(self):
        raw = self._make_raw(original_cost_raw=None, revised_cost_raw=None)
        result = _normalize_record(raw)
        self.assertIsNone(result["original_cost"])
        self.assertIsNone(result["current_cost"])

    def test_state_normalized(self):
        raw = self._make_raw(state_name="UP")
        result = _normalize_record(raw)
        self.assertEqual(result["state_name"], "Uttar Pradesh")


class DerivePlatformStatusTests(SimpleTestCase):
    """Test _derive_platform_status logic."""

    def test_completed_from_status(self):
        self.assertEqual(_derive_platform_status("Completed", 95), "COMPLETED")

    def test_completed_from_high_progress(self):
        self.assertEqual(_derive_platform_status("Ongoing", 98), "COMPLETED")

    def test_active_from_ongoing_status(self):
        self.assertEqual(_derive_platform_status("Ongoing", 50), "ACTIVE")

    def test_planned_from_new_status(self):
        self.assertEqual(_derive_platform_status("New", 0), "PLANNED")

    def test_unknown_fallback(self):
        self.assertEqual(_derive_platform_status("", None), "UNKNOWN")

    def test_active_from_progress_only(self):
        self.assertEqual(_derive_platform_status("", 45), "ACTIVE")


class ValidateNormalizedTests(SimpleTestCase):
    """Test _validate_normalized rules."""

    def _make_normalized(self, **kwargs):
        defaults = {
            "name": "Test Project",
            "original_cost": 500 * CRORE,
            "current_cost": 600 * CRORE,
            "current_expenditure": 400 * CRORE,
            "current_progress": 75.0,
        }
        defaults.update(kwargs)
        return defaults

    def test_valid_record_passes(self):
        record = self._make_normalized()
        is_valid, errors = _validate_normalized(record)
        self.assertTrue(is_valid)
        self.assertEqual(errors, [])

    def test_missing_name_fails(self):
        record = self._make_normalized(name="")
        is_valid, errors = _validate_normalized(record)
        self.assertFalse(is_valid)
        self.assertTrue(any("name" in e.lower() for e in errors))

    def test_negative_cost_fails(self):
        record = self._make_normalized(original_cost=-100 * CRORE)
        is_valid, errors = _validate_normalized(record)
        self.assertFalse(is_valid)

    def test_negative_expenditure_fails(self):
        record = self._make_normalized(current_expenditure=-1)
        is_valid, errors = _validate_normalized(record)
        self.assertFalse(is_valid)

    def test_progress_out_of_range_fails(self):
        record = self._make_normalized(current_progress=150.0)
        is_valid, errors = _validate_normalized(record)
        self.assertFalse(is_valid)

    def test_zero_progress_valid(self):
        record = self._make_normalized(current_progress=0.0)
        is_valid, errors = _validate_normalized(record)
        self.assertTrue(is_valid)

    def test_100_progress_valid(self):
        record = self._make_normalized(current_progress=100.0)
        is_valid, errors = _validate_normalized(record)
        self.assertTrue(is_valid)

    def test_none_values_allowed(self):
        record = self._make_normalized(
            original_cost=None, current_cost=None,
            current_expenditure=None, current_progress=None
        )
        is_valid, errors = _validate_normalized(record)
        self.assertTrue(is_valid)


class CSVConnectorParsingTests(SimpleTestCase):
    """Test CSV connector parse/normalize using in-memory CSV."""

    def _get_connector_from_string(self, csv_string):
        """Create a temporary connector that reads from a string."""
        import tempfile
        import os
        # Write to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False,
                                         encoding='utf-8') as f:
            f.write(csv_string)
            path = f.name
        connector = MoSPIFlashReportCSVConnector(path)
        # Clean up after test
        self.addCleanup(os.unlink, path)
        return connector

    def test_parse_returns_correct_count(self):
        connector = self._get_connector_from_string(VALID_CSV)
        raw_data = connector.fetch()
        rows = list(connector.parse(raw_data))
        self.assertEqual(len(rows), 2)

    def test_normalize_maps_columns(self):
        connector = self._get_connector_from_string(VALID_CSV)
        raw_data = connector.fetch()
        rows = list(connector.parse(raw_data))
        normalized = connector.normalize(rows[0])
        self.assertEqual(normalized["name"], "NH-44 Four-Laning Package I")
        self.assertEqual(normalized["sector_name"], "Roads")
        self.assertEqual(normalized["state_name"], "Telangana")

    def test_validate_passes_for_valid_row(self):
        connector = self._get_connector_from_string(VALID_CSV)
        raw_data = connector.fetch()
        rows = list(connector.parse(raw_data))
        normalized = connector.normalize(rows[0])
        is_valid, errors = connector.validate(normalized)
        self.assertTrue(is_valid, f"Expected valid but got errors: {errors}")

    def test_validate_fails_for_invalid_row(self):
        connector = self._get_connector_from_string(INVALID_ROW_CSV)
        raw_data = connector.fetch()
        rows = list(connector.parse(raw_data))
        normalized = connector.normalize(rows[0])
        is_valid, errors = connector.validate(normalized)
        self.assertFalse(is_valid)
        # Should catch multiple errors: missing name, negative cost, progress out of range
        self.assertGreaterEqual(len(errors), 1)
