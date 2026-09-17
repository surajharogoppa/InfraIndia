# Government Project Intelligence Platform --- PRD

## 1. Project Overview

**Working Name:** GovProject Intelligence

**Product Type:** Government project data aggregation, tracking,
analytics, and AI platform.

**Primary Country:** India

**Primary Goal:**

Build a web platform that collects publicly available government project
information from official sources, normalizes it into a common data
model, tracks project updates over time, and provides search,
comparison, analytics, maps, historical change detection, and
AI-assisted insights.

The platform is **not an official government service**. It is an
independent technology platform built using publicly available and
permitted data sources.

------------------------------------------------------------------------

# 2. Product Vision

Government project information is often distributed across government
portals, dashboards, spreadsheets, reports, and documents.

The platform should make this information easier to answer:

-   What government projects exist?
-   Where are they located?
-   Which ministry/department owns them?
-   What is their project cost?
-   How much has been spent?
-   What is the reported physical progress?
-   What is the original completion date?
-   What is the current/revised completion date?
-   Has the project cost changed?
-   Has the schedule changed?
-   What changed since the previous update?
-   Which projects belong to a particular state, district, sector, or
    ministry?

The core product principle is:

> **Turn fragmented public government project data into searchable,
> comparable, historical, and understandable project intelligence.**

------------------------------------------------------------------------

# 3. Target Users

## 3.1 Citizens

Users who want to understand government projects in their state,
district, or city.

Example questions:

-   What infrastructure projects are happening in Karnataka?
-   What projects are happening near Bengaluru?
-   What is the reported cost of a project?
-   What is its current reported progress?

## 3.2 Journalists and Researchers

Users who need structured historical project information.

Example questions:

-   Which projects have revised costs?
-   Which projects have revised completion dates?
-   How has project expenditure changed?
-   What changed between two reporting periods?

## 3.3 Business and Contractors

Users interested in government infrastructure activity.

Example questions:

-   What projects are being developed in Karnataka?
-   Which sectors have many active projects?
-   What is the approximate project-value distribution?

## 3.4 Data / Policy Analysts

Users who want aggregated statistics.

Example questions:

-   Compare project counts across states.
-   Compare project values across sectors.
-   Analyze expenditure versus reported progress.

## 3.5 System Administrators

Users responsible for:

-   Data sources
-   Data ingestion
-   Data quality
-   Failed jobs
-   Project records
-   System configuration
-   User administration

------------------------------------------------------------------------

# 4. Product Goals

## Primary Goals

### G1 --- Centralize Public Project Information

Collect government project information from reliable, official, publicly
accessible, and permitted sources.

### G2 --- Normalize Government Data

Convert different source formats into a common internal data model.

### G3 --- Track Project Progress

Track available fields such as:

-   Physical progress
-   Financial expenditure
-   Project cost
-   Revised cost
-   Start date
-   Completion date
-   Revised completion date
-   Source-reported status

### G4 --- Track Historical Changes

Store historical observations instead of simply overwriting old values.

Detect:

-   Cost changes
-   Progress changes
-   Expenditure changes
-   Completion-date changes
-   Status changes

### G5 --- Provide Analytics

Allow analysis by:

-   State
-   District
-   Ministry
-   Department
-   Organization
-   Sector
-   Project value
-   Progress
-   Year

### G6 --- Provide Visual Exploration

Use:

-   KPI cards
-   Charts
-   Tables
-   Timelines
-   Maps
-   Comparison views

### G7 --- Add AI Capabilities

Later versions should support:

-   Natural-language project search
-   AI project summaries
-   Document extraction
-   Semantic search
-   Similar-project discovery
-   AI-assisted analytics

------------------------------------------------------------------------

# 5. Non-Goals

The system must NOT:

-   Claim to be an official government service.
-   Replace official government portals.
-   Present platform calculations as official government
    classifications.
-   Make unsupported allegations about corruption or wrongdoing.
-   Automatically accuse contractors or government departments.
-   Predict project success or failure.
-   Provide confidential/private government information.
-   Scrape restricted information.
-   Ignore source terms, robots rules, access restrictions, or
    applicable data-use conditions.
-   Guarantee complete coverage of every government project in India.

Every important project fact should have source information and an
update date whenever available.

------------------------------------------------------------------------

# 6. Core Product Concept

The main entity is:

`Government Project`

Each project contains:

``` text
Project
├── Basic Information
├── Organization
├── Ministry
├── Department
├── Sector
├── Location
├── Financial Information
├── Timeline
├── Physical Progress
├── Financial Progress
├── Source Status
├── Contractor / Implementing Agency
├── Documents
├── Historical Snapshots
├── Change Events
└── Source Information
```

------------------------------------------------------------------------

# 7. Core User Journey

``` text
Landing Page
    ↓
Dashboard
    ↓
Search / Filter Projects
    ↓
Project Explorer
    ↓
Project Details
    ↓
Historical Changes
    ↓
Compare Projects
    ↓
Analytics
    ↓
AI Assistant
```

------------------------------------------------------------------------

# 8. Main Application Modules

The application should contain:

1.  Dashboard
2.  Project Explorer
3.  Project Details
4.  Project Comparison
5.  Map Explorer
6.  Change Tracking
7.  Analytics
8.  Documents
9.  Data Sources
10. AI Assistant
11. Admin Dashboard

------------------------------------------------------------------------

# 9. Dashboard

## Objective

Provide a high-level overview of government projects.

## KPI Cards

Display:

-   Total Projects
-   Total Project Cost
-   Total Expenditure
-   Average Reported Physical Progress
-   Active Projects
-   Completed Projects
-   Platform-derived Schedule Indicators

Important:

`Delayed`, `On Track`, etc. must not be presented as official government
statuses unless the source explicitly provides those statuses.

If the platform calculates an indicator, label it clearly as:

`Platform-derived indicator`

------------------------------------------------------------------------

# 10. Dashboard Charts

## 10.1 Projects by Sector

Example categories:

-   Roads
-   Railways
-   Power
-   Water
-   Urban Development
-   Healthcare
-   Education
-   Other

## 10.2 Projects by State

Use:

-   Bar chart
-   Map
-   Table

## 10.3 Progress Distribution

Example visualization:

``` text
0–25%
25–50%
50–75%
75–100%
Completed
Unknown
```

## 10.4 Project Cost Distribution

Example ranges:

``` text
< ₹10 Cr
₹10–100 Cr
₹100–500 Cr
₹500–1,000 Cr
> ₹1,000 Cr
```

## 10.5 Projects by Year

Depending on available source fields:

-   Approval year
-   Start year
-   Completion year

Do not mix different date meanings into one metric.

------------------------------------------------------------------------

# 11. Project Explorer

Users should be able to search and filter projects.

## Search Fields

Search by:

-   Project name
-   Project ID
-   Ministry
-   Department
-   Organization
-   Contractor
-   State
-   District
-   Sector

## Filters

-   State
-   District
-   Ministry
-   Department
-   Organization
-   Sector
-   Source status
-   Project value
-   Progress
-   Start year
-   Completion year
-   Last updated date

------------------------------------------------------------------------

# 12. Project Listing

Example:

  Project     State         Sector            Cost   Progress Completion
  ----------- ------------- ---------- ----------- ---------- ------------
  Project A   Karnataka     Roads          ₹450 Cr        62% 2027
  Project B   Maharashtra   Railways     ₹1,200 Cr        81% 2026
  Project C   Telangana     Water          ₹280 Cr        35% 2028

Features:

-   Pagination
-   Sorting
-   Filtering
-   Search
-   Save project
-   Open project details
-   Compare selection

------------------------------------------------------------------------

# 13. Project Detail Page

This is the most important product page.

## Header

Display:

-   Project name
-   Project ID
-   Ministry
-   Department
-   Organization
-   State
-   District
-   Source
-   Source last-updated date
-   Platform ingestion date

## Summary Cards

Display:

``` text
Original Cost
Current / Revised Cost
Expenditure
Physical Progress

Original Start Date
Current Start Date
Original Completion Date
Current Completion Date
```

Only display fields that exist in the source.

------------------------------------------------------------------------

# 14. Project Timeline

Display important available milestones:

``` text
Approval
   ↓
Tender
   ↓
Award
   ↓
Project Start
   ↓
Construction / Execution
   ↓
Revised Completion
   ↓
Completion
```

Not every project will contain every milestone.

Do not invent missing dates.

------------------------------------------------------------------------

# 15. Physical Progress

Display the latest reported physical progress.

Example:

``` text
54%

███████████░░░░░░░░░
```

Also display historical progress when snapshots exist.

Example chart:

``` text
Progress %
100 |
 80 |                    ●
 60 |              ●
 40 |         ●
 20 |    ●
  0 |________________________
      Jan  Apr  Jul  Oct
```

------------------------------------------------------------------------

# 16. Financial Progress

Display:

``` text
Original Cost
Revised / Current Cost
Reported Expenditure
```

Calculate:

``` text
Expenditure Ratio =
Expenditure / Current Cost × 100
```

Clearly distinguish:

-   Source-reported values
-   Platform-calculated metrics

------------------------------------------------------------------------

# 17. Cost Change Tracking

Example:

``` text
Original Cost
₹500 Cr
    ↓
Revision 1
₹550 Cr
    ↓
Revision 2
₹620 Cr
```

Display:

``` text
Original Cost: ₹500 Cr
Current Cost: ₹620 Cr

Absolute Change: ₹120 Cr
Percentage Change: 24%
```

The UI must indicate that the percentage is calculated by the platform.

------------------------------------------------------------------------

# 18. Schedule Change Tracking

Example:

``` text
Original Completion
December 2025

        ↓

Current Completion
June 2026
```

Calculate:

``` text
Schedule Difference = Current Completion - Original Completion
```

Display:

``` text
Original Completion: Dec 2025
Current Completion: Jun 2026
Difference: 6 months
```

Use exact date arithmetic in backend logic rather than approximate
text-only calculations.

------------------------------------------------------------------------

# 19. Project Change History

Example:

``` text
15 Sep 2026
Physical progress changed
48% → 54%

15 Jul 2026
Estimated cost changed
₹550 Cr → ₹620 Cr

10 Apr 2026
Completion date changed
Dec 2025 → Jun 2026
```

Change types:

``` text
COST_CHANGED
PROGRESS_CHANGED
EXPENDITURE_CHANGED
COMPLETION_DATE_CHANGED
START_DATE_CHANGED
STATUS_CHANGED
OTHER_FIELD_CHANGED
```

------------------------------------------------------------------------

# 20. Project Comparison

Users can select 2--5 projects.

Comparison table:

  Metric          Project A   Project B   Project C
  ------------- ----------- ----------- -----------
  Cost              ₹500 Cr     ₹720 Cr     ₹350 Cr
  Expenditure       ₹250 Cr     ₹540 Cr     ₹140 Cr
  Progress              50%         75%         40%
  Start                2023        2022        2024
  Completion           2027        2026        2028

The comparison should present underlying data.

Do not create an overall "best project" score.

------------------------------------------------------------------------

# 21. Map Explorer

Create an interactive India map.

Users can:

``` text
India
 ↓
State
 ↓
District
 ↓
Projects
```

Project marker can display:

-   Project name
-   Sector
-   Cost
-   Progress
-   Source status

Progress colors/categories are platform visualizations and must not be
presented as official government classifications.

------------------------------------------------------------------------

# 22. Analytics Module

## State Analytics

Metrics:

-   Project count
-   Total project cost
-   Total expenditure
-   Average reported progress
-   Projects by sector
-   Projects by status

## Sector Analytics

Metrics:

-   Number of projects
-   Total project cost
-   Total expenditure
-   Average reported progress
-   Project-value distribution

## Ministry Analytics

Metrics:

-   Project count
-   Total cost
-   Expenditure
-   Average progress

## Cost Analytics

Metrics:

-   Average cost
-   Median cost
-   Minimum cost
-   Maximum cost
-   Cost distribution

------------------------------------------------------------------------

# 23. Change Detection Engine

The system must compare the newest project observation against the
previous observation.

Flow:

``` text
New Source Data
    ↓
Extract
    ↓
Normalize
    ↓
Validate
    ↓
Identify Project
    ↓
Load Previous Snapshot
    ↓
Compare Fields
    ↓
Detect Changes
    ↓
Store Snapshot
    ↓
Create Change Events
    ↓
Update Current Project View
```

Example:

``` text
OLD

cost = ₹500 Cr
progress = 42%
completion = 2026-12-31


NEW

cost = ₹550 Cr
progress = 48%
completion = 2027-06-30
```

Detected:

``` text
COST_CHANGED
PROGRESS_CHANGED
COMPLETION_DATE_CHANGED
```

------------------------------------------------------------------------

# 24. Historical Snapshot Architecture

Never simply overwrite important source observations.

Store:

``` text
Project
    ↓
Snapshot 1
Snapshot 2
Snapshot 3
Snapshot 4
```

This allows:

-   Historical charts
-   Change detection
-   "What changed?" reports
-   Data auditing
-   Reproducible analytics

Core principle:

> **Never destroy a historical observation unless there is a deliberate
> data-correction process.**

------------------------------------------------------------------------

# 25. Data Source Strategy

The platform should prioritize:

1.  Official government sources
2.  Official public datasets
3.  Official APIs
4.  Official downloadable CSV/XLSX data
5.  Official reports/documents
6.  Permitted public web data where appropriate

A possible initial source is the MoSPI PAIMANA/IPM ecosystem, which
provides public infrastructure-project monitoring information and
project-level fields such as project cost, revised cost, expenditure,
physical progress and completion-related information.

Additional sources should be added only after verifying:

-   Public accessibility
-   Data format
-   Update frequency
-   Terms of use
-   Technical access rules
-   Whether automated collection is permitted

------------------------------------------------------------------------

# 26. Data Source Registry

Create a database table:

``` text
data_sources
```

Fields:

``` text
id
name
organization
source_type
base_url
access_method
update_frequency
is_active
last_successful_sync
last_failed_sync
created_at
updated_at
```

Example:

``` text
PAIMANA
MoSPI
XLSX / CSV / Public Dashboard
Periodic
Active
```

------------------------------------------------------------------------

# 27. Data Ingestion Architecture

``` text
Government Source
       ↓
Extractor
       ↓
Raw Data Storage
       ↓
Validator
       ↓
Normalizer
       ↓
Deduplicator
       ↓
Canonical Project Records
       ↓
Historical Snapshot
       ↓
Change Detection
       ↓
Analytics
```

------------------------------------------------------------------------

# 28. ETL Pipeline

## Extract

Support:

-   CSV
-   XLSX
-   JSON
-   XML
-   PDF
-   Permitted web data

## Transform

Normalize:

-   Currency
-   Dates
-   State names
-   District names
-   Organization names
-   Sector names
-   Project identifiers
-   Status values

Example:

``` text
500 Crore
₹500 Cr
500 CR
₹5000000000
```

should normalize to:

``` text
5000000000 INR
```

Keep original source values for traceability.

------------------------------------------------------------------------

# 29. Data Validation

Validation rules:

``` text
Project ID must not be null when source provides one.

Project cost >= 0

Expenditure >= 0

Physical progress >= 0

Physical progress <= 100

Dates must use valid date formats.

Known start date should not normally be after completion date.
```

Do not silently reject unusual but potentially valid records. Route
uncertain records to a data-quality workflow.

------------------------------------------------------------------------

# 30. Data Quality Queue

Create:

``` text
Data Quality Queue
```

Example:

``` text
Record #1234

Problem:
Missing project ID

Source:
Government Dataset A

Status:
Needs Review
```

Admin actions:

-   Review
-   Correct
-   Accept
-   Reject
-   Mark duplicate

------------------------------------------------------------------------

# 31. Data Provenance

Every important field should be traceable.

Example:

``` text
Current Project Cost
₹620 Cr

Source:
Official Government Source

Source Updated:
15 Aug 2026

Imported:
17 Aug 2026
```

Where possible, store:

-   Source URL
-   Source document
-   Source publication date
-   Source update date
-   Ingestion timestamp
-   Raw record identifier
-   Source field name

------------------------------------------------------------------------

# 32. Database Design

Core tables:

``` text
projects
ministries
departments
organizations
sectors
states
districts
project_snapshots
project_changes
project_documents
data_sources
ingestion_runs
data_quality_issues
users
saved_projects
saved_searches
alerts
```

------------------------------------------------------------------------

# 33. Projects Table

Suggested fields:

``` text
projects
------------------------------
id
external_project_id
name
description

ministry_id
department_id
organization_id
sector_id

state_id
district_id

original_cost
current_cost
currency

original_start_date
current_start_date

original_completion_date
current_completion_date

current_progress
current_expenditure

source_status
platform_status

source_id

created_at
updated_at
```

Important:

`source_status` = status reported by the source.

`platform_status` = optional platform-derived normalized status.

------------------------------------------------------------------------

# 34. Project Snapshots Table

``` text
project_snapshots
------------------------------
id
project_id

snapshot_date

project_cost
revised_cost
expenditure
physical_progress

start_date
completion_date

source_status

source_id

raw_record_hash

created_at
```

------------------------------------------------------------------------

# 35. Project Changes Table

``` text
project_changes
------------------------------
id
project_id
snapshot_id

change_type
field_name

old_value
new_value

change_amount
change_percentage

detected_at
```

------------------------------------------------------------------------

# 36. Project Documents Table

``` text
project_documents
------------------------------
id
project_id

document_name
document_type

source_url
published_date

document_hash

storage_path
extracted_text

created_at
updated_at
```

------------------------------------------------------------------------

# 37. Ingestion Runs Table

``` text
ingestion_runs
------------------------------
id
source_id

started_at
completed_at

status

records_found
records_inserted
records_updated
records_rejected

error_message
```

Possible statuses:

``` text
RUNNING
SUCCESS
PARTIAL_SUCCESS
FAILED
```

------------------------------------------------------------------------

# 38. API Architecture

Use Django REST Framework.

## Projects

``` http
GET /api/projects/
GET /api/projects/{id}/
GET /api/projects/{id}/history/
GET /api/projects/{id}/changes/
```

## Search

``` http
GET /api/projects/search?q=metro
```

## Filters

``` http
GET /api/projects/?state=karnataka
GET /api/projects/?sector=roads
GET /api/projects/?min_cost=1000000000
GET /api/projects/?progress_min=50
```

## Analytics

``` http
GET /api/analytics/overview/
GET /api/analytics/states/
GET /api/analytics/sectors/
GET /api/analytics/ministries/
GET /api/analytics/costs/
```

## Comparison

``` http
POST /api/projects/compare/
```

------------------------------------------------------------------------

# 39. Frontend Architecture

Recommended structure:

``` text
src/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── projects/
│   ├── analytics/
│   ├── maps/
│   └── ui/
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── ProjectDetails.jsx
│   ├── Compare.jsx
│   ├── MapExplorer.jsx
│   ├── Analytics.jsx
│   └── DataSources.jsx
│
├── services/
│   └── api.js
│
├── hooks/
│
└── utils/
```

------------------------------------------------------------------------

# 40. Reusable UI Components

Use reusable components instead of duplicating UI.

Core components:

``` text
Card
StatCard
SectionHeader
Badge
Tabs
DataTable
SearchInput
Select
FilterPills
DateRangePicker
ProgressBar
Timeline
EmptyState
Skeleton
Modal
```

Project-specific components:

``` text
ProjectCard
ProjectStatusBadge
ProjectProgressCard
ProjectFinancialCard
ProjectTimeline
ProjectChangeLog
ProjectComparisonTable
SourceBadge
```

------------------------------------------------------------------------

# 41. Backend Architecture

Recommended:

``` text
                    React
                      │
                      ↓
                 Django REST
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
      PostgreSQL    Redis       Celery
                                  │
                                  ↓
                           Data Pipeline
                                  │
                  ┌───────────────┼───────────────┐
                  ↓               ↓               ↓
               CSV/XLSX          API        Public Sources
```

Recommended backend packages/services:

-   Django
-   Django REST Framework
-   PostgreSQL
-   Celery
-   Redis
-   pandas
-   openpyxl
-   requests/httpx where permitted
-   BeautifulSoup only where permitted and appropriate
-   PDF extraction library for permitted documents
-   pgvector for semantic search later

------------------------------------------------------------------------

# 42. Scheduled Data Updates

Use Celery for background ingestion.

Generic workflow:

``` text
Scheduled Job
    ↓
Check Source
    ↓
Download / Retrieve Data
    ↓
Validate
    ↓
Normalize
    ↓
Compare
    ↓
Store Snapshot
    ↓
Generate Change Events
    ↓
Update Analytics
```

The schedule must respect each source's actual update frequency.

------------------------------------------------------------------------

# 43. Pipeline Monitoring

Admin dashboard:

``` text
Data Pipeline

Source A
SUCCESS
Last Run: ...
Records: 1,824

Source B
SUCCESS
Last Run: ...
Records: 3,240

Source C
FAILED
Last Run: ...
Error: Source unavailable
```

Show:

-   Last successful run
-   Last failed run
-   Processing time
-   Records found
-   Records inserted
-   Records updated
-   Records rejected
-   Error messages

------------------------------------------------------------------------

# 44. Admin Dashboard

Admin sections:

``` text
Overview
Data Sources
Ingestion Runs
Projects
Data Quality
Documents
Users
System Logs
```

Admin should be able to:

-   Enable/disable data source
-   Run ingestion manually
-   Inspect failed ingestion
-   Review data-quality issues
-   View project history
-   Inspect source metadata

------------------------------------------------------------------------

# 45. AI Assistant --- Phase 2

AI should operate primarily over structured, sourced data.

Example:

User:

> Show projects in Karnataka above ₹500 crore.

AI should convert the request into structured filters:

``` text
state = Karnataka
current_cost > 5000000000
```

Then query the database.

The LLM should not invent project records.

------------------------------------------------------------------------

# 46. AI Project Summary

Example:

``` text
Project Summary

The project was originally reported at ₹500 crore.

The currently reported cost is ₹620 crore.

Reported physical progress is 54%.

The reported completion date changed from
December 2025 to June 2026.

Sources:
Official Government Source
```

AI-generated summaries must retain source references.

------------------------------------------------------------------------

# 47. Natural Language Analytics

Support queries such as:

``` text
How many projects are in Karnataka?

Show projects above ₹1,000 crore.

Show projects with revised completion dates.

Show projects with reported physical progress above 75%.

Compare road and railway projects.

What changed in this project during 2026?

Show projects updated this month.
```

The AI should translate natural language into safe structured queries.

------------------------------------------------------------------------

# 48. AI Document Extraction

Future architecture:

``` text
Government PDF
      ↓
PDF Text Extraction
      ↓
Document Chunking
      ↓
LLM Extraction
      ↓
Structured Fields
      ↓
Validation
      ↓
Human/Data Quality Review
      ↓
Database
```

Possible fields:

``` text
Project Name
Project ID
Cost
Location
Organization
Completion Date
Contractor
Scope
Milestones
Progress
```

Every extracted field should retain a reference to its source document.

------------------------------------------------------------------------

# 49. Semantic Search

Later use:

``` text
PostgreSQL + pgvector
```

Example:

User:

> Find projects similar to metro rail construction.

System:

``` text
Query Embedding
      ↓
Vector Search
      ↓
Relevant Projects
      ↓
Metadata Filtering
      ↓
Results
```

Results should include similarity information and source references.

------------------------------------------------------------------------

# 50. Alerts

Users can follow projects.

Example:

``` text
Follow Project
```

Notify when:

-   Cost changes
-   Completion date changes
-   Progress changes
-   Status changes
-   New project document appears

Example notification:

``` text
Project ABC was updated.

Reported cost:
₹500 Cr → ₹560 Cr

Source:
Official Government Source
```

------------------------------------------------------------------------

# 51. User Accounts

MVP:

-   Public browsing
-   No account required for core project discovery

Later:

``` text
Register
Login
Saved Projects
Saved Searches
Alerts
Personal Dashboard
```

------------------------------------------------------------------------

# 52. Security Requirements

Backend requirements:

-   Secure authentication
-   Role-based access
-   Input validation
-   API rate limiting
-   CSRF protection where applicable
-   Secure environment variables
-   Database permissions
-   Secure file handling
-   Audit logs for admin changes

Never expose:

``` text
Database credentials
LLM API keys
Government/private credentials
Admin secrets
```

------------------------------------------------------------------------

# 53. Data Quality Principles

Government datasets can contain:

-   Missing values
-   Duplicate projects
-   Different spellings
-   Different date formats
-   Changed identifiers
-   Revised costs
-   Inconsistent organization names

Pipeline:

``` text
Raw Data
   ↓
Validation
   ↓
Normalization
   ↓
Entity Resolution
   ↓
Deduplication
   ↓
Canonical Data
```

Always retain original source data where practical and legally
appropriate.

------------------------------------------------------------------------

# 54. Entity Resolution

Potential examples:

``` text
Bangalore
Bengaluru
Bengaluru Urban
```

Do not blindly merge records.

Use:

-   Source project ID
-   Organization
-   Project name
-   Location
-   Dates
-   Cost
-   Other identifying fields

If confidence is low, send the record to manual review.

------------------------------------------------------------------------

# 55. Project Status Model

Use two separate concepts.

## Source Status

``` text
source_status
```

This is exactly what the government source reports.

## Platform Status

``` text
platform_status
```

Optional normalized values:

``` text
PLANNED
ACTIVE
COMPLETED
CLOSED
UNKNOWN
```

Never imply that platform status is an official government status.

------------------------------------------------------------------------

# 56. Platform-Derived Indicators

Possible indicators:

``` text
Cost Change %
Schedule Difference
Expenditure Ratio
Progress Change
Time Since Last Update
```

Example:

``` text
Cost Change %
=
(Current Cost - Original Cost)
/
Original Cost
× 100
```

All derived indicators must be clearly labeled as platform calculations.

------------------------------------------------------------------------

# 57. Performance Requirements

Initial targets:

``` text
Dashboard load:
< 3 seconds

Project search:
< 1 second for common queries

Project details:
< 2 seconds

Analytics:
< 3 seconds
```

Use:

-   Database indexes
-   Pagination
-   Caching
-   Query optimization
-   Pre-aggregated analytics when necessary

------------------------------------------------------------------------

# 58. Mobile Requirements

Support:

-   Desktop
-   Tablet
-   Mobile

Mobile project details should use stacked cards.

Tables should:

-   Horizontally scroll, or
-   Switch to card/list layouts

Charts should resize responsively.

------------------------------------------------------------------------

# 59. MVP Scope

The MVP should NOT attempt to ingest every government source.

## MVP Features

### Data

-   One reliable official government data source
-   Data ingestion
-   Raw record storage
-   Normalization
-   Validation
-   Deduplication

### Database

-   Projects
-   Organizations
-   Ministries
-   Departments
-   Sectors
-   Locations
-   Snapshots
-   Changes
-   Sources

### UI

-   Dashboard
-   Project Explorer
-   Project Details
-   Search
-   Filters
-   Basic analytics
-   Source information

### Historical

-   Project snapshots
-   Change detection
-   Change history

### Admin

-   Data source monitoring
-   Ingestion monitoring
-   Data quality queue

------------------------------------------------------------------------

# 60. Phase 2

Add:

``` text
Interactive India Map
Project Comparison
Advanced Analytics
Documents
PDF Processing
Saved Projects
Saved Searches
Alerts
More Government Sources
```

------------------------------------------------------------------------

# 61. Phase 3 --- AI

Add:

``` text
Natural Language Search
AI Project Summaries
Document Extraction
Semantic Search
Similar Projects
AI Analytics Assistant
```

------------------------------------------------------------------------

# 62. Phase 4 --- Multi-Source Expansion

Expand from central-government infrastructure data to additional
permitted sources.

Potential architecture:

``` text
Central Government
        +
State Government
        +
Infrastructure Agencies
        +
Municipal Sources
        +
Other Official Public Datasets
```

Each source should have its own connector/extractor.

------------------------------------------------------------------------

# 63. Recommended Source Connector Architecture

Create a common interface:

``` python
class BaseProjectSource:
    def fetch(self):
        raise NotImplementedError

    def parse(self, raw_data):
        raise NotImplementedError

    def normalize(self, record):
        raise NotImplementedError

    def validate(self, record):
        raise NotImplementedError
```

Example:

``` text
sources/
├── base.py
├── paimana/
│   ├── extractor.py
│   ├── parser.py
│   ├── normalizer.py
│   └── validator.py
├── source_b/
└── source_c/
```

This makes additional sources easier to add.

------------------------------------------------------------------------

# 64. Recommended Django App Structure

``` text
backend/
├── config/
│
├── apps/
│   ├── projects/
│   ├── organizations/
│   ├── locations/
│   ├── analytics/
│   ├── sources/
│   ├── ingestion/
│   ├── documents/
│   ├── accounts/
│   └── alerts/
│
├── services/
│   ├── change_detection/
│   ├── normalization/
│   ├── deduplication/
│   └── analytics/
│
└── manage.py
```

------------------------------------------------------------------------

# 65. Recommended React Architecture

``` text
frontend/
└── src/
    ├── components/
    │   ├── common/
    │   ├── dashboard/
    │   ├── projects/
    │   ├── analytics/
    │   ├── maps/
    │   └── ui/
    │
    ├── pages/
    ├── services/
    ├── hooks/
    ├── utils/
    ├── constants/
    └── App.jsx
```

------------------------------------------------------------------------

# 66. Development Roadmap

## Sprint 1 --- Foundation

Build:

-   Django
-   PostgreSQL
-   React
-   Tailwind
-   Base layout
-   API structure
-   Environment configuration

## Sprint 2 --- Data Pipeline

Build:

-   Source connector
-   Raw data ingestion
-   Normalization
-   Validation
-   Project database

## Sprint 3 --- Project Explorer

Build:

-   Search
-   Filters
-   Pagination
-   Sorting
-   Project list

## Sprint 4 --- Project Details

Build:

-   Summary
-   Financial information
-   Progress
-   Timeline
-   Source information

## Sprint 5 --- Historical Tracking

Build:

-   Snapshots
-   Change detection
-   Change log
-   Historical charts

## Sprint 6 --- Analytics

Build:

-   Dashboard
-   State analytics
-   Sector analytics
-   Ministry analytics
-   Cost analytics

## Sprint 7 --- Map

Build:

-   India map
-   State filtering
-   District filtering
-   Project markers

## Sprint 8 --- AI

Build:

-   Natural-language search
-   Project summaries
-   Document extraction
-   Semantic search

------------------------------------------------------------------------

# 67. MVP Acceptance Criteria

## Dashboard

-   [ ] Total projects displayed
-   [ ] Total project cost displayed
-   [ ] Total expenditure displayed
-   [ ] Progress analytics displayed
-   [ ] State analytics displayed
-   [ ] Sector analytics displayed
-   [ ] Data freshness displayed

## Project Explorer

-   [ ] Search works
-   [ ] Filters work
-   [ ] Pagination works
-   [ ] Sorting works
-   [ ] Project details open correctly

## Project Details

-   [ ] Project metadata displayed
-   [ ] Financial information displayed
-   [ ] Progress displayed
-   [ ] Completion dates displayed
-   [ ] Source displayed
-   [ ] Last updated date displayed

## Historical Tracking

-   [ ] Snapshots stored
-   [ ] Cost changes detected
-   [ ] Progress changes detected
-   [ ] Completion-date changes detected
-   [ ] Change history displayed

## Data Pipeline

-   [ ] Source connector works
-   [ ] Validation works
-   [ ] Normalization works
-   [ ] Failed jobs recorded
-   [ ] Ingestion metrics recorded

------------------------------------------------------------------------

# 68. Testing Strategy

## Backend

Use:

-   pytest
-   Django TestCase
-   API tests

Test:

``` text
Project creation
Project update
Search
Filtering
Pagination
Change detection
Snapshot creation
Validation
Deduplication
```

## Data Pipeline

Test:

``` text
CSV parsing
XLSX parsing
Date normalization
Currency normalization
Missing values
Duplicate records
Invalid progress
Changed project values
```

## Frontend

Test:

``` text
Dashboard
Filters
Search
Project details
Comparison
Responsive layout
Loading states
Error states
Empty states
```

------------------------------------------------------------------------

# 69. Observability

Track:

``` text
Application logs
API response times
Database errors
Ingestion failures
Source availability
Data-quality errors
AI request failures
```

Create an admin monitoring page.

------------------------------------------------------------------------

# 70. Important Data Principles

## Principle 1 --- Source First

Do not invent government facts.

## Principle 2 --- Historical Data Matters

Do not overwrite previous observations.

## Principle 3 --- Provenance Matters

Users should know where information came from.

## Principle 4 --- Separate Facts from Calculations

Example:

``` text
Source fact:
Reported cost = ₹620 Cr

Platform calculation:
Cost increased by 24%
```

## Principle 5 --- Missing Data Is Valid Data

If a source does not provide a field:

``` text
Unknown / Not Reported
```

Do not guess.

## Principle 6 --- No Unsupported Conclusions

The platform should show data and transparent calculations.

------------------------------------------------------------------------

# 71. Example End-to-End Scenario

User searches:

``` text
Karnataka road projects above ₹500 crore
```

System:

``` text
Search Query
     ↓
API
     ↓
PostgreSQL
     ↓
Filters:
State = Karnataka
Sector = Roads
Cost > ₹500 Cr
     ↓
Results
```

Results:

``` text
Project A
₹800 Cr
64%
Completion: 2027

Project B
₹620 Cr
48%
Completion: 2028

Project C
₹1,200 Cr
81%
Completion: 2026
```

User opens Project A.

System displays:

``` text
Project Overview

Original Cost: ₹700 Cr
Current Cost: ₹800 Cr
Expenditure: ₹500 Cr
Progress: 64%

Original Completion: Dec 2026
Current Completion: Jun 2027
```

Then:

``` text
Change History

Cost:
₹700 Cr → ₹800 Cr

Completion:
Dec 2026 → Jun 2027

Progress:
51% → 64%
```

This is the core product experience.

------------------------------------------------------------------------

# 72. Future Advanced Features

Potential future features:

-   Project news aggregation from official sources
-   Government budget allocation tracking
-   Tender-to-project linking
-   Contractor-to-project relationships
-   Project document repository
-   Procurement intelligence
-   District development dashboards
-   Infrastructure heatmaps
-   Historical state-level trends
-   Public APIs
-   Data export
-   CSV/XLSX export
-   Research workspace

Any cross-source entity linking must include confidence/provenance
information.

------------------------------------------------------------------------

# 73. Tender Integration --- Future Module

A future version can connect:

``` text
Tender
   ↓
Bid / Award
   ↓
Contractor
   ↓
Government Project
   ↓
Project Progress
```

Potential model:

``` text
Tender
├── Tender ID
├── Organization
├── Tender Value
├── Publication Date
├── Closing Date
├── Award Date
└── Contractor

Project
├── Project ID
├── Cost
├── Location
├── Progress
└── Timeline
```

If a reliable relationship between a tender and project cannot be
established, do not automatically link them.

------------------------------------------------------------------------

# 74. AI Architecture --- Future

``` text
                    User
                     ↓
              AI Assistant
                     ↓
             Intent Detection
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   SQL Query     Vector Search   Documents
        ↓            ↓            ↓
        └────────────┼────────────┘
                     ↓
              Verified Results
                     ↓
             LLM Explanation
                     ↓
           Source-backed Answer
```

The AI should never be the source of truth.

The database and original government sources remain the source of truth.

------------------------------------------------------------------------

# 75. Deployment

Recommended initial deployment:

``` text
Frontend
React + Vite
      ↓
Vercel / equivalent

Backend
Django
      ↓
Render / Railway / equivalent

Database
PostgreSQL

Redis
Managed Redis

Worker
Celery Worker

Scheduler
Celery Beat / managed scheduler
```

Production architecture can later move to AWS/GCP/Azure if required.

------------------------------------------------------------------------

# 76. Environment Variables

Example:

``` text
DATABASE_URL=
REDIS_URL=

SECRET_KEY=

OPENAI_API_KEY=
GEMINI_API_KEY=

SOURCE_API_KEY=

STORAGE_BUCKET=
```

Never commit `.env` files.

------------------------------------------------------------------------

# 77. Suggested MVP Technology Stack

## Frontend

``` text
React
Vite
Tailwind CSS
Recharts
React Router
Axios / Fetch
```

## Backend

``` text
Python
Django
Django REST Framework
Celery
Redis
```

## Database

``` text
PostgreSQL
```

## Data Engineering

``` text
pandas
openpyxl
requests/httpx
```

## AI

Later:

``` text
LLM API
pgvector
Embeddings
RAG
```

------------------------------------------------------------------------

# 78. Resume Description

After implementation, a concise resume description could be:

> **Government Project Intelligence Platform** --- Built a Python/Django
> data platform that aggregates publicly available government
> infrastructure-project data, normalizes heterogeneous datasets,
> maintains historical project snapshots, detects cost/schedule/progress
> changes, and provides React-based analytics, geographic visualization,
> and source-backed AI search.

------------------------------------------------------------------------

# 79. Portfolio Description

> A data-driven government project intelligence platform that transforms
> publicly available government infrastructure data into a searchable
> and historical project database. The system uses Python ETL pipelines,
> Django REST APIs, PostgreSQL, React analytics dashboards, scheduled
> ingestion, change detection, geographic visualization, and AI-powered
> natural-language search.

------------------------------------------------------------------------

# 80. Core Architecture Summary

``` text
                    OFFICIAL PUBLIC SOURCES
                              │
                              ↓
                       DATA CONNECTORS
                              │
                              ↓
                         RAW DATA
                              │
                              ↓
                 VALIDATION + NORMALIZATION
                              │
                              ↓
                       DEDUPLICATION
                              │
                              ↓
                       POSTGRESQL
                              │
               ┌──────────────┼──────────────┐
               ↓              ↓              ↓
          CURRENT DATA     SNAPSHOTS     CHANGE EVENTS
               │              │              │
               └──────────────┼──────────────┘
                              ↓
                         DJANGO API
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
         DASHBOARD       PROJECT UI       ANALYTICS
              │               │               │
              └───────────────┼───────────────┘
                              ↓
                       REACT FRONTEND
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                MAP VIEW            AI ASSISTANT
```

------------------------------------------------------------------------

# 81. Final Product Definition

The product should be understood as:

> **A source-backed government project intelligence and historical
> tracking platform.**

The MVP should focus on **one high-quality official source**, excellent
normalization, historical snapshots, change detection, project search,
project details, and analytics.

Do not start by building AI.

Build the reliable data foundation first:

``` text
SOURCE
  ↓
DATA
  ↓
DATABASE
  ↓
HISTORY
  ↓
ANALYTICS
  ↓
UI
  ↓
AI
```

That order is important because the quality of the AI layer will depend
on the quality and provenance of the underlying project data.
