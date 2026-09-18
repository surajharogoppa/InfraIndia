"""
MoSPI Flash Report PDF downloader.

Attempts to discover and download the latest Monthly Flash Report on
Central Sector Infrastructure Projects from mospi.gov.in.

IMPORTANT NOTES:
- mospi.gov.in uses a React SPA — there is no stable static URL for reports.
- ipm.mospi.gov.in (PAIMANA) has an expired SSL certificate and requires
  government login credentials; it is NOT publicly accessible.
- This downloader makes a best-effort attempt to find the PDF via the
  mospi.gov.in search API. If it fails, use manual file upload instead.
- Never assume the URL structure is stable; always handle NotFound gracefully.
"""
import re
import logging
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# mospi.gov.in search endpoint (returns JSON for their internal search)
MOSPI_SEARCH_URL = "https://mospi.gov.in/o/search"
MOSPI_BASE = "https://mospi.gov.in"

# Known pattern prefixes to try (updated as mospi.gov.in changes structure)
KNOWN_PDF_PATTERNS = [
    # Pattern 1: Liferay document store
    "/documents/213904/301737/Flash+Report+{month}+{year}.pdf",
    # Pattern 2: direct files path (older structure)
    "/sites/default/files/Flash_Report/Flash_Report_{month}_{year}.pdf",
    # Pattern 3: numbered variation
    "/web/mospi/infrastructure-statistics/-/media/document/{month}-{year}-flash-report.pdf",
]

REQUEST_TIMEOUT = 30
REQUEST_HEADERS = {
    "User-Agent": (
        "GovProjectIntelligence/1.0 InfraIndia Platform "
        "(automated monthly sync; contact: admin@govproject.example)"
    )
}


def try_download_latest_flash_report(save_dir: Path) -> Optional[Path]:
    """
    Attempt to download the latest MoSPI Flash Report PDF.

    Tries multiple known URL patterns for recent months (current and previous).
    Saves to save_dir with a date-stamped filename.

    Returns:
        Path to downloaded file, or None if download failed.

    This is a best-effort download — callers MUST handle the None case
    and fall back to manual file provision.
    """
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    # Try recent months (current month and 3 months back)
    from datetime import date, timedelta
    today = date.today()
    months_to_try = []
    for months_back in range(0, 4):
        # Subtract months
        target = date(today.year, today.month, 1)
        m = today.month - months_back
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        target = date(y, m, 1)
        months_to_try.append(target)

    for target_date in months_to_try:
        month_str = target_date.strftime("%B")   # e.g. "June"
        month_short = target_date.strftime("%b") # e.g. "Jun"
        year_str = str(target_date.year)

        for pattern in KNOWN_PDF_PATTERNS:
            url = MOSPI_BASE + pattern.format(
                month=month_str, year=year_str
            )
            result = _try_single_url(url, save_dir, target_date)
            if result:
                return result

            # Also try short month
            url = MOSPI_BASE + pattern.format(
                month=month_short, year=year_str
            )
            result = _try_single_url(url, save_dir, target_date)
            if result:
                return result

    logger.warning(
        "Auto-download of MoSPI Flash Report failed for all tried URL patterns. "
        "Please manually download the latest Flash Report from https://mospi.gov.in "
        "and use --file flag with sync_paimana management command."
    )
    return None


def _try_single_url(url: str, save_dir: Path, target_date) -> Optional[Path]:
    """Attempt to download a PDF from url. Returns Path on success, None on failure."""
    try:
        logger.debug(f"Trying URL: {url}")
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers=REQUEST_HEADERS)
        if resp.status_code == 200 and _is_pdf(resp.content):
            filename = f"flash_report_{target_date.strftime('%Y_%m')}.pdf"
            dest = save_dir / filename
            dest.write_bytes(resp.content)
            logger.info(f"Downloaded Flash Report to: {dest}")
            return dest
    except requests.exceptions.RequestException as e:
        logger.debug(f"Request failed for {url}: {e}")
    return None


def _is_pdf(content: bytes) -> bool:
    """Check if bytes represent a PDF file."""
    return content[:4] == b"%PDF"


def compute_file_hash(file_path: Path) -> str:
    """Compute SHA-256 hash of a file for deduplication."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()
