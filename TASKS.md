# Portfolio CMS Tasks

Primary day-to-day tracker for the Projects-first MVP on `feature/portfolio-cms`. Detailed requirements and decisions remain in [`docs/specs/portfolio-cms-requirements.md`](docs/specs/portfolio-cms-requirements.md); this file records current delivery status and does not itself authorize implementation, Git writes, database operations, credentials, infrastructure, or deployment.

## Current goal

Proceed next with published Project detail reads, safe prior-slug redirects, and `/projects/:slug` only after separate owner authorization; keep the broader Projects-first MVP scope unchanged (`CMS-DEC-PROJ-009–013`).

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

## In progress

- No implementation task is active; the next priority remains owner-gated.

## Next tasks (ordered by priority)

1. [ ] Deliver published Project detail reads by slug, safe prior-slug redirects, and the public `/projects/:slug` view; preserve the current external card action (`CMS-DEC-PROJ-009–013`).
2. [ ] Complete Admin lifecycle actions for include/unpublish, Trash, and Restore, with publication-safe behavior and focused API/UI tests (`CMS-DEC-PROJ-002–004`).
3. [ ] Add approved safe Markdown rendering and URL handling for long descriptions; fall back to the short description when absent (`CMS-DEC-PROJ-010–012`).
4. [ ] Build authenticated full-site draft preview for `/`, `/all-projects`, and `/projects/:slug` using public presentation components, a persistent preview label, and strict draft/cache/style isolation (`CMS-DEC-PROJ-016`).
5. [ ] Close MVP verification gaps: auth/session/CSRF denial cases, publication-to-public-read flow, keyboard/focus/status announcements, responsive public/Admin regressions, and end-to-end coverage (`CMS-REQ-023`).
6. [ ] Prepare the owner-approved static-content migration, fallback/cutover/rollback, backup/restore rehearsal, zero-cost hosting checks, and deployment runbook; execute external or production operations only with separate approval.

## Deferred

- Advanced operation cleanup, backup-attestation/audit reporting, temporary-file handling, and incident-resolution subsystems (`CMS-DEC-PROJ-047–067`).
- Pages, Skills, and future content types beyond Projects (`CMS-SCOPE-MVP-001`).
- Permanent deletion until published-reference and redirect behavior is explicitly approved.
- Dependency upgrades, infrastructure optimization, and visual redesign work not required for the Projects MVP.

## Genuine blockers

- Safe Markdown/link policy, linkless/internal-detail behavior, published-Project Restore semantics, permanent deletion/redirect behavior, and the protected-preview delivery/isolation mechanism still require explicit owner decisions before those affected slices are completed.
- Production work remains gated on credentials, provider/cost validation, backup and restore approval/rehearsal, migration/cutover/rollback approval, complete test acceptance, and separate database/infrastructure/deployment authorization.
- The latest isolated PostgreSQL integration rerun remains pending and requires an explicitly approved isolated test target; Stage 4 otherwise passed its automated and manual verification.

## Minimal verification checklist

- [x] `git diff --check`
- [x] `npm run quality:check`
- [x] `npm run build`
- [x] `npm run build --workspace @portfolio-cms/server`
- [x] Run focused tests for the changed behavior and manually verify loading, empty/never-published, error/Retry, keyboard, responsive, and no-draft-leak cases.
- [ ] When persistence/publication changes: run `npm run test:integration --workspace @portfolio-cms/server` only against an approved isolated PostgreSQL test target and confirm cleanup.
