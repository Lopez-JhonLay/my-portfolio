# Portfolio CMS Tasks

Primary day-to-day tracker for completing full portfolio content management on `feature/portfolio-cms` before deployment. Detailed requirements and decisions remain in [`docs/specs/portfolio-cms-requirements.md`](docs/specs/portfolio-cms-requirements.md); this file records delivery status and does not itself authorize dependencies, database operations, migrations, credentials, infrastructure, Git writes, or deployment.

The owner-approved full-content roadmap supersedes the Projects-first delivery priority in `CMS-SCOPE-MVP-001` while retaining the existing authentication, authorization, draft secrecy, publication, recovery, data-integrity, and verification requirements. Work traces primarily to `CMS-REQ-001`, `CMS-REQ-003–005`, `CMS-REQ-013–015`, `CMS-REQ-021`, and `CMS-REQ-023–027`.

## Current goal

Complete management of all meaningful public portfolio content through the Admin CMS before deployment, using one atomic Publish Updates workflow and preserving current public content until each CMS replacement is successfully published.

## Completed

- [x] Establish the public, admin, and server workspaces, strict checks, deterministic tests, and secret-file protections.
- [x] Define Project, public DTO, API trust-boundary, and persistence contracts; add the Drizzle schema and initial migration.
- [x] Implement and PostgreSQL-test published reads, idempotent draft mutations, optimistic concurrency, and isolated migration/test boundaries.
- [x] Implement GitHub OAuth, stable numeric-user authorization, sessions, CSRF/origin protections, logout, and protected Admin routes (`CMS-REQ-003–005`).
- [x] Implement protected Project draft/list/featured APIs and the Admin dashboard with explicit saves, conflict/uncertain-outcome handling, unsaved-change warnings, and the approved Admin redesign.
- [x] Implement atomic Publish Updates, durable/idempotent publication operations, readiness checks, and Admin publication recovery (`CMS-DEC-PROJ-001`, `CMS-DEC-PROJ-033–046`).
- [x] Preserve the existing public portfolio presentation boundary and legacy Project mapping on the Admin redesign baseline at `be90869`.
- [x] Complete Stage 4 public integration for status, grouped and featured reads, first-publication fallback, loading/error/Retry states, CORS, caching, and draft isolation. Verification: 138 automated tests and all six manual browser checks passed.
- [x] Complete Neon connectivity and the initial schema milestone. End-to-end smoke verification passed for GitHub login, persisted Project drafts, Featured selection, Publish Updates, and local public portfolio reads; the link-readiness requirement was also confirmed.
- [x] Audit the current public content and approve the full-content CMS plan, including global publication, content ownership, private media, Project galleries, and built-in technology icons.

## In progress

- Slice 1 implementation, isolated PostgreSQL verification, and the authorized Neon migration are complete: typed and seeded content-section persistence, protected draft/read APIs, durable save recovery, atomic publication integration, unified public snapshot, and Admin Overview readiness. Manual browser acceptance remains before closing the slice; the seven Neon drafts are seeded but not published.

## Next tasks (ordered by priority)

1. [ ] **Shared content model and publication integration:** implementation, non-database checks, disposable PostgreSQL verification, and the authorized Neon migration are complete; complete manual browser acceptance before closing the slice.
2. [ ] **Hero, About Me, and Contact:** add consistent Admin editors and public integration for identity/navigation, Hero, About, Contact/social links, and footer content.
3. [ ] **Timeline and Technologies:** add ordered editors, built-in icon selection, validation, publication integration, and public rendering.
4. [ ] **Neon media, résumé, and Project galleries:** after separate dependency/provider/schema approval, implement private signed uploads, media references, safe replacement and cleanup, Project covers, safe Markdown/detail reads, prior-slug redirects, and `/projects/:slug` galleries.
5. [ ] **Full browser verification:** complete protected full-site draft preview and verify public/Admin behavior, draft secrecy, accessibility, keyboard/focus, reduced motion, and responsive layouts at the approved viewports.
6. [ ] Complete Admin lifecycle actions for include/unpublish, Trash, and Restore when required for publication safety (`CMS-DEC-PROJ-002–004`).
7. [ ] After all content slices pass acceptance, prepare owner-approved backup/restore rehearsal, migration cutover and rollback, production hardening, zero-cost hosting checks, Render/Vercel deployment, and the deployment runbook.

## Deferred

- Advanced operation cleanup, backup-attestation/audit reporting, temporary-file handling, and incident-resolution subsystems (`CMS-DEC-PROJ-047–067`).
- Blog, general SEO management beyond the approved portfolio-facing copy, and content types not displayed by the current portfolio.
- Permanent deletion until published-reference and redirect behavior is explicitly approved.
- Dependency upgrades, infrastructure optimization, and visual redesign work not required for full portfolio content management.

## Genuine blockers and gates

- Further Neon schema/data changes remain separately owner-gated. Slice 1 migration `0001_sturdy_nick_fury` was explicitly authorized, applied transactionally, and verified with seven valid draft sections and zero published content sections.
- Object Storage provisioning, credentials, uploads, SDK/file-signature dependencies, and provider changes remain separately gated until Slice 4.
- Playwright setup or dependency changes remain separately gated until browser-verification work is approved.
- Production work remains gated on credentials, provider/cost validation, backup and restore approval/rehearsal, migration/cutover/rollback approval, complete test acceptance, and separate database/infrastructure/deployment authorization.

## Minimal verification checklist

- [x] Existing baseline: 138 automated tests and six manual browser checks passed for the completed Projects public-integration milestone.
- [x] Slice 1 local verification: `npm run quality:check` passed with 162 tests; public, Admin, and server production builds passed.
- [x] Slice 1 persistence verification: both migrations and 29 integration tests passed against an approved disposable loopback-only PostgreSQL target; the target was stopped and removed afterward.
- [x] Slice 1 Neon migration: `0001_sturdy_nick_fury` applied transactionally; all seven seeded drafts passed their application schemas, existing Project/operation counts were preserved, and no content section was published automatically.
- [ ] For each approved slice: run focused tests plus Admin/server/public lint, typecheck, format check, and builds affected by that slice.
- [x] For Slice 1 persistence/publication changes: run `npm run test:integration --workspace @portfolio-cms/server` only against an explicitly approved isolated PostgreSQL test target and confirm cleanup.
- [ ] For full-content acceptance: run Playwright public/Admin/preview regression coverage and the approved keyboard, accessibility, reduced-motion, and responsive checks.
