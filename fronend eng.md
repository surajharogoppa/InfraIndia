# Frontend Engineering Task

## InfraIndia — Government Project Intelligence Platform

You are a senior frontend engineer and UI/UX engineer.

I have already built the backend and core functionality for **InfraIndia**, a Government Project Intelligence Platform. Your job is to take the existing frontend codebase and turn it into a **production-quality, professional, responsive data-intelligence SaaS application**.

The primary focus of this task is:

* Frontend engineering
* UI/UX improvement
* Layout architecture
* Mobile compatibility
* Responsive design
* Reusable components
* Data visualization
* Accessibility
* Loading/error/empty states
* Consistent design system
* Professional dashboard experience

Do **NOT** rebuild the backend unless absolutely necessary.

---

# 1. FIRST: INSPECT THE EXISTING PROJECT

Before changing anything:

1. Inspect the complete frontend folder structure.
2. Identify:

   * React version
   * Vite configuration
   * Tailwind configuration
   * Routing
   * API service layer
   * Existing components
   * Existing pages
   * Existing charts
   * Existing map implementation
   * Existing state management
   * Existing responsive behavior
3. Identify what is already working.
4. Do NOT unnecessarily replace working functionality.
5. Reuse existing components wherever practical.
6. Identify duplicated UI patterns and refactor them into reusable components.
7. Identify broken layouts, overflow issues, inconsistent spacing, and desktop-only assumptions.

Before implementing major changes, understand the current architecture.

---

# 2. PRIMARY DESIGN GOAL

**InfraIndia** should look like a modern **government data intelligence / enterprise analytics SaaS platform**.

It should NOT look like:

* A generic admin template
* A basic CRUD dashboard
* A Bootstrap-style website
* A simple government portal
* A visually overloaded analytics dashboard

The visual direction should be:

> Clean + Professional + Data-rich + Trustworthy + Modern + Minimal + Enterprise

Use strong visual hierarchy and whitespace.

---

# 3. DESIGN LANGUAGE

Create a consistent design system.

## General Style

Use:

* Clean cards
* Subtle borders
* Moderate border radius
* Consistent spacing
* Professional typography
* Subtle shadows
* Clear hierarchy
* Minimal visual noise
* Consistent iconography

Avoid:

* Excessive gradients
* Excessive shadows
* Huge rounded containers
* Excessive animations
* Random colors
* Inconsistent border radius
* Inconsistent spacing
* Too many decorative elements

---

# 4. APPLICATION SHELL

Create a consistent application shell.

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│                         TOP HEADER                           │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│   SIDEBAR     │               MAIN CONTENT                   │
│               │                                              │
│ Dashboard     │                                              │
│ Projects      │                                              │
│ Map           │                                              │
│ Analytics     │                                              │
│ Compare       │                                              │
│ Sources       │                                              │
│ AI Assistant  │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

The sidebar should contain:

* Dashboard
* Projects
* Map Explorer
* Analytics
* Compare
* Data Sources
* AI Assistant

Optional bottom items:

* Settings
* User profile

---

# 5. SIDEBAR

Build a professional collapsible sidebar.

Desktop:

* Expanded state
* Collapsed state
* Smooth width transition
* Icons always visible
* Tooltips in collapsed state
* Active route indicator

Suggested widths:

```text
Expanded: 240–260px
Collapsed: 68–76px
```

Do not make the sidebar unnecessarily wide.

The main content must automatically adjust to the sidebar width.

---

# 6. MOBILE SIDEBAR

On mobile:

Do NOT keep the desktop sidebar permanently visible.

Use:

```text
Mobile Header
     ↓
Menu button
     ↓
Slide-over navigation
```

The sidebar should become an off-canvas drawer.

Requirements:

* Hamburger/menu button
* Overlay
* Slide-in animation
* Close button
* Clicking navigation item closes drawer
* Clicking overlay closes drawer
* No horizontal overflow
* Body should not scroll behind drawer

---

# 7. GLOBAL HEADER

Create a clean application header.

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Page Title / Breadcrumb              Search   Notifications │
└─────────────────────────────────────────────────────────────┘
```

Mobile:

```text
┌────────────────────────────────────┐
│ ☰   InfraIndia       🔍   Profile │
└────────────────────────────────────┘
```

Header should remain usable at all viewport sizes.

---

# 8. RESPONSIVE DESIGN REQUIREMENTS

The application MUST be fully responsive.

Test at minimum:

```text
320px
375px
390px
414px
640px
768px
1024px
1280px
1440px
1920px
```

Do not only make the application responsive by reducing widths.

The layout itself must adapt.

---

# 9. MOBILE-FIRST PRINCIPLE

For every page ask:

> "How should this information behave on a 375px screen?"

Then progressively enhance for tablet and desktop.

Never assume:

```text
width >= 1024px
```

---

# 10. MOBILE DASHBOARD

Desktop dashboard may have:

```text
4 KPI cards in one row
```

Mobile:

```text
┌───────────────┐
│ Total Projects│
│ 12,482        │
└───────────────┘

┌───────────────┐
│ Total Cost    │
│ ₹XX Lakh Cr   │
└───────────────┘
```

Use:

```text
1 column
```

or:

```text
2 columns
```

depending on viewport width and content.

Never allow KPI text to overflow.

---

# 11. DASHBOARD PAGE

Create a polished InfraIndia dashboard with:

## Header

```text
Government Project Intelligence

Monitor public infrastructure projects,
costs, progress and historical changes.

[Last updated: ...]
```

## KPI Row

Include:

* Total Projects
* Total Project Cost
* Total Expenditure
* Average Progress
* Active Projects
* Completed Projects

## Main Analytics

Suggested layout:

```text
┌─────────────────────────────┬──────────────────────┐
│ Projects by State           │ Progress Distribution│
│                             │                      │
│          Chart              │       Chart          │
│                             │                      │
└─────────────────────────────┴──────────────────────┘

┌─────────────────────────────┬──────────────────────┐
│ Projects by Sector          │ Project Cost         │
│                             │                      │
│          Chart              │       Chart          │
└─────────────────────────────┴──────────────────────┘
```

Mobile:

Each chart becomes a full-width card.

---

# 12. KPI CARD

Create a reusable:

```text
<StatCard />
```

Props:

```text
title
value
subtitle
icon
trend
trendLabel
description
loading
```

Example:

```text
Total Projects
12,482

↑ 4.8%
vs previous period
```

Do not display a trend unless the backend actually provides enough data to calculate it.

---

# 13. PROJECT EXPLORER

Create a professional project discovery page.

Header:

```text
Projects

Explore government projects across
ministries, states and sectors.

[ Search projects... ]
```

Filters:

```text
State
District
Ministry
Department
Sector
Status
Cost
Progress
Year
```

Desktop:

Filters can appear in a horizontal toolbar or filter sidebar.

Mobile:

Filters should open in a drawer/modal.

Do NOT create a huge vertical filter form on mobile.

---

# 14. PROJECT TABLE

Desktop should use a professional data table.

Columns:

```text
Project
Organization
Location
Sector
Cost
Progress
Completion
Status
```

Features:

* Sticky table header
* Horizontal scroll where necessary
* Row hover
* Clear column hierarchy
* Sorting
* Pagination

Do NOT squeeze 8 columns into a 375px screen.

---

# 15. MOBILE PROJECT LIST

On mobile, transform the table into cards.

Example:

```text
┌─────────────────────────────────┐
│ Bengaluru Infrastructure        │
│ Karnataka · Roads               │
│                                 │
│ ₹620 Cr          54%            │
│ ███████████░░░░                 │
│                                 │
│ Completion: Jun 2027            │
│                                 │
│ View Project →                  │
└─────────────────────────────────┘
```

Use a responsive component strategy rather than simply forcing the desktop table to scroll.

---

# 16. PROJECT DETAIL PAGE

This is one of the most important pages.

Structure:

```text
Breadcrumb
↓
Project Header
↓
Summary Cards
↓
Progress + Financial Overview
↓
Timeline
↓
Cost History
↓
Progress History
↓
Change History
↓
Documents
↓
Source Information
```

---

# 17. PROJECT HEADER

Example:

```text
← Projects

Bengaluru Infrastructure Project

Karnataka · Roads
Ministry / Department

[Follow Project] [Compare]
```

Show:

* Project name
* Location
* Sector
* Organization
* Source
* Last updated date

---

# 18. PROJECT SUMMARY CARDS

Use reusable cards:

```text
Original Cost
₹500 Cr

Current Cost
₹620 Cr

Expenditure
₹310 Cr

Physical Progress
54%
```

Mobile:

Cards should stack or use a 2-column grid.

---

# 19. PROGRESS VISUALIZATION

Create a professional progress card.

```text
Physical Progress

54%

████████████░░░░░░░░

Last updated:
15 Sep 2026
```

Use a clear visual distinction between:

* reported value
* calculated value

---

# 20. FINANCIAL ANALYTICS

Create a reusable financial card.

Display:

```text
Original Cost
₹500 Cr

Current Cost
₹620 Cr

Expenditure
₹310 Cr

Cost Change
+24%

Expenditure Ratio
50%
```

Calculated metrics must be clearly marked if they come from frontend/backend calculations rather than the source.

---

# 21. HISTORICAL CHARTS

Create clean responsive charts.

Charts should:

* Have readable labels
* Have useful tooltips
* Adapt to mobile
* Avoid unnecessary legends
* Avoid excessive grid lines
* Handle missing data gracefully

Never render charts with fixed widths/heights that break responsive layouts.

Use responsive containers.

---

# 22. PROJECT TIMELINE

Build a reusable timeline:

```text
2023
● Project Approved

2024
● Project Started

2025
● Progress Updated

2026
● Completion Revised
```

Desktop can use a horizontal timeline if appropriate.

Mobile should become vertical:

```text
2023 ●
     │
     │
2024 ●
     │
     │
2025 ●
     │
     │
2026 ●
```

---

# 23. CHANGE HISTORY

Make change events visually understandable.

Example:

```text
Cost Changed

₹550 Cr
   ↓
₹620 Cr

+₹70 Cr
+12.7%

15 Jul 2026
```

Other event types:

* Progress changed
* Expenditure changed
* Completion date changed
* Status changed

Use consistent badges/icons.

---

# 24. MAP EXPLORER

Create a dedicated map page.

Desktop:

```text
┌──────────────────────────────┬───────────────────────┐
│                              │                       │
│          INDIA MAP           │ Project Details       │
│                              │                       │
│                              │ Karnataka             │
│                              │ 327 Projects          │
│                              │ ₹XX Cr                │
│                              │                       │
└──────────────────────────────┴───────────────────────┘
```

Mobile:

```text
Map
↓
Filters
↓
Selected Project / State Details
```

Do not make the map unusably small on mobile.

---

# 25. ANALYTICS PAGE

Create an analytics workspace.

Possible sections:

```text
Overview
States
Sectors
Ministries
Cost Analysis
Progress Analysis
Historical Changes
```

Use tabs or segmented navigation.

Charts should be consistent across the application.

---

# 26. COMPARISON PAGE

Users can select projects and compare them.

Desktop:

```text
Metric            Project A    Project B    Project C
------------------------------------------------------
Cost              ₹500 Cr      ₹620 Cr      ₹350 Cr
Progress          50%          54%          40%
Expenditure       ₹250 Cr      ₹310 Cr      ₹140 Cr
Completion        2027         2028         2026
```

Mobile:

Turn each project into a stacked comparison section or allow horizontal scrolling.

Do NOT make text unreadably small.

---

# 27. DATA SOURCE PAGE

Create a trustworthy source-information page.

Display:

```text
Data Sources

PAIMANA
MoSPI

Status:
Healthy

Last Successful Sync:
15 Sep 2026

Records:
1,824

Update Frequency:
Periodic

[View Source]
```

Use clear source attribution throughout the application.

---

# 28. AI ASSISTANT PAGE

Create a modern AI interface.

Example:

```text
┌────────────────────────────────────────────┐
│ InfraIndia Assistant                      │
│                                            │
│ Ask questions about project data...        │
│                                            │
│ "Show Karnataka road projects above        │
│ ₹500 crore"                                │
│                                            │
│ [ Ask ]                                    │
└────────────────────────────────────────────┘
```

Example suggested prompts:

```text
Show projects in Karnataka

Projects above ₹1,000 crore

What changed in this project?

Compare road and railway projects
```

AI responses should present:

* Clear answer
* Tables where appropriate
* Source references
* Relevant project links

---

# 29. LOADING STATES

Every async page/component needs a loading state.

Use skeletons rather than blank screens.

Examples:

```text
DashboardSkeleton
ProjectTableSkeleton
ProjectDetailSkeleton
ChartSkeleton
MapSkeleton
```

Avoid showing:

```text
Loading...
```

everywhere.

---

# 30. ERROR STATES

Create reusable error UI.

Example:

```text
Unable to load projects

Something went wrong while retrieving
project information.

[Try Again]
```

Do not expose raw backend stack traces to users.

---

# 31. EMPTY STATES

Examples:

```text
No projects found

Try changing your filters or search query.

[Clear Filters]
```

Provide a useful action.

---

# 32. DESIGN TOKENS

Create centralized design tokens.

For example:

```text
spacing
borderRadius
fontSize
fontWeight
shadows
colors
```

Do not scatter arbitrary values throughout components.

Use Tailwind configuration or CSS variables where appropriate.

---

# 33. TYPOGRAPHY

Use a professional modern sans-serif font.

Establish hierarchy:

```text
Page title
Section heading
Card title
Body
Secondary text
Caption
```

Avoid overly large headings that consume most of the mobile viewport.

---

# 34. COLORS

Use a restrained professional palette.

Suggested semantic colors:

```text
Primary
Neutral
Success
Warning
Danger
Info
```

Do not assign random colors to charts.

Create a consistent chart color system.

Important:

* Green = positive/success only when semantically appropriate
* Red = warning/problem only when semantically appropriate
* Neutral colors for ordinary categories

Do not imply judgment about a government project through arbitrary colors.

---

# 35. ACCESSIBILITY

Implement:

* Semantic HTML
* Keyboard navigation
* Focus states
* Accessible buttons
* Accessible form labels
* ARIA only where needed
* Sufficient color contrast
* Tooltips that are keyboard accessible
* Screen-reader-friendly status information

Do not rely on color alone to communicate status.

---

# 36. RESPONSIVE BREAKPOINT STRATEGY

Use a consistent breakpoint strategy.

Example:

```text
< 640px
Mobile

640–767px
Large mobile

768–1023px
Tablet

1024–1279px
Desktop

1280+
Large desktop
```

Do not create dozens of arbitrary breakpoints.

---

# 37. RESPONSIVE RULES

For every component:

### Cards

Desktop:

```text
grid columns
```

Mobile:

```text
1 column
```

### Tables

Desktop:

```text
full table
```

Mobile:

```text
card layout or horizontal scrolling
```

### Sidebar

Desktop:

```text
persistent
```

Mobile:

```text
drawer
```

### Filters

Desktop:

```text
toolbar/sidebar
```

Mobile:

```text
filter drawer
```

### Charts

Desktop:

```text
2-column grid
```

Mobile:

```text
1-column stack
```

---

# 38. HORIZONTAL OVERFLOW

There must be no accidental horizontal page scrolling.

Audit:

```text
body
main
header
sidebar
cards
tables
charts
maps
modals
```

Use `overflow-x-hidden` only when appropriate.

Do not use it to hide actual layout problems.

---

# 39. MOBILE TOUCH TARGETS

Interactive elements should be comfortable to tap.

Avoid tiny buttons.

Use appropriately sized touch targets for:

* Navigation
* Buttons
* Filters
* Pagination
* Dropdowns
* Table actions
* Map controls

---

# 40. ROUTING

Ensure routes are clean.

Suggested:

```text
/
/dashboard
/projects
/projects/:id
/map
/analytics
/compare
/sources
/ai
/settings
```

Handle:

```text
404
Invalid project ID
Missing data
API error
```

---

# 41. URL STATE

Where useful, keep filters in the URL.

Example:

```text
/projects?state=karnataka&sector=roads&minCost=5000000000
```

Benefits:

* Shareable searches
* Browser back/forward
* Refresh persistence

---

# 42. API INTEGRATION

Use the existing API layer.

Do NOT duplicate API calls inside random components.

Centralize API methods:

```text
projectService
analyticsService
sourceService
aiService
```

Handle:

* Loading
* Success
* Error
* Empty
* Retry

---

# 43. COMPONENT ARCHITECTURE

Create a clear component hierarchy.

Example:

```text
components/
├── ui/
│   ├── Button
│   ├── Card
│   ├── Badge
│   ├── Modal
│   ├── Skeleton
│   └── EmptyState
│
├── common/
│   ├── AppShell
│   ├── Sidebar
│   ├── GlobalHeader
│   ├── Breadcrumbs
│   └── PageHeader
│
├── dashboard/
│   ├── StatCard
│   ├── ProjectOverviewChart
│   ├── StateChart
│   └── SectorChart
│
├── projects/
│   ├── ProjectCard
│   ├── ProjectTable
│   ├── ProjectFilters
│   ├── ProjectHeader
│   ├── ProjectFinancialCard
│   ├── ProjectProgressCard
│   ├── ProjectTimeline
│   └── ProjectChangeLog
│
└── analytics/
```

Adapt this to the existing codebase instead of blindly replacing its structure.

---

# 44. REUSABILITY RULE

Before creating a new component, ask:

> Is this pattern likely to appear more than once?

If yes, create a reusable component.

Avoid duplicated:

* Cards
* Buttons
* Badges
* Filters
* Headers
* Tables
* Loading states
* Empty states

---

# 45. STATE MANAGEMENT

Inspect the existing state-management strategy first.

Do not introduce Redux/Zustand/etc. unless the existing architecture actually needs it.

Prefer simple patterns when possible:

* React state
* Context where appropriate
* URL state for filters
* Existing server/API state management

Avoid unnecessary complexity.

---

# 46. PERFORMANCE

Optimize:

* Large project tables
* Charts
* Maps
* Images
* API calls
* Re-renders

Use:

* Pagination
* Memoization where useful
* Lazy loading
* Code splitting for large pages
* Debounced search
* Cached API responses where appropriate

Do not prematurely optimize every component.

---

# 47. SEARCH UX

Search should support:

* Debouncing
* Loading state
* Empty state
* Clear button
* Keyboard interaction
* Recent search state if useful

Example:

```text
Search projects...

⌕ Bengaluru Metro
⌕ Karnataka roads
```

---

# 48. FILTER UX

Desktop:

```text
State [Karnataka]
Sector [Roads]
Cost [₹500 Cr+]
Progress [50%+]

[Clear all]
```

Mobile:

```text
[ Filters (3) ]
```

Opening filters should show a bottom sheet or drawer.

---

# 49. DATA FRESHNESS

Every page that depends on data should make freshness understandable.

Example:

```text
Data updated:
15 Sep 2026

Source:
MoSPI / Official Government Source
```

Avoid presenting old data as live/current without indicating the date.

---

# 50. PROFESSIONAL DETAILS

Add small quality improvements:

* Breadcrumbs
* Hover states
* Focus states
* Tooltips
* Copy buttons for IDs
* Relative dates where useful
* Exact dates in details
* Consistent number formatting
* Currency formatting
* Percentage formatting
* Empty-state icons
* Smooth but restrained transitions

---

# 51. NUMBER FORMATTING

Create reusable formatters.

Examples:

```text
₹500 Cr
₹1,240 Cr
₹2.4 Lakh Cr
54%
1,824 projects
```

Do not duplicate number-formatting logic throughout components.

---

# 52. DATE FORMATTING

Use a consistent format.

Example:

```text
15 Sep 2026
```

For detailed information:

```text
15 September 2026
```

Do not display ambiguous dates like:

```text
09/10/26
```

---

# 53. UI CONSISTENCY AUDIT

After implementation, inspect every page and ensure:

* Same sidebar
* Same header
* Same card radius
* Same spacing
* Same typography
* Same buttons
* Same badges
* Same loading states
* Same empty states
* Same responsive behavior

The application should feel like one product, not several independently designed pages.

---

# 54. DO NOT BREAK EXISTING FUNCTIONALITY

Important:

Before modifying a page:

1. Understand what it currently does.
2. Preserve existing API integrations.
3. Preserve working routes.
4. Preserve working business logic.
5. Preserve existing data structures unless there is a strong reason to change them.
6. Do not replace backend functionality with mock data.
7. Do not hardcode values that should come from the API.

---

# 55. DO NOT USE MOCK DATA IF REAL API DATA EXISTS

If the existing backend already returns data:

> Use the real API.

Do not create hardcoded arrays just to make the UI look populated.

If an API field is missing, handle the missing field gracefully.

---

# 56. IMPLEMENTATION PROCESS

Follow this order:

## Step 1

Inspect the entire frontend.

## Step 2

Create an architecture/layout assessment.

Identify:

```text
Existing
Broken
Missing
Duplicated
Needs refactor
```

## Step 3

Implement global application shell.

## Step 4

Implement design system and reusable UI components.

## Step 5

Fix dashboard.

## Step 6

Fix project explorer.

## Step 7

Fix project details.

## Step 8

Fix analytics.

## Step 9

Fix map.

## Step 10

Fix comparison.

## Step 11

Fix source page.

## Step 12

Fix AI interface.

## Step 13

Perform responsive audit.

## Step 14

Perform accessibility audit.

## Step 15

Perform performance audit.

---

# 57. FINAL RESPONSIVE QA

Before considering the task complete, test:

```text
320px
375px
390px
414px
768px
1024px
1280px
1440px
1920px
```

Check:

* Sidebar
* Header
* Dashboard
* KPI cards
* Charts
* Tables
* Filters
* Project details
* Timeline
* Map
* Comparison
* Modals
* Dropdowns
* AI interface

There must be:

* No clipped content
* No overlapping elements
* No broken charts
* No accidental horizontal scrolling
* No unreadable text
* No buttons outside viewport
* No fixed-width desktop components on mobile

---

# 58. FINAL QUALITY BAR

The final **InfraIndia** application should feel like a serious production SaaS product.

A user should be able to open the application and immediately understand:

1. What InfraIndia does.
2. How many projects are being tracked.
3. Where projects are located.
4. What their reported progress is.
5. What they cost.
6. How project information changed over time.
7. Where the data came from.

The UI should communicate:

> **Trustworthy data + clear analytics + professional engineering.**

---

# 59. FINAL INSTRUCTION

Do not simply "make the existing UI prettier."

Perform a proper frontend engineering pass.

You should:

* Inspect
* Refactor
* Build reusable components
* Establish design consistency
* Improve information hierarchy
* Improve responsive behavior
* Improve accessibility
* Improve loading/error/empty states
* Optimize performance
* Preserve existing functionality
* Use real backend data
* Remove unnecessary duplication
* Fix layout bugs

At the end, provide a concise implementation report containing:

```text
1. Pages updated
2. Components created
3. Components refactored
4. Responsive improvements
5. Accessibility improvements
6. Performance improvements
7. API integration changes
8. Remaining issues
9. Recommended next frontend improvements
```

Do not stop after implementing only the dashboard.

The entire **InfraIndia** frontend should be brought to a consistent production-quality standard.
