# TokenMeter Growth Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand TokenMeter into a source-backed AI pricing intelligence utility with model/provider detail pages, history, shareable scenarios, presets, savings optimization, budget planning, price-change discovery, and complete SEO infrastructure.

**Architecture:** Keep the existing Next.js + TypeScript modular monolith. Current pricing continues through the resilient PostgreSQL -> trusted snapshot path; historical pricing is PostgreSQL-only and degrades explicitly when unavailable so snapshot fallback never fabricates history. Pricing/budget/optimizer math remains pure domain code using decimal-safe arithmetic; routes compose feature loaders and UI only.

**Tech Stack:** Next.js 16.3.8, React 19.3, TypeScript 6, PostgreSQL 17, Drizzle ORM + postgres.js, decimal.js, Zod, Vitest + Testing Library + PGlite, Playwright, Node 24, systemd, Caddy.

**Spec:** `docs/superpowers/specs/2026-10-05-token-meter-growth-pack-design.md`

## Global Constraints
- Work only in `D:\Project\FrontEnd\token-meter`; do not use the default workspace.
- Commit and push every completed patch directly to `master` using `type(scope): message`.
- No Docker, Compose, Kubernetes, Redis, queue, microservice, or OCI Object Storage in this phase.
- Production remains native Node 24 + systemd + Caddy + PostgreSQL 17 on OCI.
- Every public monetary claim must retain an official provider source URL and verification timestamp.
- Do not backfill historical pricing from memory, third-party summaries, or inferred dates.
- Query-string scenarios contain aggregate numeric workload only; never prompts, keys, identifiers, or private text.
- UI stays in the existing “precision metering console” visual language and passes QA-3.

## File Structure
- `src/domain/pricing/*`: pricing history diff, alternative billing math, budget inverse math; no React/DB imports.
- `src/application/ports/pricing-history-repository.ts`: PostgreSQL-only history contract.
- `src/infrastructure/repositories/*`: history persistence/factory while existing resilient repository remains current-price only.
- `src/features/models`, `providers`, `history`: detail DTO/loaders/components.
- `src/features/compare`, `presets`: share URL normalization and transparent workload presets.
- `src/features/optimizer`, `budget`: client-facing tools backed by domain functions.
- `src/app/*`: dynamic routes, metadata, sitemap, robots, composition.

## Review Focus
- Malformed/oversized compare query values must normalize to safe defaults without SSR crashes; pin in Task 3 tests.
- Re-verifying identical prices or changing metadata only must emit no price-change event; pin in Task 1 tests.
- DB history outage must leave current model/provider content working while history says unavailable; pin in Task 2 tests.
- Cache/batch optimization must be unavailable when any required published rate is absent, never interpreted as zero/free; pin in Task 4 tests.
- Zero/missing unit cost or enormous budget inputs must return bounded unavailable/error results, never Infinity/NaN; pin in Task 5 tests.

---

### Task 1: History-safe pricing foundation

**Files:**
- Modify: `src/domain/pricing/types.ts`
- Create/Test: `src/domain/pricing/pricing-history.ts`, `pricing-history.test.ts`
- Create: `src/application/ports/pricing-history-repository.ts`
- Create: `src/infrastructure/repositories/postgres-pricing-history-repository.ts`
- Create: `src/infrastructure/repositories/create-pricing-history-repository.ts`
- Test: `src/infrastructure/repositories/postgres-pricing-history-repository.integration.test.ts`
- Modify: `src/infrastructure/db/schema.ts`, `seed-rows.ts`, `src/infrastructure/repositories/postgres-row-mappers.ts` and tests
- Create: next Drizzle migration under `drizzle/`
- Modify only with first-party evidence: `src/data/pricing-snapshot.ts`

**Interfaces:**
- Add `effectiveFromBasis: "verified" | "official"` to `ModelPricing`; current `KNOWN_VALID_FROM` records use `verified`, explicitly announced future effective dates use `official`.
- Produce `PricingHistoryRepository.listPricingHistory(modelId: string): Promise<ModelPricing[]>` ordered oldest -> newest.
- Produce `derivePricingChanges(history: readonly ModelPricing[]): PriceChangeEvent[]`; each event groups changed rate dimensions for a like-for-like context band.
- Current `PricingRepository` and snapshot fallback contract stay unchanged.

- [ ] Write RED tests for date basis, history order, compatible context-band matching, added/removed dimensions, percentage delta, identical re-verification producing zero events, and future official dates.
- [ ] Run targeted tests and confirm failures are the missing history/date-basis behavior.
- [ ] Add backward-compatible `effective_from_basis` DB column with default `verified`; generate migration and update mapper/seed types.
- [ ] Implement PostgreSQL history query/hydration and factory returning `null` when DB is not configured; never add snapshot history fallback.
- [ ] Implement `derivePricingChanges` with Decimal math and deterministic ordering.
- [ ] Verify first-party pricing before adding any historical/batch values; persist only evidence-backed records and mark date basis correctly.
- [ ] Run PGlite migration/history integration, then `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] Commit/push `feat(history): add source-backed pricing history`.

### Task 2: Model and provider intelligence pages

**Files:**
- Create: `src/features/history/load-model-history.ts`
- Create: `src/features/models/load-model-detail.ts`, `model-detail.tsx`
- Create: `src/features/providers/load-provider-detail.ts`, `provider-detail.tsx`
- Create: `src/app/models/[modelSlug]/page.tsx`
- Create: `src/app/providers/[providerSlug]/page.tsx`
- Modify: `src/app/models/page.tsx`, `src/app/globals.css`
- Test: feature loader/component tests + dynamic route tests

**Interfaces:**
- `loadModelDetail(slug, asOf?)` returns model, provider, current pricing, related models, and `{ status: "ready"|"unavailable", records, changes }` history state.
- `loadProviderDetail(slug, asOf?)` returns provider, active/preview models with current pricing and bounded recent change events.
- Unknown slugs use Next `notFound()`; metadata generation uses the same factual DTO.

- [ ] Write RED tests for known detail DTOs, unknown slug 404, provider filtering, dynamic metadata, and DB-history failure with current pricing still present.
- [ ] Implement loaders using resilient current reads plus optional PostgreSQL history; history failure must not fail the page.
- [ ] Build model detail: current band table, source/verified strip, date-semantics/history rail, calculator preselected to one model, provider/related links.
- [ ] Build provider detail: current model matrix, statuses, calculate/compare actions, recent changes when available.
- [ ] Link catalogue identities to detail routes and add responsive instrument/data-sheet styling.
- [ ] Run targeted tests + full gate.
- [ ] Commit/push `feat(content): add model and provider intelligence pages`.

### Task 3: Shareable scenarios and workload presets

**Files:**
- Create/Test: `src/features/compare/comparison-state.ts`
- Create/Test: `src/features/presets/workload-presets.ts`
- Modify/Test: `src/features/calculator/calculator.tsx`
- Modify/Test: `src/app/compare/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Define `CalculatorScenario { modelSlugs, inputText, outputText, cachedText, contextText, presetSlug }`.
- Produce `parseComparisonSearchParams(params, allowedModelSlugs): CalculatorScenario` and `serializeComparisonScenario(scenario): URLSearchParams`.
- Presets expose `slug`, `name`, transparent calculator values, and disclaimer; manual edits set preset to `custom`.
- Calculator accepts `initialScenario` and emits valid changes through `onScenarioChange?`.

- [ ] Write RED tests for duplicate/unknown/max-four models, malformed/oversized quantities, omitted defaults, stable serialization, and five preset values/editability.
- [ ] Implement pure state codec using existing `parseTokenQuantity` bounds; ignore arbitrary extra URL fields.
- [ ] Refactor Calculator without changing cost behavior so all inputs + selection initialize from a scenario.
- [ ] Parse `/compare` search params; client uses `history.replaceState` after valid edits and restores back/forward state.
- [ ] Add preset selector and accessible “Copy share link” using canonical `/compare` URL.
- [ ] Verify URL state contains no prompt/free-text/private fields and canonical metadata remains `/compare`.
- [ ] Run targeted tests + full gate.
- [ ] Commit/push `feat(compare): add shareable scenarios and presets`.

### Task 4: Cache and batch savings optimizer

**Files:**
- Create/Test: `src/domain/pricing/calculate-optimization.ts`
- Create/Test: `src/features/optimizer/optimizer-panel.tsx`
- Modify/Test: `src/features/calculator/calculator.tsx`
- Modify: `src/app/globals.css`
- Modify pricing snapshot only when verified first-party batch rates exist.

**Interfaces:**
- Produce `calculateCacheOptimization(workload, band): OptimizationResult | null`; baseline prices all input at regular rate, optimized cost prices the declared cached subset at cache rate.
- Produce `calculateBatchOptimization(workload, band): OptimizationResult | null`; require published batch input/output rates and return null for cached workloads unless a comparable batch-cache dimension exists.
- `OptimizationResult` contains baseline, optimized, absolute savings, percentage savings, and semantic limitation copy.

- [ ] Write RED tests for supported cache savings, zero-cache workload, missing cache rate, supported batch, missing batch dimension, cached+batch incompatibility, selected long-context band, and decimal precision.
- [ ] Implement pure Decimal optimizer math; never synthesize discount percentages.
- [ ] Verify official batch prices before populating batch fields; leave unavailable when evidence is insufficient.
- [ ] Add subordinate optimizer UI per model result and explicitly label asynchronous batch semantics.
- [ ] Run targeted interaction tests + full gate.
- [ ] Commit/push `feat(optimizer): add cache and batch savings insights`.

### Task 5: Budget-to-usage calculator

**Files:**
- Create/Test: `src/domain/pricing/calculate-budget.ts`
- Create/Test: `src/features/budget/budget-calculator.tsx`
- Create: `src/features/budget/load-budget-models.ts`
- Create: `src/app/budget/page.tsx`
- Modify: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/app/globals.css`

**Interfaces:**
- Produce `solveTokenMixBudget(budgetUsd, workloadUnit, band): BudgetScaleResult | null`.
- Produce `solveRequestBudget(budgetUsd, perRequestWorkload, band): RequestBudgetResult | null`; headline request count is floored to a whole bigint.
- Feature DTO carries pricing ID/source/verified date; domain functions calculate quantities only.

- [ ] Write RED tests for token-mix scaling, request-floor rounding, cache mix, context-band usage, zero budget, zero/missing rates, negative/invalid budget and extreme bounded inputs.
- [ ] Implement Decimal-safe inverse calculation by computing one workload-unit/request cost then dividing budget; return null for non-positive or unsupported cost.
- [ ] Build client-local `/budget` instrument with model, mode, budget, composition/request controls and source-backed result metadata.
- [ ] Add “Compare this workload” using Task 3 serializer.
- [ ] Add navigation and responsive styling.
- [ ] Run targeted tests + full gate.
- [ ] Commit/push `feat(budget): add budget to usage calculator`.

### Task 6: Pricing change feed and SEO discovery

**Files:**
- Create/Test: `src/features/history/load-price-changes.ts`
- Create: `src/app/changes/page.tsx`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Create/Test: `src/features/seo/metadata.ts`
- Modify: `src/app/layout.tsx`, route metadata as needed
- Modify: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/app/globals.css`
- Test: changes/SEO route tests

**Interfaces:**
- `loadPriceChanges({ limit, providerId? })` enriches Task 1 events with model/provider identity and returns newest-first bounded output; DB failure returns unavailable, never snapshot-derived history.
- Sitemap contains only durable paths: home, models, model slugs, provider slugs, compare, budget, changes, about, privacy.
- Query-string scenarios canonicalize to `/compare`.

- [ ] Write RED tests: real future Gemini transition emits changed dimensions; unchanged re-verification is absent; feed limit deterministic; sitemap excludes query variants; robots allows public pages; canonicals use configured site origin.
- [ ] Implement `/changes` as a pricing ledger using verified/effective wording from `effectiveFromBasis`, old/new rates, delta, source and model link.
- [ ] Add sitemap/robots without external provider calls and factual metadata helpers for dynamic routes.
- [ ] Add only truthful JSON-LD where schema semantics fit; never fake ratings/reviews/benchmarks.
- [ ] Add provider -> model -> compare/budget -> changes internal links without pairwise X-vs-Y route explosion.
- [ ] Run targeted tests + full gate.
- [ ] Commit/push `feat(seo): add pricing changes and discovery metadata`.

### Task 7: QA-3, OCI migration, deploy, and final verification

**Files:**
- Modify source/tests only for defects proven during QA.
- Reuse `ops/deploy.ps1` / `ops/release.sh`; no container tooling.

**Interfaces:**
- Produces a verified production release at `https://token-meter.158.180.59.36.sslip.io` through the existing migrate -> seed -> build -> health-gated symlink switch.

- [ ] Run fresh local gate: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, production dependency audit.
- [ ] Exercise real-browser journeys: model detail -> calculator -> share/reload; provider -> history/changes; preset -> edit -> optimizer; budget -> compare.
- [ ] QA 1440x1000, 1280x800, 390x844 and tablet where layout changes; inspect hierarchy, overflow, touch targets, tabular price alignment and ad-slot stability.
- [ ] Verify keyboard/focus, accessible names/live announcements, reduced motion, back/forward scenario restoration, console and network errors.
- [ ] Fix each confirmed Critical/Important defect with RED -> GREEN regression coverage; commit/push each completed patch as `fix(<scope>): <message>`.
- [ ] Deploy latest clean `master`; migration runs before switch and remains backward-compatible with production rows.
- [ ] Verify HTTPS for `/`, `/models`, representative model/provider details, `/compare` deep link, `/budget`, `/changes`, `/sitemap.xml`, `/robots.txt`, `/api/health`.
- [ ] Verify service active/enabled, Next `127.0.0.1:3002`, PostgreSQL `127.0.0.1:5432`, sane migration/data counts, and no secrets in output.
- [ ] Confirm `HEAD == origin/master` and clean working tree; report production release/commit and evidence.
