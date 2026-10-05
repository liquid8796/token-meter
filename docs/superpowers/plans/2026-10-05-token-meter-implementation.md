# TokenMeter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a production-ready TokenMeter AI model/API cost calculator with source-backed pricing data, model comparison, SEO pages, PostgreSQL persistence, and native OCI deployment.

**Architecture:** Next.js + TypeScript modular monolith. Pure pricing domain logic is separated from application use cases, infrastructure adapters, and feature UI. PostgreSQL is the primary store with a version-controlled fallback snapshot. Deployment matches the existing OCI VM pattern: systemd + Caddy + local PostgreSQL, no containers.

**Tech Stack:** Next.js 16.x, React 19.x, TypeScript, PostgreSQL 17, Drizzle ORM + postgres.js, decimal.js, Zod, Vitest + Testing Library, Playwright, native Node 24, systemd, Caddy.

**Spec:** `docs/superpowers/specs/2026-10-05-token-meter-design.md`

## Global Constraints
- Work in `D:\Project\FrontEnd\token-meter`; never use the default workspace.
- Commit/push every completed patch to `master` with `type(scope): message`.
- No Docker, Docker Compose, Kubernetes, or container assumptions.
- Production target is Ubuntu 24.04 + Node 24 + Caddy + PostgreSQL 17 + systemd.
- Pricing records shown publicly must include official source URL and verification timestamp.
- Calculator monetary math must use decimal-safe arithmetic.
- UI direction is “precision metering console,” not generic purple-gradient AI SaaS.
- QA depth is QA-3 with real rendered desktop/mobile verification.

## Review Focus
- Very large or malformed token quantities must fail safely without NaN/Infinity or browser lockup; covered in Task 2 domain tests.
- A pricing dimension absent for a model must stay unavailable rather than being silently treated as free; covered in Task 2 tests and Task 5 UI tests.
- PostgreSQL outage must preserve trustworthy public read-only pricing through the bundled snapshot; covered in Task 4 integration tests.
- Compare state with unknown/duplicate model slugs must normalize deterministically and never crash SSR; covered in Task 6 tests.
- Mobile calculator/comparison layout must not create page-level horizontal overflow and must retain keyboard/focus semantics; covered in Task 8 browser QA.

---

### Task 1: Project foundation and test harness

**Files:**
- Create: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.gitignore`, `.env.example`, `README.md`
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Produces the build/test/runtime conventions consumed by all later tasks.

- [ ] Scaffold Next.js/TypeScript configuration without Docker files.
- [ ] Add Vitest/Testing Library/Playwright scripts: `test`, `test:watch`, `test:e2e`, `lint`, `build`, `typecheck`.
- [ ] Write `page.test.tsx` first asserting TokenMeter identity and calculator-first heading exist; run and observe RED.
- [ ] Implement minimal root layout/page/global tokens to make the test GREEN.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] Commit/push `chore(app): scaffold tokenmeter foundation`.

### Task 2: Pure pricing domain

**Files:**
- Create: `src/domain/pricing/types.ts`
- Create: `src/domain/pricing/quantity.ts`
- Create: `src/domain/pricing/calculate-cost.ts`
- Create: `src/domain/pricing/compare-costs.ts`
- Create: `src/domain/pricing/format.ts`
- Test: `src/domain/pricing/*.test.ts`

**Interfaces:**
- Produces `parseTokenQuantity(input: string): bigint`.
- Produces `calculateModelCost(workload: Workload, pricing: Pricing): CostBreakdown`.
- Produces `compareCosts(results: CostBreakdown[]): ComparedCost[]`.
- Uses string/Decimal representations for money; no infrastructure imports.

- [ ] Write failing quantity tests for raw integers, K/M/B suffixes, decimals, whitespace, negatives, malformed strings, and configured upper bound.
- [ ] Implement quantity parsing minimally; verify RED→GREEN.
- [ ] Write failing cost tests for input/output, cached input, missing dimensions, zero workload, and precision-sensitive cases.
- [ ] Implement decimal-safe calculation using `decimal.js`; verify full suite.
- [ ] Write failing comparison tests for cheapest model, equal-cost tie, savings delta, and deterministic ordering.
- [ ] Implement comparison and formatting helpers; run full suite/build.
- [ ] Commit/push `feat(pricing): add cost calculation domain`.

### Task 3: Verified pricing snapshot and repository contract

**Files:**
- Create: `src/data/pricing-snapshot.ts`
- Create: `src/application/ports/pricing-repository.ts`
- Create: `src/infrastructure/repositories/snapshot-pricing-repository.ts`
- Test: `src/infrastructure/repositories/snapshot-pricing-repository.test.ts`

**Interfaces:**
- Produces `PricingRepository` methods: `listProviders()`, `listModels(filter?)`, `getModelBySlug(slug)`, `getProviderBySlug(slug)`, `getCurrentPricing(modelId, asOf?)`.
- Snapshot records match domain types and carry `sourceUrl` + `verifiedAt`.

- [ ] Verify current official pricing/model details for the initial OpenAI, Anthropic, and Google set from first-party docs; record source URLs and verification date in data.
- [ ] Write repository contract tests first for provider/model lookup, current pricing, status filtering, and absent record behavior.
- [ ] Implement the immutable snapshot repository; run tests.
- [ ] Add a source-validation test that rejects shipped price records without official HTTPS source + verification date.
- [ ] Run full suite/build.
- [ ] Commit/push `feat(data): add verified pricing snapshot`.

### Task 4: PostgreSQL persistence and resilient repository

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/infrastructure/db/schema.ts`
- Create: `src/infrastructure/db/client.ts`
- Create: `src/infrastructure/db/migrate.ts`
- Create: `src/infrastructure/db/seed.ts`
- Create: `src/infrastructure/repositories/postgres-pricing-repository.ts`
- Create: `src/infrastructure/repositories/resilient-pricing-repository.ts`
- Create: `src/infrastructure/repositories/create-pricing-repository.ts`
- Create: `src/app/api/health/route.ts`
- Test: corresponding repository/health tests

**Interfaces:**
- Consumes `PricingRepository` and snapshot data from Task 3.
- Produces a repository factory using PostgreSQL when healthy and snapshot fallback for public reads.
- Produces safe `GET /api/health` response `{ status, database }` without credentials/host details.

- [ ] Write schema/repository tests first using an isolated test DB when `DATABASE_URL_TEST` exists and pure contract/fallback tests otherwise.
- [ ] Define providers/models/model_pricing tables, constraints, indexes, and decimal columns.
- [ ] Implement migration and idempotent seed from snapshot.
- [ ] Implement PostgreSQL repository to satisfy the same contract.
- [ ] Write failing fallback tests for DB read error; implement resilient repository.
- [ ] Write failing health tests for ready/degraded state; implement route.
- [ ] Run tests/typecheck/lint/build.
- [ ] Commit/push `feat(database): persist pricing with postgres`.

### Task 5: Calculator product surface and design system

**Files:**
- Create: `src/features/calculator/components/*`
- Create: `src/features/calculator/use-calculator.ts`
- Create: `src/features/calculator/calculator.test.tsx`
- Create: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/ad-slot.tsx`
- Modify: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Consumes snapshot/public model pricing DTOs and Task 2 calculation functions.
- Produces a client-local calculator with selected model(s), workload parsing, live breakdown, cheapest delta, and verification metadata.

- [ ] Write UI tests first: changing input/output updates results; cache control only appears where supported; invalid input preserves last valid output; max selected models is enforced.
- [ ] Implement compact semantic design tokens and responsive shell matching the “precision metering console” contract.
- [ ] Build workload controls, accessible model selector, live total, proportional component rail, breakdown, source/verified affordance, and reserved disabled ad slot.
- [ ] Add restrained interaction motion with `prefers-reduced-motion` fallback using CSS/React primitives unless a dependency is genuinely needed.
- [ ] Run component suite and build.
- [ ] Render locally and perform a first visual correction pass at 1440×1000 and 390×844.
- [ ] Commit/push `feat(calculator): build live ai cost meter`.

### Task 6: Model catalog, compare, detail routes, and SEO

**Files:**
- Create: `src/features/models/*`, `src/features/compare/*`
- Create: `src/app/models/page.tsx`, `src/app/models/[modelSlug]/page.tsx`
- Create: `src/app/providers/[providerSlug]/page.tsx`, `src/app/compare/page.tsx`
- Create: `src/app/about/page.tsx`, `src/app/privacy/page.tsx`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Test: route/helper/component tests for filters, URL compare state, metadata helpers, 404 behavior

**Interfaces:**
- Consumes `PricingRepository` and calculator components.
- Produces indexable catalog/provider/model routes and URL-serialized comparison state.

- [ ] Write failing search/filter tests and compare-state normalization tests (duplicates, unknown slugs, max four).
- [ ] Implement catalog and compare UI with deliberate mobile behavior.
- [ ] Write route data/metadata tests first, then model/provider pages with source-backed current pricing and embedded calculator.
- [ ] Implement standard 404 behavior for unknown slugs.
- [ ] Add canonical metadata, sitemap, robots, and truthful structured data only where valid.
- [ ] Add methodology/about and privacy copy matching actual telemetry/ads configuration.
- [ ] Run full tests/build.
- [ ] Commit/push `feat(content): add model pricing and comparison pages`.

### Task 7: Native OCI deployment assets

**Files:**
- Create: `ops/token-meter.service`
- Create: `ops/token-meter.caddy`
- Create: `ops/deploy.ps1` (local Windows→OCI orchestration)
- Create: `ops/release.sh` (VM-side release switch/health/rollback)
- Create: `ops/bootstrap.sql` or documented DB bootstrap commands without embedded secrets
- Modify: `.env.example`, `README.md`
- Test: `ops/*.test.*` where practical plus shell/config validation commands

**Interfaces:**
- Deployment creates `/opt/token-meter/releases/<release-id>`, switches `/opt/token-meter/current`, restarts `token-meter.service`, validates `/api/health`, and rolls back symlink/service on failed health.

- [ ] Write validation checks first for forbidden Docker artifacts, required systemd hardening fields, localhost bind, and Caddy reverse proxy target.
- [ ] Implement native systemd service running as dedicated `token-meter` user.
- [ ] Implement Caddy vhost for `token-meter.158.180.59.36.sslip.io` by default with security headers compatible with Next.js.
- [ ] Implement release packaging/deploy script using SSH/SCP, no credentials committed.
- [ ] Implement health-gated rollback logic.
- [ ] Validate shell syntax/Caddy config template and run repo quality gates.
- [ ] Commit/push `ops(deploy): add native oci release workflow`.

### Task 8: QA-3, production deploy, and final verification

**Files:**
- Modify tests/source only for confirmed defects found during QA.
- Save temporary screenshots/logs outside tracked source or in gitignored QA workspace.

**Interfaces:**
- Produces a verified production release at the configured public hostname.

- [ ] Run full local gate: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] Start production build locally and exercise the critical browser journey with real input.
- [ ] QA 1440×1000, 1280×800, 390×844 and tablet if needed; inspect screenshots for hierarchy, overflow, typography, controls, and ad-slot stability.
- [ ] Test keyboard focus/order, reduced motion, accessible names, validation/error states, deep links/back-forward, and refresh restoration where applicable.
- [ ] Inspect console/network for unexplained errors and run performance/Lighthouse smoke if available.
- [ ] Fix Critical/Important findings using RED→GREEN tests and rerun the same QA evidence.
- [ ] On OCI: create dedicated DB/user and `token-meter` service user without exposing secrets; deploy release under `/opt/token-meter`; migrate/seed; install systemd/Caddy config; validate Caddy before reload.
- [ ] Verify HTTPS page, `/api/health`, pricing source links, calculator journey, model detail, compare deep link, service status, and DB localhost binding on production.
- [ ] Confirm git working tree clean and `master` matches `origin/master`.
- [ ] Commit/push any final fix as `fix(release): address production qa findings` (only if changes exist).
