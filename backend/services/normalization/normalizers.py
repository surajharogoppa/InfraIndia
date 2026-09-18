"""
Currency and date normalization utilities.
"""
import re
import logging
from datetime import date, datetime
from decimal import Decimal

logger = logging.getLogger(__name__)

# ── Currency Normalization ──────────────────────────────────────────────────

CRORE = 10_000_000  # 1 Crore = 10,000,000 paise (using paisa base)
LAKH = 100_000


def normalize_currency_to_paise(value) -> int | None:
    """
    Normalize various Indian currency string/number representations to integer paise.

    Examples:
        "500 Crore"   → 5_000_000_000_000 (paise)
        "500 Cr"      → 5_000_000_000_000
        "₹500 Cr"     → 5_000_000_000_000
        500.0 (float) → interpreted as Crore → paise
        5000000000    → interpreted as paise directly (if > 1Cr threshold)
    """
    if value is None:
        return None

    if isinstance(value, (int, float, Decimal)):
        num = float(value)
        # Heuristic: if value > 1e8 assume already in paise; else assume Crore
        if num > 1e8:
            return int(num)
        return int(num * CRORE)

    if isinstance(value, str):
        value = value.strip().replace(",", "").replace("₹", "").replace("Rs.", "").replace("Rs", "")
        value = value.replace("\u20b9", "")  # ₹ unicode

        # Match patterns like "500 Crore", "500 CR", "500 Cr", "500cr"
        m = re.search(r"([\d.]+)\s*(crore|cr|c)\b", value, re.IGNORECASE)
        if m:
            return int(float(m.group(1)) * CRORE)

        # Match patterns like "500 Lakh", "500 L"
        m = re.search(r"([\d.]+)\s*(lakh|l)\b", value, re.IGNORECASE)
        if m:
            return int(float(m.group(1)) * LAKH)

        # Plain number — try to extract
        m = re.search(r"[\d.]+", value)
        if m:
            num = float(m.group())
            if num > 1e8:
                return int(num)
            return int(num * CRORE)

    return None


def paise_to_crore(paise: int | None) -> float | None:
    if paise is None:
        return None
    return round(paise / CRORE, 2)


# ── Date Normalization ───────────────────────────────────────────────────────

DATE_FORMATS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%m/%Y",
    "%m-%Y",
    "%d-%b-%Y",
    "%b-%Y",
    "%B %Y",
    "%Y",
    "%d %b %Y",
    "%d %B %Y",
]


def normalize_date(value) -> date | None:
    """
    Parse various date string formats to a Python date object.
    Returns None if parsing fails.
    """
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()

    value = str(value).strip()
    if not value or value.lower() in ("na", "n/a", "nil", "-", ""):
        return None

    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    logger.warning(f"Could not parse date: {value!r}")
    return None


# ── State Name Normalization ─────────────────────────────────────────────────

STATE_ALIASES = {
    "andhra pradesh": "Andhra Pradesh",
    "ap": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chhattisgarh": "Chhattisgarh",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal pradesh": "Himachal Pradesh",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "madhya pradesh": "Madhya Pradesh",
    "mp": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil nadu": "Tamil Nadu",
    "tn": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh",
    "up": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "west bengal": "West Bengal",
    "wb": "West Bengal",
    # UTs
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "jammu and kashmir": "Jammu and Kashmir",
    "j&k": "Jammu and Kashmir",
    "ladakh": "Ladakh",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "chandigarh": "Chandigarh",
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andaman": "Andaman and Nicobar Islands",
    "lakshadweep": "Lakshadweep",
    "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
}


def normalize_state_name(value: str) -> str | None:
    if not value:
        return None
    cleaned = value.strip().lower()
    return STATE_ALIASES.get(cleaned, value.strip().title())


# ── Progress Normalization ───────────────────────────────────────────────────

def normalize_progress(value) -> float | None:
    """Normalize progress to a float 0–100."""
    if value is None:
        return None
    try:
        num = float(str(value).replace("%", "").strip())
        if 0 <= num <= 100:
            return round(num, 2)
        return None  # Out-of-range — route to quality queue
    except (ValueError, TypeError):
        return None
