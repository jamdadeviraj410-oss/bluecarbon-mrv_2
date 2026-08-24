# Build Out All Community Pages

All 10 community pages in `src/features/community/pages/` are currently empty stubs showing only "under construction" placeholders. This plan builds each one into a fully-functional, data-rich page that follows the existing design system (Marine Ledger tokens, `Card`, `CardHeader`, `StatusBadge`, `Button`, `PageHeader` components, Tailwind with custom theme).

Each page will use **inline mock data** (same pattern as `CommunityDashboardPage` and `CommunityPortalPage`) — no new service files needed. All pages reuse existing shared components from `src/components/common/`.

---

## Proposed Changes

### 1. CommunityProjectsPage
**What it does:** Grid of community restoration projects with search, status filter, KPI summary cards, and clickable project cards with progress bars.

Mock data: 6 projects with status, area, CO2e estimates, progress percentage, and location.

---

### 2. CommunityMrvVerificationPage
**What it does:** MRV verification pipeline dashboard — shows submission pipeline status with step trackers, a filterable list of MRV submissions with verification status, integrity scores, and a timeline of recent verifier actions.

Mock data: 5 MRV submissions at various stages with hash anchors and auditor notes.

---

### 3. CommunityEvidenceUploadPage
**What it does:** Multi-step evidence upload wizard (similar to the Portal's upload flow but standalone). Includes project selection → file upload (drag/drop zone) → metadata/field notes → review & submit. Also shows a table of recent uploads with status badges.

Mock data: Recent uploads list and project selection options.

---

### 4. CommunityOrganizationsPage
**What it does:** Directory of partner NGOs, panchayats, and project managers working in the community region. Card grid with org name, type, location, active projects count, and contact. Includes search and type filter.

Mock data: 6 partner organizations with roles and stats.

---

### 5. CommunityCarbonCreditsPage
**What it does:** Carbon credit overview for the community — KPI cards (total issued, retired, active), a table of credit batches with vintage year, methodology, status, and available quantities. Includes a visual donut-style breakdown.

Mock data: Stats + 6 credit batches.

---

### 6. CommunityBlockchainRegistryPage
**What it does:** On-chain transaction log — shows blockchain-anchored records with tx hash, block number, timestamp, record type, and verification status. Includes search and type filter. Hash copy-to-clipboard functionality.

Mock data: 8 blockchain transaction records.

---

### 7. CommunityDroneSensorPage
**What it does:** Drone survey gallery with sensor telemetry cards. Top section shows latest drone survey with before/after placeholder. Bottom section shows IoT sensor cards (water salinity, soil moisture, temperature) with trend sparklines using Recharts. Includes survey metadata.

Mock data: 2 drone surveys + 4 sensor readings with sparkline data arrays.

---

### 8. CommunityReportsPage
**What it does:** Report listing with filter by type (Compliance, Impact, MRV Summary, Carbon Credit). Each report card shows title, date, type badge, summary, and download/view actions. Includes a "Generate Report" button and KPI cards for total reports generated.

Mock data: 6 reports of various types.

---

### 9. CommunityAuditTrailPage
**What it does:** Dual-view (table + timeline) audit log filtered to community-level actions. Searchable/filterable table with action type, user, project, timestamp, and blockchain hash. Click a row to see detail in a side panel. Export to CSV button.

Mock data: 10 audit entries reusing the pattern from the admin `AuditTrailPage`.

---

### 10. CommunitySettingsPage
**What it does:** Community-specific settings with tabbed navigation — Profile, Community Details, Notifications, and Preferences. Follows the same pattern as the admin `SettingsPage` with sidebar nav on desktop and dropdown on mobile.

Mock data: Pre-filled form values for a community user.

---

## Design Patterns Used

- **Layout:** `flex flex-col w-full p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto` (matches Dashboard/Portal)
- **Components:** `Card`, `CardHeader`, `StatusBadge`, `Button`, `PageHeader`
- **Typography:** Design system token classes (`font-headline-lg`, `font-body-md`, `font-mono-data`, etc.)
- **Colors:** Marine Ledger palette (`text-primary`, `text-secondary`, `bg-surface-container-lowest`, etc.)
- **Icons:** Material Symbols Outlined
- **Charts:** Recharts (already a dependency) for sparklines/mini charts where needed
- **No new dependencies** — everything is built with what's already installed

## Verification Plan

### Manual Verification
- Run `npm run dev` and navigate to each community route
- Verify all 10 pages render with full content (no blank spaces)
- Check responsive layout on different viewport widths
- Verify interactive elements (filters, tabs, steppers) work correctly

### Build Check
- Run `npm run build` to ensure no compilation errors
