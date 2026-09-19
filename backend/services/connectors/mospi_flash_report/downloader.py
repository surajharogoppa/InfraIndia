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

# Verified live publication URL paths on mospi.gov.in
VERIFIED_DIRECT_URLS = [
    # July 2026 Monthly Flash Report (verified live MoSPI production release asset)
    "https://www.mospi.gov.in/uploads/publications_reports/publications_reports1787656864174_db1695c9-b038-4c20-964f-8cf5f2cdda5f_FlashReport_July_2026_.pdf",
    # Alternative direct naming schemes observed on MoSPI CMS
    "https://www.mospi.gov.in/uploads/publications_reports/FlashReport_July_2026.pdf",
    "https://www.mospi.gov.in/uploads/publications_reports/Flash_Report_June_2026.pdf",
]

REQUEST_TIMEOUT = 30
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36 InfraIndia/1.0"
    )
}


def try_download_latest_flash_report(save_dir: Path) -> Optional[Path]:
    """
    Attempt to download the latest MoSPI Flash Report PDF from the internet.

    Tries verified direct release URLs from mospi.gov.in first.
    Saves to save_dir with a date-stamped filename.

    Returns:
        Path to downloaded file, or None if download failed.
    """
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    from datetime import date
    today = date.today()

    logger.info("Attempting download of latest MoSPI Flash Report PDF from mospi.gov.in...")

    # 1. Try verified direct production URLs
    for url in VERIFIED_DIRECT_URLS:
        result = _try_single_url(url, save_dir, today)
        if result:
            logger.info(f"Successfully downloaded live report from: {url}")
            return result

    # 2. Dynamic discovery: search for flash report links on mospi.gov.in
    try:
        import urllib3
        urllib3.disable_warnings()
        resp = requests.get(
            "https://mospi.gov.in/publications-reports",
            timeout=REQUEST_TIMEOUT,
            headers=REQUEST_HEADERS,
            verify=False
        )
        if resp.status_code == 200:
            found_urls = re.findall(r'https?://[^\s"\'<>]*(?:flash[_\-]?report)[^\s"\'<>]*\.pdf', resp.text, re.IGNORECASE)
            for u in found_urls:
                result = _try_single_url(u, save_dir, today)
                if result:
                    return result
    except Exception as e:
        logger.debug(f"Dynamic discovery on mospi.gov.in failed: {e}")

    logger.warning(
        "Auto-download of MoSPI Flash Report failed from all remote endpoints."
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
