# TokenMeter Growth Pack Design Specification

**Date:** 2026-10-05
**Project:** TokenMeter
**Status:** Proposed for implementation after human review

## Product intent

Extend TokenMeter from a useful calculator into a source-backed AI pricing intelligence utility that earns organic traffic because each page solves a real developer/founder problem. The expansion must increase useful indexable content and repeat utility without turning the product into thin programmatic SEO, an account platform, or a generic AI directory.

Success means a visitor can move from a model/provider landing page into a pre-filled cost comparison, understand how a price changed over time, estimate what a fixed budget buys, and share that exact scenario with another person. Every monetary claim remains traceable to official provider pricing and a verification timestamp.

## Scope selected for this phase

1. Model detail pages.
2. Provider detail pages.
3. Pricing history and price-change derivation.
4. Shareable/deep-link calculator and compare state.
5. Workload presets.
6. Cache and batch savings optimizer where official rates exist.
7. Budget-to-usage calculator.
8. SEO infrastructure: sitemap, robots, canonical metadata, internal linking, truthful structured data.
9. Public pricing change feed.

Explicitly deferred: prompt/token estimator, authentication, saved private scenarios, email/webhook alerts, team dashboards, provider-key ingestion, public write APIs, automated pricing scraping as the sole source of truth, and image/audio/video pricing calculators.

## Architectural direction

Keep the existing **Next.js + TypeScript modular monolith** and PostgreSQL repository architecture. Do not add a service boundary, queue, Redis, Docker, or OCI Object Storage for this phase.

New feature modules should remain separated by purpose:

- `src/features/models`: model catalog/detail presentation and model-specific calculator entry points.
- `src/features/providers`: provider landing pages and provider model summaries.
- `src/features/history`: historical pricing projections and price-change calculations.
- `src/features/presets`: version-controlled workload presets and preset application.
- `src/features/optimizer`: cache/batch scenario calculations derived from existing pricing domain functions.
- `src/features/budget`: inverse cost calculation (budget -> tokens/requests).
- `src/features/compare`: canonical URL state encode/decode/normalization.
- `src/app`: routes, metadata, sitemap, robots, and route composition only.

Pricing math stays inside `src/domain/pricing`; React components must not reimplement cost formulas.

## Data/history model

The existing `model_pricing` / pricing-band persistence already models effective intervals and must become the history source of truth rather than introducing a second competing history table.

Rules:

- Never overwrite a historical price merely because a provider publishes a new price.
- A new verified rate closes the previous effective interval where appropriate and creates a new interval.
- `sourceUrl`, `verifiedAt`, `effectiveFrom`, `effectiveTo`, currency, context band and all stored rate dimensions remain preserved per record.
- Price history compares like-for-like bands only: same model, currency and compatible context range; input/output/cache/batch dimensions are diffed independently.
- A “price change” exists only when a supported rate dimension materially differs between consecutive verified records.
- Unknown effective dates are not invented. If only verification time is known, UI labels the event as “verified on” rather than claiming “effective on”.
- Future-dated official prices may be stored but are clearly marked future and must not replace the current calculator rate until effective.
- Do not backfill historical prices from memory, third-party summaries or inferred dates; only persist past events supported by first-party evidence.

The public change feed is a projection over these records, not a manually maintained editorial list.

## Model detail pages

Route: `/models/[modelSlug]`

Each page should provide distinct useful content:

- canonical model/provider identity and status;
- context window / known output limit when source-backed;
- current standard pricing table by applicable context band;
- cache/batch dimensions only when the provider publishes them;
- source URL and verification date adjacent to pricing;
- historical price timeline/change summary when at least two comparable records exist;
- embedded compact calculator preselected to that model;
- links to provider page and compare flow;
- related models from the same provider/family, without fabricated ranking claims.

Unknown slugs return standard 404.

## Provider detail pages

Route: `/providers/[providerSlug]`

Each page contains:

- provider identity and official pricing/source links;
- active/preview model inventory;
- compact current-price matrix;
- direct actions to calculate or compare selected models;
- recent verified price changes for that provider when available;
- clear treatment of preview/deprecated models.

Provider pages do not claim quality/performance superiority unless TokenMeter later has sourced benchmark data.

## Shareable calculator and compare state

Calculator state must be serializable into a stable, human-inspectable query string. Recommended canonical shape:

`/compare?models=gpt-6.1-sol,claude-sonnet-5-5&input=2M&output=500K&cached=0&avg=8K&preset=custom`

Rules:

- normalize duplicate and unknown model slugs;
- max four models;
- preserve existing parser upper bounds;
- omit default/empty values where possible;
- use `replaceState` for high-frequency input edits and `pushState` only for explicit navigation/share actions;
- no secrets, prompts, API keys, user identifiers or private text in URLs;
- refresh/back/forward must restore the same valid scenario;
- malformed URL state degrades to safe defaults without crashing SSR.

A visible “Copy share link” action should copy the canonical URL and confirm success accessibly.

## Workload presets

Presets are version-controlled product defaults, not claims about universal traffic patterns. Initial presets:

- Chatbot
- RAG assistant
- Coding agent
- Document processing
- High-cache workload

Each preset defines only transparent fields already supported by the calculator: uncached input, output, cached input and average input tokens/request. Preset UI must expose the actual numbers after selection so users can edit them immediately.

Each preset includes a short note that it is a starting scenario, not a benchmark or recommendation.

## Cache and batch savings optimizer

The optimizer answers “what would this exact workload cost under another officially published billing mode?” It must never manufacture discounts.

- Cached-input comparison appears only if the selected model has an applicable cache rate.
- Batch comparison appears only if official batch input/output rates exist in stored pricing data.
- Savings use the same workload and comparable billable dimensions.
- Missing dimensions show unavailable rather than `$0`.
- Long-context/context-band selection remains based on average input tokens per request.
- Output should show baseline cost, optimized cost, absolute savings and percentage savings.
- If an optimization changes operational semantics (for example batch is asynchronous), display that limitation beside the result.

The optimizer is informational and never toggles the main calculator silently.

## Budget calculator

Route: `/budget`

Primary question: “Given a monthly budget and workload mix, how much usage can this model support?”

V1 budget mode uses one of two transparent inputs:

1. **Token mix mode:** user supplies relative input/output/cache composition; TokenMeter solves the maximum scale factor within budget.
2. **Request mode:** user supplies average tokens per request; TokenMeter estimates maximum requests within budget.

Rules:

- USD only in this phase;
- decimal-safe math;
- impossible/zero-cost/missing-price scenarios return unavailable, never Infinity;
- result explicitly states the pricing record and verification date used;
- request estimates remain estimates and round down to whole requests for the headline count.

Budget scenarios can deep-link into `/compare` with the equivalent workload where meaningful.

## Pricing change feed

Route: `/changes`

The feed is chronological and source-backed. Each event contains:

- provider and model;
- verified/effective date semantics;
- changed dimensions (input/output/cache/batch, including context band);
- old and new rate;
- percentage delta when both values are non-zero and comparable;
- official source link;
- link to model detail/history.

Do not create a feed item for metadata-only edits or a verification refresh where the numeric price did not change.

## SEO and discovery

Add/complete:

- `src/app/sitemap.ts`
- `src/app/robots.ts`
- canonical metadata for home, catalog, model, provider, budget and change-feed routes;
- model/provider-specific titles and descriptions derived from factual stored data;
- breadcrumbs/internal links among provider -> model -> compare/budget -> changes;
- truthful JSON-LD only where schema meaning matches page content.

SEO rules:

- no auto-generated pairwise “X vs Y” route explosion;
- no keyword-stuffed duplicate copy;
- do not index query-string calculator state as separate canonical documents;
- canonical `/compare` remains the canonical comparison tool page;
- sitemap includes durable indexable routes only.

## UX / visual direction

Retain the existing “precision metering console” design language.

New surfaces should look like instruments/data sheets rather than marketing cards:

- model detail: strong rate readout + source strip + compact history rail;
- provider detail: dense but readable model matrix;
- budget: large budget/result meter with composition controls adjacent;
- changes: chronological ledger/tape, not a blog feed;
- presets: compact selectable presets integrated into workload controls;
- optimizer: secondary comparison drawer/panel, visually subordinate to the primary cost result.

All new UI must preserve reduced-motion support, visible focus, touch targets, mobile no-overflow, and tabular numerals for price data.

## Performance and caching

- Server-render/cache model/provider/change pages with the same resilient pricing repository.
- Keep calculator/budget math client-local after initial DTO load.
- Avoid shipping the full historical dataset to every page; load only history needed by the current route.
- Keep `/changes` paginated or bounded as history grows.
- Sitemap generation must not require external provider calls.

## Resilience and privacy

- PostgreSQL failure continues to fall back to the trusted bundled snapshot for current public pricing.
- Historical views may show “history temporarily unavailable” if DB history is unavailable; they must not fabricate history from the current snapshot.
- Share URLs contain numeric workload configuration only, never user-provided secret text.
- No login/cookies are required for these features.
- Existing `/api/health` contract remains safe and unchanged unless a migration adds a new readiness dependency.

## Testing strategy

Use TDD for the new domain/application behavior. Required automated coverage includes:

- history ordering, interval boundaries and like-for-like change derivation;
- no change event when a rate is merely re-verified unchanged;
- share URL encode/decode, malformed input, duplicate/unknown models and max-four normalization;
- preset application/editability;
- optimizer support gating and savings precision;
- budget inverse calculation, zero/missing-rate protection and whole-request rounding;
- model/provider route 404 behavior and metadata helpers;
- sitemap/robots contents and canonical compare behavior.

Browser QA critical journeys:

1. model detail -> prefilled calculator -> compare -> copy link -> reload exact state;
2. provider -> model -> history/change feed;
3. preset -> edit workload -> optimizer;
4. budget -> request estimate -> compare equivalent scenario.

Run QA-3 at 1440x1000, 1280x800, 390x844 and tablet where layout changes. Verify keyboard operation, reduced motion, console/network health and production HTTPS after deploy.

## Deployment and migration

Deployment remains native OCI only:

- Node 24 + systemd;
- Caddy reverse proxy/TLS;
- PostgreSQL 17 localhost-only;
- `/opt/token-meter/releases/<release-id>` release switch with health-gated rollback;
- no Docker/Compose/Kubernetes.

If the existing schema already supports all required history intervals, prefer indexes/query helpers over unnecessary new tables. Any required schema/index migration must be backward-compatible with the current production data and run before release switch using the existing deployment workflow.

## Acceptance criteria

1. Model and provider detail pages are indexable, source-backed and return 404 for unknown slugs.
2. Current calculator state can be shared/reloaded deterministically without leaking private text.
3. Pricing history never overwrites prior verified records and never invents effective dates.
4. `/changes` only emits real comparable price changes.
5. Presets are editable transparent starting points.
6. Cache/batch optimizer only uses officially stored supported rates.
7. Budget mode handles missing/zero prices safely and uses decimal-safe arithmetic.
8. Sitemap/robots/canonical metadata are correct and query states do not create duplicate canonical pages.
9. Automated tests, typecheck, lint and production build pass.
10. QA-3 passes desktop/mobile critical journeys without blocking accessibility/layout issues.
11. OCI migration/deploy succeeds; service and DB remain localhost-bound behind Caddy.
12. Every patch is committed and pushed to `master` using `type(scope): message`.

## Deferred next phase

After this growth pack proves useful: prompt/token estimator with an explicit tokenizer strategy, price-change alerts, saved scenarios/account features, public read API, image/audio/video calculators and optional Object Storage-backed exports.