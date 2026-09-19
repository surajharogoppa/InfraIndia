"""
MoSPI Flash Report PDF Parser.

Extracts project tables from the Monthly Flash Report on Central Sector
Infrastructure Projects published by MoSPI/IPMD.

PDF Structure (as of 2024–2026 editions):
- Introductory summary page
- Sector-wise and ministry-wise summary tables
- Annexure: Project-wise details (one or more pages)
  Columns: Name of Project | Ministry/Deptt. | Sector | State |
           Approved Cost | Latest Revised Cost | Cumm. Expenditure |
           Date of Compl. (Orig.) | Date of Compl. (Rev.) | Physical Progress (%)

IMPORTANT: Flash Report format may vary between editions. This parser is designed
to be tolerant — if expected columns are not found, it logs the mismatch and
returns an empty list rather than crashing.
"""
import logging
import re
from typing import Iterator

logger = logging.getLogger(__name__)

# Expected column header fragments (case-insensitive partial matches)
# These are matched flexibly to handle minor format variations across editions
EXPECTED_COLUMNS = {
    "name": ["name of project", "project name", "name of the project"],
    "ministry": ["ministry", "deptt", "department"],
    "sector": ["sector"],
    "state": ["state"],
    "approved_cost": ["approved cost", "original cost", "sanctioned cost"],
    "revised_cost": ["revised cost", "latest revised cost", "latest cost"],
    "expenditure": ["expenditure", "cumm.", "cumulative"],
    "orig_completion": ["compl. (orig", "original completion", "orig. compl"],
    "rev_completion": ["compl. (rev", "revised completion", "rev. compl"],
    "progress": ["physical progress", "progress (%)"],
}

# Minimum columns required to consider a table valid
MIN_REQUIRED_COLUMNS = {"name", "approved_cost"}


def parse_flash_report_pdf(pdf_path: str) -> list[dict]:
    """
    Parse a MoSPI Flash Report PDF and extract project rows.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        List of raw row dicts with source column names preserved.
        Returns empty list if PDF structure is not recognized (logged as warning).

    Raises:
        ImportError if pdfplumber is not installed.
        FileNotFoundError if pdf_path does not exist.
    """
    try:
        import pdfplumber
    except ImportError:
        raise ImportError(
            "pdfplumber is required for PDF parsing. "
            "Install it with: pip install pdfplumber"
        )

    import os
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Flash Report PDF not found: {pdf_path}")

PAGE_MINISTRIES = [
    "Ministry of Road Transport & Highways",
    "Ministry of Railways",
    "Ministry of Power",
    "Ministry of Petroleum & Natural Gas",
    "Ministry of Coal",
    "Ministry of Jal Shakti",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Ports, Shipping and Waterways",
    "Ministry of Civil Aviation",
    "Ministry of Communications",
]

PAGE_SECTORS = [
    ("Transport & Logistics", "Transport & Logistics"),
    ("Road Transport", "Roads & Highways"),
    ("Railways", "Railways"),
    ("Energy", "Energy"),
    ("Water & Sanitation", "Water Resources"),
    ("Communication", "Telecommunications"),
    ("Social & Commercial", "Social & Commercial Infrastructure"),
    ("Power", "Power"),
    ("Petroleum", "Petroleum & Natural Gas"),
    ("Coal", "Coal"),
]

STATE_KEYWORDS = {
    'mumbai': 'Maharashtra',
    'chennai': 'Tamil Nadu',
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'delhi': 'Delhi',
    'dmrts': 'Delhi',
    'bina': 'Madhya Pradesh',
    'ken-betwa': 'Madhya Pradesh',
    'panipat': 'Haryana',
    'talabira': 'Odisha',
    'nabinagar': 'Bihar',
    'dibang': 'Arunachal Pradesh',
    'meja': 'Uttar Pradesh',
    'rajasthan': 'Rajasthan',
    'telangana': 'Telangana',
    'gujarat': 'Gujarat',
    'cbr': 'Tamil Nadu',
    'kg-dwn': 'Andhra Pradesh',
    'barmer': 'Rajasthan',
    'gorakhpur': 'Uttar Pradesh',
    'kudankulam': 'Tamil Nadu',
    'visakhapatnam': 'Andhra Pradesh',
    'vizag': 'Andhra Pradesh',
    'kolkata': 'West Bengal',
    'hyderabad': 'Telangana',
    'pune': 'Maharashtra',
    'ahmedabad': 'Gujarat',
    'kochi': 'Kerala',
    'guwahati': 'Assam',
    'patna': 'Bihar',
    'ranchi': 'Jharkhand',
    'lucknow': 'Uttar Pradesh',
    'bhopal': 'Madhya Pradesh',
    'assam': 'Assam',
    'odisha': 'Odisha',
    'bihar': 'Bihar',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'kerala': 'Kerala',
    'uttar pradesh': 'Uttar Pradesh',
    'madhya pradesh': 'Madhya Pradesh',
    'maharashtra': 'Maharashtra',
    'sardar sarovar': 'Gujarat',
    'polavaram': 'Andhra Pradesh',
    'devadula': 'Telangana',
    'gosikhurd': 'Maharashtra',
    'jiribam': 'Manipur',
    'imphal': 'Manipur',
    'gevra': 'Chhattisgarh',
    'jayant': 'Madhya Pradesh',
    'jharia': 'Jharkhand',
    'magadh': 'Jharkhand',
    'z-morh': 'Jammu and Kashmir',
    'ramanatukkara': 'Kerala',
    'palakkad': 'Kerala',
    'zaheerabad': 'Telangana',
    'orvakal': 'Andhra Pradesh',
}


def _extract_page_context(page) -> dict:
    """Extract Ministry and Sector context from page title and headers."""
    text = (page.extract_text() or "").strip()
    ctx = {"ministry": "", "sector": ""}

    for m in PAGE_MINISTRIES:
        if m.lower() in text.lower():
            ctx["ministry"] = m
            break

    for pattern, sec in PAGE_SECTORS:
        if pattern.lower() in text.lower():
            ctx["sector"] = sec
            break

    return ctx


def _enrich_record(record: dict, page_context: dict | None) -> dict:
    """Enrich record with ministry, sector, and state when missing from the table columns."""
    ctx = page_context or {}
    name = record.get("name", "")
    name_lower = name.lower()

    # 1. Ministry
    if not record.get("ministry"):
        if ctx.get("ministry"):
            record["ministry"] = ctx["ministry"]
        elif "rail" in name_lower or "train" in name_lower:
            record["ministry"] = "Ministry of Railways"
        elif "road" in name_lower or "highway" in name_lower or "bridge" in name_lower:
            record["ministry"] = "Ministry of Road Transport & Highways"
        elif "power" in name_lower or "thermal" in name_lower or "transmission" in name_lower:
            record["ministry"] = "Ministry of Power"
        elif "refinery" in name_lower or "petro" in name_lower or "nelp" in name_lower or "pipeline" in name_lower:
            record["ministry"] = "Ministry of Petroleum & Natural Gas"
        elif "coal" in name_lower or "ocp" in name_lower or "mtpa" in name_lower:
            record["ministry"] = "Ministry of Coal"
        elif "water" in name_lower or "irrigation" in name_lower or "linking" in name_lower:
            record["ministry"] = "Ministry of Jal Shakti"
        elif "metro" in name_lower or "residential" in name_lower:
            record["ministry"] = "Ministry of Housing and Urban Affairs"
        elif "4g" in name_lower or "bharatnet" in name_lower or "telecom" in name_lower:
            record["ministry"] = "Ministry of Communications"
        elif ctx.get("sector"):
            sec = ctx["sector"].lower()
            if "energy" in sec or "power" in sec:
                record["ministry"] = "Ministry of Power"
            elif "water" in sec:
                record["ministry"] = "Ministry of Jal Shakti"
            elif "transport" in sec:
                record["ministry"] = "Ministry of Road Transport & Highways"
            elif "communication" in sec:
                record["ministry"] = "Ministry of Communications"

    # 2. Sector
    if not record.get("sector"):
        if ctx.get("sector"):
            record["sector"] = ctx["sector"]
        elif "rail" in name_lower:
            record["sector"] = "Railways"
        elif "road" in name_lower or "highway" in name_lower or "bridge" in name_lower:
            record["sector"] = "Roads & Highways"
        elif "power" in name_lower or "thermal" in name_lower or "transmission" in name_lower:
            record["sector"] = "Power"
        elif "refinery" in name_lower or "petro" in name_lower:
            record["sector"] = "Petroleum & Natural Gas"
        elif "coal" in name_lower or "ocp" in name_lower:
            record["sector"] = "Coal"
        elif "irrigation" in name_lower or "water" in name_lower:
            record["sector"] = "Water Resources"
        elif "telecom" in name_lower or "4g" in name_lower or "bharatnet" in name_lower:
            record["sector"] = "Telecommunications"
        elif "metro" in name_lower:
            record["sector"] = "Urban Development"

    # 3. State
    if not record.get("state"):
        for kw, st in STATE_KEYWORDS.items():
            if kw in name_lower:
                record["state"] = st
                break
        if not record.get("state"):
            record["state"] = "Multi-State"

    return record


def _parse_table_6(pdf) -> list[dict]:
    """
    Extract all projects from Table 6: All Ongoing Projects.
    In MoSPI Monthly Flash Reports, Table 6 starts around page 55 and contains
    all central sector infrastructure projects costing Rs. 150 Cr & above.
    """
    records = []
    current_ministry = ""
    current_sector = ""

    # Locate starting page of Table 6
    start_page_idx = None
    search_start = min(35, len(pdf.pages))
    search_end = min(90, len(pdf.pages))
    for p_idx in range(search_start, search_end):
        text = (pdf.pages[p_idx].extract_text() or "").lower()
        if "table 6" in text or "table-6" in text or "all ongoing projects" in text or "list of ongoing projects" in text:
            start_page_idx = p_idx
            break

    if start_page_idx is None:
        return []

    logger.info(f"Found Table 6 starting at page {start_page_idx + 1}. Extracting all ongoing projects...")

    for p_idx in range(start_page_idx, len(pdf.pages)):
        page = pdf.pages[p_idx]
        tables = page.extract_tables()
        for table in tables:
            for row in table[1:]:
                if not row or len(row) < 3:
                    continue
                col0 = str(row[0] or "").strip()
                col1 = str(row[1] or "").strip()

                if not col0 and "ministry" in col1.lower():
                    current_ministry = col1
                    continue
                elif not col0 and col1 and not any(c.isdigit() for c in str(row[2:])):
                    current_sector = col1
                    continue

                if col0.isdigit() and len(row) >= 6:
                    # Extract Project ID
                    id_m = re.search(r"\((\d{5,8})\)", col1)
                    proj_id = id_m.group(1) if id_m else ""

                    # Extract Name
                    lines = col1.split("\n")
                    name_parts = [l.strip() for l in lines if not l.strip().startswith("(")]
                    name = " ".join(name_parts).strip() or lines[0].strip()

                    # Extract State
                    state = str(row[2] or "").strip()

                    # Dates
                    start_dates = re.findall(r"(\d{1,2}/\d{4})", str(row[3] or ""))
                    orig_start = start_dates[0] if start_dates else ""
                    rev_start = start_dates[1] if len(start_dates) > 1 else orig_start

                    doc_dates = re.findall(r"(\d{1,2}/\d{4})", str(row[4] or ""))
                    orig_doc = doc_dates[0] if doc_dates else ""
                    rev_doc = doc_dates[1] if len(doc_dates) > 1 else orig_doc

                    # Costs
                    costs = re.findall(r"([\d.]+)", str(row[5] or "").replace(",", ""))
                    orig_cost = costs[0] if costs else ""
                    rev_cost = costs[1] if len(costs) > 1 else orig_cost

                    exp = str(row[6] or "").strip() if len(row) > 6 else ""
                    prog = str(row[7] or "").strip() if len(row) > 7 else ""

                    records.append({
                        "external_id": proj_id,
                        "name": name,
                        "ministry": current_ministry,
                        "sector": current_sector or "Central Sector Infrastructure",
                        "state": state,
                        "approved_cost": orig_cost,
                        "revised_cost": rev_cost,
                        "expenditure": exp,
                        "orig_completion": orig_doc,
                        "rev_completion": rev_doc,
                        "progress": prog,
                    })

    logger.info(f"Extracted {len(records)} projects from Table 6.")
    return records


def parse_flash_report_pdf(pdf_path: str) -> list[dict]:
    """
    Parse a MoSPI Flash Report PDF and extract project rows.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        List of raw row dicts with source column names preserved.
        Returns empty list if PDF structure is not recognized (logged as warning).

    Raises:
        ImportError if pdfplumber is not installed.
        FileNotFoundError if pdf_path does not exist.
    """
    try:
        import pdfplumber
    except ImportError:
        raise ImportError(
            "pdfplumber is required for PDF parsing. "
            "Install it with: pip install pdfplumber"
        )

    import os
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Flash Report PDF not found: {pdf_path}")

    all_rows = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            logger.info(f"Opened PDF: {pdf_path} ({len(pdf.pages)} pages)")

            # Strategy 1: If report has Table 6 (full project directory, pages 54+), extract all
            if len(pdf.pages) >= 50:
                table_6_rows = _parse_table_6(pdf)
                if table_6_rows:
                    logger.info(f"Extracted {len(table_6_rows)} full project records from Table 6.")
                    return table_6_rows

            # Strategy 2: Fallback to overview tables in first 28 pages
            max_pages = min(28, len(pdf.pages))
            current_context = {"ministry": "", "sector": ""}
            for page_num in range(1, max_pages + 1):
                page = pdf.pages[page_num - 1]
                ctx = _extract_page_context(page)
                if ctx["ministry"]:
                    current_context["ministry"] = ctx["ministry"]
                if ctx["sector"]:
                    current_context["sector"] = ctx["sector"]
                tables = page.extract_tables()
                for table in tables:
                    rows = _process_table(table, page_num, current_context)
                    all_rows.extend(rows)
    except Exception as exc:
        logger.error(f"Error parsing PDF {pdf_path}: {exc}", exc_info=True)
        return []

    logger.info(f"Extracted {len(all_rows)} project rows from {pdf_path}")
    return all_rows


def _process_table(table: list[list], page_num: int, page_context: dict | None = None) -> list[dict]:
    """
    Attempt to detect column headers and extract project rows from a table.
    Returns empty list if table does not match expected Flash Report structure.
    """
    if not table or len(table) < 2:
        return []

    # Find header row (first row with recognizable column names)
    header_row_idx = None
    column_map = {}

    for row_idx, row in enumerate(table[:5]):  # Check only first 5 rows for headers
        mapping = _detect_column_mapping(row)
        if len(set(mapping.values()) & MIN_REQUIRED_COLUMNS) == len(MIN_REQUIRED_COLUMNS):
            header_row_idx = row_idx
            column_map = mapping
            break

    if header_row_idx is None:
        logger.debug(f"Page {page_num}: No recognizable Flash Report table header found.")
        return []

    # Validate we have minimum required columns
    found_cols = set(column_map.values())
    if not MIN_REQUIRED_COLUMNS.issubset(found_cols):
        logger.warning(
            f"Page {page_num}: Table has header but missing required columns. "
            f"Found: {found_cols}. Required: {MIN_REQUIRED_COLUMNS}. "
            "This may indicate a schema change in the Flash Report."
        )
        return []

    logger.debug(f"Page {page_num}: Found project table with columns: {found_cols}")

    # Extract data rows
    rows = []
    for row in table[header_row_idx + 1:]:
        if not row or all(cell is None or str(cell).strip() == "" for cell in row):
            continue
        record = _extract_row(row, column_map, table[header_row_idx])
        if record and _looks_like_project_row(record):
            record = _enrich_record(record, page_context)
            rows.append(record)

    return rows


def _detect_column_mapping(header_row: list) -> dict:
    """
    Map column indices to canonical field names by matching header text.
    Returns {col_index: canonical_field_name}.
    """
    mapping = {}
    if not header_row:
        return mapping

    for col_idx, cell in enumerate(header_row):
        if cell is None:
            continue
        cell_lower = str(cell).strip().lower()
        for canonical_name, patterns in EXPECTED_COLUMNS.items():
            if any(p in cell_lower for p in patterns):
                if canonical_name not in mapping.values():  # first match wins
                    mapping[col_idx] = canonical_name
                break

    return mapping


def _extract_row(row: list, column_map: dict, header_row: list) -> dict | None:
    """Extract a single project row into a dict using the column mapping."""
    if len(row) < len(header_row):
        # Pad row if shorter than header
        row = list(row) + [None] * (len(header_row) - len(row))

    record = {}
    for col_idx, canonical_name in column_map.items():
        if col_idx < len(row):
            val = row[col_idx]
            record[canonical_name] = str(val).strip() if val is not None else ""
        else:
            record[canonical_name] = ""

    return record


def _looks_like_project_row(record: dict) -> bool:
    """
    Heuristic check: does this look like a real project row?
    Filters out subtotals, headers repeated mid-table, blank rows.
    """
    name = record.get("name", "")
    if not name or len(name) < 5:
        return False
    # Skip rows that look like repeated headers or summary rows
    skip_patterns = ["total", "subtotal", "grand total", "ministry", "sector", "sl.no"]
    if any(p in name.lower() for p in skip_patterns):
        return False
    # Must have at least a cost value
    cost = record.get("approved_cost", "").replace(",", "").strip()
    if cost:
        try:
            float(cost)
        except ValueError:
            pass  # Non-numeric cost — still include, validator will handle
    return True
