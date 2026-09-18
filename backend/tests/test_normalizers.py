"""
Unit tests for normalization utilities.
Tests currency, date, state, and progress normalization functions.
"""
from django.test import SimpleTestCase
from services.normalization.normalizers import (
    normalize_currency_to_paise,
    normalize_date,
    normalize_state_name,
    normalize_progress,
    paise_to_crore,
)

CRORE = 10_000_000


class CurrencyNormalizationTests(SimpleTestCase):
    """Test normalize_currency_to_paise with various input formats."""

    def test_integer_crore_value(self):
        """Float interpreted as Crore if < 1e8."""
        result = normalize_currency_to_paise(1247.0)
        self.assertEqual(result, int(1247.0 * CRORE))

    def test_string_crore(self):
        result = normalize_currency_to_paise("500 Crore")
        self.assertEqual(result, 500 * CRORE)

    def test_string_cr_abbreviated(self):
        result = normalize_currency_to_paise("1247 Cr")
        self.assertEqual(result, 1247 * CRORE)

    def test_string_with_rupee_symbol(self):
        result = normalize_currency_to_paise("₹500 Cr")
        self.assertEqual(result, 500 * CRORE)

    def test_string_with_commas(self):
        result = normalize_currency_to_paise("1,247.00")
        self.assertEqual(result, int(1247.0 * CRORE))

    def test_lakh_value(self):
        result = normalize_currency_to_paise("50 Lakh")
        self.assertEqual(result, int(50 * 100_000))

    def test_none_returns_none(self):
        self.assertIsNone(normalize_currency_to_paise(None))

    def test_zero(self):
        self.assertEqual(normalize_currency_to_paise(0), 0)

    def test_large_paise_value_passthrough(self):
        """Values > 1e8 assumed already in paise."""
        result = normalize_currency_to_paise(5_000_000_000)
        self.assertEqual(result, 5_000_000_000)

    def test_paise_to_crore_roundtrip(self):
        paise = normalize_currency_to_paise(1247.0)
        crore = paise_to_crore(paise)
        self.assertAlmostEqual(crore, 1247.0, places=2)


class DateNormalizationTests(SimpleTestCase):
    """Test normalize_date with Flash Report date formats."""

    def test_mon_year_format(self):
        """MoSPI Flash Report format: Mar-2022"""
        from datetime import date
        result = normalize_date("Mar-2022")
        self.assertIsNotNone(result)
        self.assertEqual(result.year, 2022)
        self.assertEqual(result.month, 3)

    def test_iso_format(self):
        from datetime import date
        result = normalize_date("2024-06-01")
        self.assertEqual(result, date(2024, 6, 1))

    def test_ddmmyyyy_format(self):
        from datetime import date
        result = normalize_date("01/03/2022")
        self.assertIsNotNone(result)

    def test_none_returns_none(self):
        self.assertIsNone(normalize_date(None))

    def test_na_returns_none(self):
        self.assertIsNone(normalize_date("N/A"))

    def test_empty_string_returns_none(self):
        self.assertIsNone(normalize_date(""))

    def test_dash_returns_none(self):
        self.assertIsNone(normalize_date("-"))

    def test_invalid_string_returns_none(self):
        self.assertIsNone(normalize_date("not-a-date"))

    def test_date_object_passthrough(self):
        from datetime import date
        d = date(2024, 1, 15)
        self.assertEqual(normalize_date(d), d)


class StateNormalizationTests(SimpleTestCase):
    """Test normalize_state_name with abbreviations and variants."""

    def test_full_name_preserved(self):
        self.assertEqual(normalize_state_name("Maharashtra"), "Maharashtra")

    def test_lowercase_mapping(self):
        self.assertEqual(normalize_state_name("uttar pradesh"), "Uttar Pradesh")

    def test_abbreviation_up(self):
        self.assertEqual(normalize_state_name("UP"), "Uttar Pradesh")

    def test_abbreviation_mp(self):
        self.assertEqual(normalize_state_name("MP"), "Madhya Pradesh")

    def test_orissa_maps_to_odisha(self):
        self.assertEqual(normalize_state_name("Orissa"), "Odisha")

    def test_new_delhi_maps_to_delhi(self):
        self.assertEqual(normalize_state_name("new delhi"), "Delhi")

    def test_jk_abbreviation(self):
        self.assertEqual(normalize_state_name("J&K"), "Jammu and Kashmir")

    def test_none_returns_none(self):
        self.assertIsNone(normalize_state_name(None))

    def test_empty_returns_none(self):
        self.assertIsNone(normalize_state_name(""))

    def test_unknown_state_title_cased(self):
        result = normalize_state_name("some unknown state")
        self.assertEqual(result, "Some Unknown State")


class ProgressNormalizationTests(SimpleTestCase):
    """Test normalize_progress with various formats."""

    def test_float_value(self):
        self.assertEqual(normalize_progress(78.5), 78.5)

    def test_string_with_percent(self):
        self.assertEqual(normalize_progress("78.5%"), 78.5)

    def test_integer_string(self):
        self.assertEqual(normalize_progress("100"), 100.0)

    def test_zero(self):
        self.assertEqual(normalize_progress(0), 0.0)

    def test_none_returns_none(self):
        self.assertIsNone(normalize_progress(None))

    def test_out_of_range_high_returns_none(self):
        self.assertIsNone(normalize_progress(105))

    def test_out_of_range_low_returns_none(self):
        self.assertIsNone(normalize_progress(-5))

    def test_string_100(self):
        self.assertEqual(normalize_progress("100%"), 100.0)
