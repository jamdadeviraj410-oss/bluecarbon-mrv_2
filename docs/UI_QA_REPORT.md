# BlueCarbon MRV Registry UI Quality Audit Report

This report audits the currently completed BlueCarbon screens against the Google Stitch source of truth, focusing on concrete UI issues regarding responsiveness, structure, components, and missing implementations.

## 1. Organizations Module
- **Screen/Page**: Organization Dashboard (`/organization/dashboard`), Organization Projects (`/organization/projects`), Organization Evidence Upload (`/organization/evidence/upload`)
- **Visible Problem**: Navigating to these organization-specific routes renders a generic `Placeholder` page rather than the completed UI elements.
- **Expected Stitch Behavior**: The Organization views should connect to the completed Dashboard, Projects, and MRV interfaces adapted for the NGO/Panchayat roles.
- **Priority**: High
- **Suggested File**: `src/routes/AppRoutes.jsx` (Lines 94-98)

## 2. Blockchain Module
- **Screen/Page**: Blockchain Records Page (`/admin/blockchain`)
- **Visible Problem**: The Data Table uses `min-w-[640px]` inside a wrapper. While it handles basic horizontal overflow, the table lacks sticky headers (`sticky top-0`), which degrades usability when scrolling vertically through a long list of transaction hashes.
- **Expected Stitch Behavior**: Data tables should have a unified sticky header structure across the application to ensure column context remains visible.
- **Priority**: Medium
- **Suggested File**: `src/features/blockchain/BlockchainRecordsPage.jsx` (Line 261)

## 3. Carbon Credits Module
- **Screen/Page**: Carbon Credits Inventory (`/admin/carbon-credits`)
- **Visible Problem**: The layout uses `min-w-[800px]` on the table. In some smaller tablet viewpoints, the KPI cards directly above the table stack awkwardly or contain floating single-word text due to missing `min-w-0` on their flex items.
- **Expected Stitch Behavior**: KPI items should shrink gracefully or stack cleanly to one column without orphan words wrapping uncomfortably.
- **Priority**: Medium
- **Suggested File**: `src/features/carbonCredits/CarbonCreditsPage.jsx`

## 4. Reports Module
- **Screen/Page**: Reports Page (`/admin/reports`)
- **Visible Problem**: KPI stat blocks use fixed `min-w-[150px]` inside a flex layout. On mobile (375px), these do not fit side-by-side cleanly and can cause horizontal overflow or overlapping borders.
- **Expected Stitch Behavior**: Should use fluid CSS grid (`grid-cols-2` on mobile) instead of `flex` with fixed minimum widths.
- **Priority**: High
- **Suggested File**: `src/features/reports/ReportsPage.jsx` (Lines 210, 227, 246, 262)

## 5. Auth Module
- **Screen/Page**: Login Page (`/login`), Forgot Password (`/forgot-password`)
- **Visible Problem**: The layout relies on exact pixel measurements (e.g., `w-[500px]` background blur circle and `max-w-[440px]` containers). On very small mobile devices, padding is cramped and the background elements bleed or cause scrollbars.
- **Expected Stitch Behavior**: Background decorative elements should be restrained with `overflow-hidden` at the page level, and form containers should use standard Tailwind breakpoints with `w-full px-4` logic.
- **Priority**: Low
- **Suggested File**: `src/pages/auth/Login.jsx` (Line 70)

## 6. Public Registry Module
- **Screen/Page**: Public Registry Page (`/public`)
- **Status**: ✅ FIXED (Negative margins and duplicated footer removed)
- **Previous Visible Problem**: Overlapping `z-index` and negative margins (`-mt-10 sm:-mt-12`) cause the main content container to obscure interactive elements below the hero section on specific responsive breakpoints.
- **Expected Stitch Behavior**: Proper spacing strategy without relying heavily on negative margins for overlapping hero headers.
- **Priority**: Medium
- **Suggested File**: `src/features/publicRegistry/PublicRegistryPage.jsx` (Line 149)
