# PAIMANA Data Source — Technical Research Report

## Summary

**Official URL:** https://ipm.mospi.gov.in/

**Organization:** Ministry of Statistics and Programme Implementation (MoSPI),  
Infrastructure and Project Monitoring Division (IPMD)

**Platform Name:** PAIMANA — Project Assessment, Infrastructure Monitoring and  
Analytics for Nation-building (replaced legacy OCMS system in 2023)

**Last Verified:** 2026-09-17

---

## Data Access Method

### Primary Public Access: Monthly PDF Flash Reports

The only verified, publicly accessible data mechanism is the **Monthly Flash Report on
Central Sector Infrastructure Projects (≥ ₹150 crore)** published on `https://mospi.gov.in`.

- **Format:** PDF (structured tables)
- **Frequency:** Monthly (typically published 1–2 months after the reference period)
- **Location:** mospi.gov.in → Publications → Infrastructure & Project Monitoring
- **Stable URL:** Not available — served dynamically through a React SPA

### PAIMANA Portal: NOT Publicly Accessible

| Issue | Status |
|---|---|
| SSL Certificate | ❌ Expired (`ERR_CERT_DATE_INVALID`) as of 2026-09-17 |
| Authentication | ❌ Required — Ministry/Department login only |
| Public API | ❌ No publicly documented REST API |
| Bulk Download without Login | ❌ Not available |

The PAIMANA portal APIs are used internally between government ministries via the
DPIIT IIG-PMG integration but are **not accessible to the public**.

---

## Available Fields (Verified from Flash Report PDFs)

| Field | Available | Column Name in PDF | Notes |
|---|---|---|---|
| Project Name | ✅ | "Name of Project" | Full project title |
| Ministry / Department | ✅ | "Ministry/Deptt." | May be abbreviated |
| Sector | ✅ | "Sector" | e.g., Road, Railway, Power |
| State | ✅ | "State" | Standard state names |
| Original / Sanctioned Cost | ✅ | "Approved Cost (₹ Cr)" | In Crore |
| Latest Revised Cost | ✅ | "Latest Revised Cost (₹ Cr)" | In Crore |
| Cumulative Expenditure | ✅ | "Cumm. Expenditure (₹ Cr)" | In Crore |
| Original Completion Date | ✅ | "Date of Compl. (Orig.)" | Mon-YY format |
| Revised Completion Date | ✅ | "Date of Compl. (Rev.)" | Mon-YY format |
| Status category | ✅ | Implied by table section | New / Ongoing / Delayed |
| Physical Progress (%) | ⚠️ Partial | "Physical Progress" | Present in detailed annexures only, not all tables |
| Project ID / External ID | ❌ | — | Not published in public PDFs |
| District | ❌ | — | Not in Flash Reports |
| Contractor / Agency | ❌ | — | Not in public PDFs |
| Latitude / Longitude | ❌ | — | Not published |
| Financial Progress (%) | ✅ | Derived | Expenditure / Revised Cost × 100 |

---

## Update Frequency

- **Monthly** — reference month published approx. 6–8 weeks later
- Example: "June 2026 Flash Report" published in August 2026

---

## Project Identifier Strategy

Since PAIMANA does not publish external project IDs in Flash Reports, the platform
uses a composite matching key:

```
match_key = SHA-256(project_name.strip().lower() + "|" + ministry.lower() + "|" + state.lower())
```

- If the match_key exists in DB → update existing project
- If not → create new project
- If project_name matches but ministry/state differ → create DataQualityIssue (low-confidence match)

---

## Historical Data Availability

- **Machine-readable history:** Not available — no public API with historical snapshots
- **PDF archive:** mospi.gov.in maintains an archive of past Flash Reports (PDFs)
- **Platform history:** Accumulated via periodic sync — each monthly PDF import creates a new `ProjectSnapshot`

---

## Coverage

- **Scope:** Central sector infrastructure projects with sanctioned cost ≥ ₹150 crore
- **Approximate count:** 1,800–2,000 ongoing projects at any given time
- **Excludes:** State government projects, projects < ₹150 crore

---

## Connector Implementation

The platform implements the Flash Report data via:

1. **Primary:** `SampleFlashReportCSVConnector` — reads a CSV that mirrors exact Flash Report
   column structure (for immediate testability and CI)
2. **Production:** `MoSPIFlashReportPDFConnector` — parses real PDF Flash Reports using
   `pdfplumber` with graceful schema-change handling

---

## Terms / Usage Considerations

- Data is published by Government of India under the National Data Sharing and
  Accessibility Policy (NDSAP)
- Openly accessible for public use with attribution to MoSPI/IPMD
- No scraping restrictions on public-facing content
- Do NOT access PAIMANA portal programmatically (requires government credentials)

---

## Access Limitations

1. No stable URL for automated PDF download (page uses React SPA dynamic routing)
2. Flash Reports lag 6–8 weeks behind real-time project status
3. Physical progress % not consistently available in all Flash Report editions
4. Project names may vary slightly between monthly editions (typos, abbreviations)
5. Ministry names are sometimes abbreviated inconsistently

---

## References

- MoSPI IPMD official page: https://mospi.gov.in/ipmd
- PAIMANA portal: https://ipm.mospi.gov.in/
- PIB press release on PAIMANA launch: https://pib.gov.in/
- National Data Sharing Policy: https://data.gov.in/
