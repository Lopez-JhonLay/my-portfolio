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

- Full portfolio content management and manual browser acceptance are complete. Protected draft-preview routes and automated Playwright browser coverage are deferred enhancements by owner decision.

## Next tasks (ordered by priority)

1. [x] **Shared content model and publication integration:** implementation, database verification, authorized Neon migration, atomic publication, fallback behavior, and manual owner acceptance are complete.
2. [x] **Hero, About Me, and Contact:** editing, draft saves, publication, contextual media, public rendering, and manual owner acceptance are complete.
3. [x] **Timeline and Technologies:** editing, validation, ordering, publication, public rendering, and manual owner acceptance are complete.
4. [x] **Neon media, résumé, and Project galleries:** implementation, approved dependencies, Neon migration, Object Storage configuration, real upload/private preview, contextual profile and résumé workflows, five-image gallery ordering/cover/alt text, draft isolation, publication, and public rendering passed owner acceptance.
5. [x] **Full browser verification:** owner-verified public/Admin behavior, draft secrecy, publication, media workflows, accessibility, keyboard/focus, themes, reduced motion, and responsive layouts at approximately 320, 768, 1024, and 1440 px.
6. [ ] Complete Admin lifecycle actions for include/unpublish, Trash, and Restore when required for publication safety (`CMS-DEC-PROJ-002–004`).
7. [ ] After all content slices pass acceptance, prepare owner-approved backup/restore rehearsal, migration cutover and rollback, production hardening, zero-cost hosting checks, Render/Vercel deployment, and the deployment runbook.

## Deferred

- Protected full-site draft-preview routes for `/`, `/all-projects`, and `/projects/:slug`.
- Playwright setup and automated public/Admin/preview browser regression coverage.
- Advanced operation cleanup, backup-attestation/audit reporting, temporary-file handling, and incident-resolution subsystems (`CMS-DEC-PROJ-047–067`).
- Blog, general SEO management beyond the approved portfolio-facing copy, and content types not displayed by the current portfolio.
- Permanent deletion until published-reference and redirect behavior is explicitly approved.
- Dependency upgrades, infrastructure optimization, and visual redesign work not required for full portfolio content management.

## Genuine blockers and gates

- Further Neon schema/data changes remain separately owner-gated. Slice 1 migration `0001_sturdy_nick_fury` was explicitly authorized, applied transactionally, and verified with seven valid draft sections and zero published content sections.
- Slice 4 SDK/file-signature dependencies were explicitly approved and installed, migration `0002_media-assets-galleries` was explicitly authorized and applied, and the existing private `uploads` bucket was explicitly authorized and configured. One non-sensitive image upload was explicitly authorized and verified; further uploads or media-reference changes remain owner-gated.
- Playwright setup or dependency changes remain separately gated and owner-deferred.
- Production work remains gated on credentials, provider/cost validation, backup and restore approval/rehearsal, migration/cutover/rollback approval, complete test acceptance, and separate database/infrastructure/deployment authorization.

## Minimal verification checklist

- [x] Existing baseline: 138 automated tests and six manual browser checks passed for the completed Projects public-integration milestone.
- [x] Slice 1 local verification: `npm run quality:check` passed with 162 tests; public, Admin, and server production builds passed.
- [x] Slice 1 persistence verification: both migrations and 29 integration tests passed against an approved disposable loopback-only PostgreSQL target; the target was stopped and removed afterward.
- [x] Slice 1 Neon migration: `0001_sturdy_nick_fury` applied transactionally; all seven seeded drafts passed their application schemas, existing Project/operation counts were preserved, and no content section was published automatically.
- [x] Slice 2 local verification: `npm run quality:check` passed with 169 tests; public, Admin, and server production builds passed. Browser smoke verification loaded the Hero, About Me, and Contact drafts from Neon and confirmed the configured public site retained its existing content before publication.
- [x] Slice 3 local verification: `npm run quality:check` passed with 173 tests; public, Admin, and server production builds passed. No schema migration or Neon data change was required.
- [x] Slice 4 local verification: `npm run quality:check` passed with 184 tests; public, Admin, and server production builds passed; and `npm audit --omit=dev` found zero vulnerabilities.
- [x] Slice 4 Neon migration: `0002_media-assets-galleries` applied transactionally; existing counts remained at 3 Projects, 3 published Projects, 7 content drafts, and 0 published content sections. All three new tables were empty, and four foreign keys, two cover uniqueness indexes, and both media enums were verified after commit.
- [x] Slice 4 Object Storage configuration: the existing private `uploads` bucket was connected through ignored server environment values, an authenticated `HeadBucket` returned HTTP 200, and the authenticated Media & Résumé workspace loaded with upload controls enabled.
- [x] Slice 4 real upload smoke check: a non-sensitive 68-byte PNG completed the upload-intent, signed PUT, server finalize/signature verification, Ready listing, and authenticated private-preview flow. Profile selection, Save Draft, public draft isolation, and restoration to the bundled default were verified; the asset remains unreferenced and unpublished, and its local fixture was removed.
- [x] Slice 4 contextual media UX: removed the standalone Media & Résumé workspace from Admin navigation/routing; résumé uploads now auto-select in Hero, profile uploads auto-select in About Me, and Project screenshots auto-enter the edited Project gallery. The unified private storage and publication model is unchanged.
- [x] Slice 4 owner acceptance: published profile and résumé media rendered correctly; a five-image Project gallery preserved draft isolation, cover selection, ordering, and alt text, then published successfully to the public card and detail page.
- [ ] For each approved slice: run focused tests plus Admin/server/public lint, typecheck, format check, and builds affected by that slice.
- [x] For Slice 1 persistence/publication changes: run `npm run test:integration --workspace @portfolio-cms/server` only against an explicitly approved isolated PostgreSQL test target and confirm cleanup.
- [x] Full-content manual acceptance: public/Admin routes, draft secrecy, publication, media behavior, keyboard/focus, themes, reduced motion, and responsive layouts passed owner verification.
- [ ] Deferred enhancement: add Playwright public/Admin/preview regression coverage only after separate owner approval.
