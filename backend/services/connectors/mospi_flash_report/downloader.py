"""
MoSPI Flash Report PDF Downloader.

Discovers and downloads the latest Monthly Flash Report on Central Sector
Infrastructure Projects from mospi.gov.in using:
1. The official MoSPI Publications API (/api/publications-reports/get-web-publications-report-list)
   which dynamically returns the latest published reports (e.g. September 2026, October 2026, etc.).
2. Chronologically ordered verified release asset fallbacks (September 2026 down to older editions).
3. Automatic period detection so each PDF is named flash_report_<YYYY>_<MM>.pdf matching its true
   reporting period rather than the download date.
"""
import re
import logging
import hashlib
from datetime import datetime, date
from pathlib import Path
from typing import Optional, Tuple

import requests

logger = logging.getLogger(__name__)

# Official MoSPI backend API endpoint for publications and reports
MOSPI_API_URL = "https://www.mospi.gov.in/api/publications-reports/get-web-publications-report-list"
MOSPI_BASE_URL = "https://www.mospi.gov.in"

# Chronologically ordered verified production direct URLs (newest to oldest)
# Used as fallback if the dynamic API endpoint is unreachable
VERIFIED_DIRECT_URLS = [
    # September 2026 Monthly Flash Report (Report #491, released October 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1793778425642_dda4219a-a1f6-4a89-b739-d5732fef465c_Final_FlashReport_September_2026_(1).pdf",
        2026,
        9
    ),
    # August 2026 Monthly Flash Report (Report #490, released September 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1790332216620_28c59057-0b69-44af-8989-d192bc3e65bf_FlashReport_August_2026.pdf",
        2026,
        8
    ),
    # July 2026 Monthly Flash Report (Report #489, released August 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1787656864174_db1695c9-b038-4c20-964f-8cf5f2cdda5f_FlashReport_July_2026_.pdf",
        2026,
        7
    ),
    # May 2026 Monthly Flash Report (Report #487, released June 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1782388627305_2544b8eb-3ea2-40eb-ab6e-b150c40c4a9e_FlashReport_May_2026.pdf",
        2026,
        5
    ),
    # April 2026 Monthly Flash Report (Report #486, released May 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1779688125413_332125c5-1fb9-4d23-87ca-dd89fc14cd15_Flash_Report_April_2026.pdf",
        2026,
        4
    ),
    # March 2026 Monthly Flash Report (Report #485, released April 2026)
    (
        "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1777023713556_6e42b5c9-26c0-4301-8b74-7a12428cc83d_FlashReport_March_2026.pdf",
        2026,
        3
    ),
]

REQUEST_TIMEOUT = 35
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36 InfraIndia/1.0"
    ),
    "Accept": "application/json, application/pdf, text/html, */*",
}

MONTH_MAP = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def parse_period_from_string(text: str) -> Optional[Tuple[int, int]]:
    """
    Extract (year, month) from title, URL, or filename string.
    E.g. 'Flash Report on Infrastructure Projects ... September 2026' -> (2026, 9)
    """
    if not text:
        return None

    clean = re.sub(r"<[^>]+>", " ", text).strip()
    pattern = r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\b[_\s\-]+(\d{4})"
    match = re.search(pattern, clean, re.IGNORECASE)
    if match:
        m_str = match.group(1).lower()
        y_str = match.group(2)
        month = MONTH_MAP.get(m_str)
        if month:
            return int(y_str), month

    # Also match pattern YYYY_MM or YYYY-MM
    match_ym = re.search(r"\b(20\d{2})[_\-](\d{1,2})\b", clean)
    if match_ym:
        year = int(match_ym.group(1))
        month = int(match_ym.group(2))
        if 1 <= month <= 12:
            return year, month

    return None


def extract_period_from_pdf_content(pdf_bytes: bytes) -> Optional[Tuple[int, int]]:
    """Inspect first few pages of PDF to extract the actual report month & year."""
    try:
        import pdfplumber
        import io
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for p_idx in range(min(3, len(pdf.pages))):
                text = pdf.pages[p_idx].extract_text() or ""
                period = parse_period_from_string(text)
                if period:
                    return period
    except Exception as e:
        logger.debug(f"Could not extract period from PDF content: {e}")
    return None


def try_download_latest_flash_report(save_dir: Path) -> Optional[Path]:
    """
    Attempt to discover and download the latest MoSPI Flash Report PDF.
    
    1. Queries the official MoSPI API to discover newly published editions dynamically.
    2. Falls back to chronologically ordered direct URLs (September 2026, August 2026, etc.).
    3. Saves file with canonical name flash_report_<YYYY>_<MM>.pdf reflecting true report period.

    Returns:
        Path to the downloaded or resolved latest file, or None if completely failed.
    """
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Discovering latest MoSPI Flash Report from mospi.gov.in API...")

    # Strategy 1: Dynamic MoSPI API discovery
    try:
        api_result = _discover_and_download_via_api(save_dir)
        if api_result and api_result.exists() and api_result.stat().st_size > 100000:
            logger.info(f"Successfully obtained latest Flash Report via MoSPI API: {api_result.name}")
            return api_result
    except Exception as exc:
        logger.warning(f"MoSPI API dynamic discovery encountered error: {exc}. Falling back to verified direct URLs.")

    # Strategy 2: Chronologically ordered verified direct URLs (newest first)
    logger.info("Attempting download via verified direct MoSPI publication URLs...")
    for url, fallback_year, fallback_month in VERIFIED_DIRECT_URLS:
        try:
            result = _download_single_url(url, save_dir, fallback_year, fallback_month)
            if result and result.exists() and result.stat().st_size > 100000:
                logger.info(f"Successfully downloaded report via direct URL: {result.name} ({url})")
                return result
        except Exception as e:
            logger.debug(f"Direct download failed for {url}: {e}")

    logger.warning("Auto-download of MoSPI Flash Report failed from all remote endpoints.")
    return None


def _discover_and_download_via_api(save_dir: Path) -> Optional[Path]:
    """Query the MoSPI API, filter for Flash Reports on Infrastructure Projects, and download latest."""
    payload = {
        "page": 1,
        "pageSize": 30,
        "search": "Flash Report",
        "data_source": "web",
    }
    resp = requests.post(
        MOSPI_API_URL,
        headers=REQUEST_HEADERS,
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code != 200:
        logger.warning(f"MoSPI API returned status {resp.status_code}")
        return None

    data = resp.json()
    items = data.get("data", [])
    if not items:
        logger.warning("MoSPI API returned no publication items.")
        return None

    # Filter for Monthly Flash Report on Infrastructure Projects
    candidates = []
    for item in items:
        raw_title = item.get("title", "")
        clean_title = re.sub(r"<[^>]+>", " ", raw_title).strip()
        is_flash = "flash report" in clean_title.lower() or "flashreport" in clean_title.lower()
        is_infra = any(kw in clean_title.lower() for kw in ["infrastructure", "150 crore", "paimana", "central sector"])
        
        file_one = item.get("file_one") or {}
        file_path = file_one.get("path", "")
        if (is_flash and is_infra) and file_path and file_path.lower().endswith(".pdf"):
            period = parse_period_from_string(clean_title)
            pub_date = item.get("published_year", "")
            if not period and pub_date:
                try:
                    p_dt = datetime.strptime(pub_date[:10], "%Y-%m-%d")
                    period = (p_dt.year, p_dt.month)
                except Exception:
                    pass

            year = period[0] if period else 2026
            month = period[1] if period else 1
            candidates.append({
                "item": item,
                "title": clean_title,
                "file_path": file_path,
                "file_size": file_one.get("filesize", 0),
                "year": year,
                "month": month,
                "published_year": pub_date,
            })

    if not candidates:
        logger.warning("No Flash Report PDF publications matched search in MoSPI API.")
        return None

    # Sort candidates descending by (year, month, published_year)
    candidates.sort(key=lambda c: (c["year"], c["month"], c["published_year"]), reverse=True)
    latest = candidates[0]
    logger.info(f"MoSPI API identified latest candidate: '{latest['title']}' (Period: {latest['year']}-{latest['month']:02d})")

    # Construct download URL
    rel_path = latest["file_path"].lstrip("/")
    download_url = f"{MOSPI_BASE_URL}/{rel_path}" if not rel_path.startswith("http") else rel_path

    return _download_single_url(download_url, save_dir, latest["year"], latest["month"])


def _download_single_url(url: str, save_dir: Path, expected_year: int, expected_month: int) -> Optional[Path]:
    """Download a PDF from url, verify content, and save as flash_report_<YYYY>_<MM>.pdf."""
    try:
        logger.debug(f"Downloading from: {url}")
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers=REQUEST_HEADERS)
        if resp.status_code == 200 and _is_pdf(resp.content):
            # Verify actual period from PDF first page if possible
            detected_period = extract_period_from_pdf_content(resp.content)
            year = detected_period[0] if detected_period else expected_year
            month = detected_period[1] if detected_period else expected_month

            filename = f"flash_report_{year}_{month:02d}.pdf"
            dest = save_dir / filename
            dest.write_bytes(resp.content)
            logger.info(f"Successfully saved Flash Report to: {dest} ({len(resp.content):,} bytes)")
            return dest
        else:
            logger.warning(f"URL {url} returned status {resp.status_code} (is_pdf={_is_pdf(resp.content if resp.status_code == 200 else b'')})")
    except requests.exceptions.RequestException as e:
        logger.debug(f"Request failed for {url}: {e}")
    return None


def _is_pdf(content: bytes) -> bool:
    """Check if bytes represent a valid PDF file."""
    return len(content) > 4 and content[:4] == b"%PDF"


def compute_file_hash(file_path: Path) -> str:
    """Compute SHA-256 hash of a file for deduplication."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()
