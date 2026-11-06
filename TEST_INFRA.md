# E2E Test Suite Infrastructure & Architecture

## Overview
This document defines the architecture, testing methodology, execution instructions, and quality thresholds for the **Wahidiyah Book Monorepo E2E Test Suite**.

The test suite provides **opaque-box, requirement-driven verification** across all 36 features spanning the four primary subsystems:
1. **Landing Page Web Application** (`landing-page/` / `src/`)
2. **Admin Dashboard Web Application** (`admin-dashboard-web/` / `src/features/admin/`)
3. **Mobile Application (React Native / Expo SDK 58)** (`mobile-app/`)
4. **Express Backend API & Supabase Architecture** (`server/`)

---

## 4-Tier Testing Methodology

The test suite is structured into four sequential, independent verification tiers:

### Tier 1: Feature Coverage (Opaque-Box Requirement Verification)
- **Scope**: Every single feature from the 36-feature inventory (F1 through F36) is exercised with at least 1 dedicated test case, grouped into 4 categories with >= 5 test cases per category:
  - **Category A (Landing Page & Web Reader)**: F1 (Carousel), F2 (Catalog Grid), F3 (Paywall Modal), F4 (PDF Reader), F5 (DOCX Reader), F6 (Reading Progress), F7 (QRIS Payment), F8 (QR Proxy & SVG), F9 (QRIS Polling), F10 (jsPDF Receipt), F11 (Dual-Channel Auth OTP).
  - **Category B (Admin Dashboard)**: F12 (KPI Cards), F13 (Subscription Donut), F14 (5-Sheet Excel Export), F15 (Direct Storage Upload-Intent), F16 (PDF Page Counting), F17 (User & Role Management), F18 (Monthly Event Calendar), F19 (Web Push Broadcast), F20 (Hero Carousel Management), F21 (System Audit Logs), F22 (Admin RBAC Route Protection).
  - **Category C (Mobile App Replication)**: F23 (Expo Shell & Bottom Tabs), F24 (Editorial Elegan Theme Tokens), F25 (Auth & SecureStore DTO Alignment), F26 (Mobile Catalog Grid & Spine Shadow), F27 (Native Reader Screen Controls), F28 (Anti-Screenshot Guard), F29 (Offline Manuscript Cache & Storage Manifest), F30 (Calendar & Agenda), F31 (Profile & Pro Status), F32 (Expo & EAS Configuration).
  - **Category D (Monorepo & Stability)**: F33 (Dependency Centralization - 1 root package.json / node_modules), F34 (Root Script Orchestration), F35 (Bundler & Tooling Alignment), F36 (Port Alignment & Server Stability).

### Tier 2: Boundary & Corner Cases
- **Scope**: Stress tests, parameter validation boundaries, defensive failure modes, and edge conditions (>= 5 cases per category):
  - **Category A (Landing)**: Empty search query, SQL injection special characters, paywall unauthorized/expired token handling, QRIS 15m expiration boundary, invalid OTP codes.
  - **Category B (Admin)**: Self-demotion prevention (admin cannot revoke own role -> 400), self-deletion prevention (admin cannot delete own account -> 400), PDF byte counting memory limit (>25MB returns null without crash), invalid upload-intent extensions, RBAC unauthorized access rejection (403/401).
  - **Category C (Mobile)**: Corrupted offline cache manifest recovery, reader font size zoom bounds (clamped [12, 26]), anti-screenshot guard teardown on unmount, offline cache deletion and storage reclamation, network timeout fallback.
  - **Category D (Monorepo & Stability)**: Strictly 0 nested `package.json` or `node_modules` in workspace subdirectories, Express security headers (Helmet, CORS, CSP), malformed JSON body handling, clean-ports script validation, rate limiter threshold enforcement on payment routes.

### Tier 3: Cross-Feature Interactions (Pairwise Integration)
- **Scope**: Verifies synchronous and asynchronous interplay between multiple decoupled subsystems:
  - **TC3.1**: Registration -> OTP Verification -> QRIS Charge -> Settlement -> Pro Status Update -> Pro Book Unlock (F11 + F7 + F9 + F17 + F3).
  - **TC3.2**: Direct Storage Upload Intent -> PDF Page Counting -> Catalog Retrieval -> Reader View Access (F15 + F16 + F2 + F4).
  - **TC3.3**: User Role Escalation -> Admin Dashboard RBAC Access -> Self-Demotion Guard Enforcement (F17 + F22 + F12).
  - **TC3.4**: Event Publishing -> Event Retrieval in Public API & Mobile -> Web Push Broadcast Trigger (F18 + F30 + F19).
  - **TC3.5**: Mobile Auth Session -> Offline Manuscript Download -> Offline Cache Verification -> Storage Manifest Persistence (F25 + F29 + F27).
  - **TC3.6**: QRIS Transaction Generation -> Settlement Simulation -> Financial Audit Log Reflection -> Branded 5-Sheet Excel Export (F7 + F9 + F21 + F14).

### Tier 4: Real-World Application Scenarios
- **Scope**: End-to-end, multi-step user and administrative operational flows:
  - **Scenario 1**: The Complete Reader Journey (Discovery -> Catalog search & filter -> Preview -> Paywall encounter -> Registration & OTP -> Pro subscription purchase -> Continuous PDF reading -> Progress memory persistence).
  - **Scenario 2**: The Complete Administrator Operations Cycle (Admin login -> KPI metric inspection -> Book upload intent -> Agenda publication -> Carousel management -> Web Push broadcast -> Financial Excel export -> System audit log verification).
  - **Scenario 3**: The Mobile App Offline-First Lifecycle (Expo configuration validation -> Clean auth initialization -> Theme token compliance -> Catalog sync -> Offline manuscript download -> Anti-screenshot reader guard check -> Storage management & cache purge).
  - **Scenario 4**: Payment Failure & Auto-Reconciliation Workflow (Initiate QRIS order -> Simulated pending state -> 3s polling verification -> Reconcile endpoint recovery -> Fallback SVG display).

---

## Directory Layout & File Organization

```
tests/
└── e2e/
    ├── helpers/
    │   ├── testServer.mjs       # Ephemeral in-memory Express server runner (port 0)
    │   └── testHelpers.mjs      # Shared mock data, assertions, tokens & utilities
    ├── tier1_feature_coverage.test.mjs    # Tier 1: F1-F36 Feature Coverage
    ├── tier2_boundary_corner.test.mjs     # Tier 2: Boundary & Corner Cases
    ├── tier3_cross_feature.test.mjs       # Tier 3: Cross-Feature Interactions
    ├── tier4_real_world_scenarios.test.mjs# Tier 4: Real-World Scenarios
    └── run_all.mjs                        # Unified Master Test Runner
```

---

## Execution Commands

### Run Full E2E Test Suite
```bash
node tests/e2e/run_all.mjs
```

### Run With Native Node Test Runner
```bash
node --test tests/e2e/*.test.mjs
```

### Run Individual Tiers
```bash
node tests/e2e/tier1_feature_coverage.test.mjs
node tests/e2e/tier2_boundary_corner.test.mjs
node tests/e2e/tier3_cross_feature.test.mjs
node tests/e2e/tier4_real_world_scenarios.test.mjs
```

---

## Quality Thresholds & Gates

1. **Pass Rate**: 100% of test assertions must pass without uncaught exceptions or dangling handles.
2. **Execution Time**: The complete test suite executes within < 30 seconds.
3. **Isolation**: Ephemeral HTTP test servers run on OS-assigned free ports (`port: 0`), preventing conflicts with local dev servers on ports 3000, 3001, or 5000.
4. **Opaque-Box Principle**: Zero modifications to application source code under `landing-page/`, `admin-dashboard-web/`, `mobile-app/`, or `server/`.
5. **Monorepo Compliance**: Strict enforcement of single root `package.json` and single root `node_modules`.
