# Portfolio CMS Progress Tracker

This tracker records evidence and a proposed execution breakdown for the Projects-first MVP. It does not authorize implementation. Every task, dependency change, Git write, database operation, external resource change, migration, and deployment still requires the approval defined by the [requirements baseline](specs/portfolio-cms-requirements.md).

> **Authorization warning:** A checkbox or task status is not permission to perform the task. Milestone order is for readability, not an implicit hard dependency. Follow each task's explicit dependencies and obtain separate owner approval before starting it.

## Status model

### Task state

- **COMMITTED:** completed work with verified local commit evidence.
- **IMPLEMENTED LOCALLY:** completed work present in the working tree but not committed.
- **PROPOSED:** task breakdown awaiting individual approval; no unresolved prerequisite currently prevents consideration.
- **BLOCKED:** cannot safely start until a named unresolved technical, security, operational, or external gate is resolved. An unfinished predecessor or ordinary task-specific owner authorization alone does not make a task blocked.
- **DEFERRED:** preserved future work excluded from MVP completion.

### Delivery evidence

Track delivery independently from task state:

- **Implemented locally:** the work product exists in the checked-out repository.
- **Committed locally:** the work is reachable from the current local branch.
- **Pushed:** a remote state or explicit owner record establishes the commit was pushed.
- **Merged:** the commit is established as part of the target branch.
- **Deployed:** deployment evidence exists for the work.

Use `Not established` when evidence is unavailable. Do not translate it to `No` or claim a commit was never pushed solely because local refs do not establish a push.

## Requirements and historical planning

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Lean Projects MVP requirements baseline | Owner-approved; committed locally | `docs/specs/portfolio-cms-requirements.md`, commit `bf3c125`. |
| M0 planning milestone | Owner-reported complete; informational gap | No tracked definition or artifact identifies M0. This does not block MVP work. |
| M1 planning milestone | Owner-reported complete; informational gap | No tracked definition or artifact identifies M1. This does not block MVP work. |
| M2 planning milestone | Owner-reported complete; informational gap | No tracked definition or artifact identifies M2. This does not block MVP work. |

Add M0/M1/M2 titles or artifact links only when the owner supplies or approves them. Do not infer their contents or make the missing artifacts an MVP acceptance gate.

## Completed foundation checklist

- [x] `MVP-BASE-001` **COMMITTED** — Establish the approved Lean Projects MVP requirements baseline. **Depends:** None. **Acceptance:** [Requirements §§1–4](specs/portfolio-cms-requirements.md#1-document-authority-and-source-precedence). **Evidence:** `bf3c125fab70962b86eb9071ce4ab7d15c938136`.
- [x] `MVP-BASE-002` **COMMITTED** — Protect environment-secret files from accidental Git inclusion. **Depends:** `MVP-BASE-001`. **Acceptance:** [Requirements §14.1](specs/portfolio-cms-requirements.md#141-security). **Evidence:** `ec7e05a1f0007f3c28864d1debc0768173b51db4`.
- [x] `MVP-BASE-003` **COMMITTED** — Declare Node and npm runtime requirements. **Depends:** `MVP-BASE-001`. **Acceptance:** [Requirements §§14.3 and 18](specs/portfolio-cms-requirements.md#143-maintainability-and-cost). **Evidence:** `7c5096d30c8ef305e73ba80612c6e3028d87a8cc`.
- [x] `MVP-BASE-004` **COMMITTED** — Establish npm workspaces for `admin` and `server`. **Depends:** `MVP-BASE-003`. **Acceptance:** [Requirements §§5 and 14.3](specs/portfolio-cms-requirements.md#5-existing-repository-and-compatibility-constraints). **Evidence:** `369fe885dbfdfda4bf809cb0177c3d95065d89e5`.
- [x] `MVP-BASE-005` **COMMITTED** — Add admin React runtime dependencies. **Depends:** `MVP-BASE-004`. **Acceptance:** [Requirements §4.1 and `CMS-DEC-PROJ-014`](specs/portfolio-cms-requirements.md#41-included-projects-mvp). **Evidence:** `af8b6738bbb8647effef21494eef650170717530`.
- [x] `MVP-BASE-006` **COMMITTED** — Add admin TypeScript and Vite tooling. **Depends:** `MVP-BASE-005`. **Acceptance:** [Requirements §§4.1 and 14.3](specs/portfolio-cms-requirements.md#143-maintainability-and-cost). **Evidence:** `ed21f2723c8aa15693e192ad9e94977c6979eb88`.
- [x] `MVP-BASE-007` **COMMITTED** — Add the Express server dependency. **Depends:** `MVP-BASE-004`. **Acceptance:** [`CMS-REQ-006–007`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition). **Evidence:** `cd898490b43349d4439e82597691d2983fc63c37`.
- [x] `MVP-BASE-008` **COMMITTED** — Add server TypeScript tooling. **Depends:** `MVP-BASE-007`. **Acceptance:** [`CMS-REQ-025–026`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition). **Evidence:** `eef481b92ae28a1e401bdf415e118fae29bf218b`.
- [x] `MVP-DOC-001` **IMPLEMENTED LOCALLY** — Create the SDD documentation foundation: `AGENTS.md`, architecture, progress tracker, and design systems. **Depends:** `MVP-BASE-001`. **Acceptance:** [Requirements §§1, 14.3, and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries). **Evidence:** four untracked documentation files in the current working tree; no commit evidence.

### Completed-work delivery evidence

Evidence is based on local Git state at `eef481b92ae28a1e401bdf415e118fae29bf218b`. The feature branch has no configured upstream, and no local remote-tracking ref contains HEAD.

| Task | Implemented locally | Committed locally | Pushed | Merged | Deployed |
| --- | --- | --- | --- | --- | --- |
| `MVP-BASE-001` | N/A — documentation | `bf3c125` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-002` | Yes | `ec7e05a` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-003` | Yes | `7c5096d` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-004` | Yes | `369fe88` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-005` | Yes | `af8b673` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-006` | Yes | `ed21f27` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-007` | Yes | `cd89849` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-BASE-008` | Yes | `eef481b` | Not established | Not shown in local `origin/main` | Not established |
| `MVP-DOC-001` | Yes | No | Not established | Not established | Not established |
| `MVP-SPEC-001` | Yes | No | Not established | Not established | Not established |

## Current checkpoint

The repository and dependency foundation is complete locally. The admin and server workspaces still contain manifests only. No application shell, API, authentication, database layer, migration, CMS feature, automated test suite, infrastructure resource, or deployment is implemented.

## Proposed MVP task inventory

### Milestone 1 — Technical specifications and decision gates

- [x] `MVP-SPEC-001` **IMPLEMENTED LOCALLY** — Record the owner-selected project coding standards in repository guidance. **Depends:** `MVP-DOC-001`. **Acceptance:** [Requirements §§14.3 and 19](specs/portfolio-cms-requirements.md#143-maintainability-and-cost). **Evidence:** untracked `AGENTS.md`; no commit evidence.
- [x] `MVP-SPEC-002` **IMPLEMENTED LOCALLY** — Specify module boundaries and the public presentation/content-transport contract. **Depends:** `MVP-SPEC-001` (completed locally). **Acceptance:** [Requirements §§5 and 14.3](specs/portfolio-cms-requirements.md#5-existing-repository-and-compatibility-constraints). **Evidence:** `specs/public-project-presentation-contract.md`; requirements traceability, Markdown whitespace, exact file scope, and `git diff --check` verified on 2026-10-29.
- [x] `MVP-SPEC-003` **IMPLEMENTED LOCALLY** — Specify public/admin API resources, direct success bodies, standardized errors, Zod validation, and trust boundaries. **Depends:** `MVP-SPEC-002` (completed locally). **Acceptance:** [Requirements §§5.1, 11, and 14.1](specs/portfolio-cms-requirements.md#51-project-compatibility-contract). **Evidence:** `specs/projects-api-trust-boundary.md`; requirements traceability, Markdown whitespace, exact file scope, and `git diff --check` verified on 2026-10-29.
- [x] `MVP-SPEC-004` **IMPLEMENTED LOCALLY** — Specify the Drizzle schema, migrations, constraints, transactions, optimistic concurrency, and idempotent operation records. **Depends:** `MVP-CONTRACT-001` (completed locally). **Acceptance:** [Requirements §§8–10 and 17.1](specs/portfolio-cms-requirements.md#171-pre-implementation-gates). **Evidence:** `specs/database-persistence-contract.md`; requirements traceability, Markdown whitespace, exact two-file scope, and `git diff --check` verified on 2026-10-29.
- [ ] `MVP-SPEC-005` **PROPOSED** — Specify GitHub OAuth, sessions, cookies/tokens, CSRF, CORS, callback allowlisting, expiry, and logout. **Depends:** `MVP-SPEC-003`. **Acceptance:** [Requirements §§6 and 17.1](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-SPEC-006` **PROPOSED** — Record the approved stable numeric GitHub administrator ID through a secret-safe configuration contract. **Depends:** `MVP-SPEC-005`. **Acceptance:** [Requirements §6](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-SPEC-007` **PROPOSED** — Resolve Restore after a published Trash removal. **Depends:** `MVP-SPEC-004`. **Acceptance:** [Requirements §§10 and 17.1](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-SPEC-008` **PROPOSED** — Resolve permanent deletion and redirect behavior when published references may remain. **Depends:** `MVP-SPEC-004`. **Acceptance:** [Requirements §§10 and 17.1](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-SPEC-009` **PROPOSED** — Resolve publication behavior for projects with neither `repo` nor `liveUrl`. **Depends:** `MVP-SPEC-003`. **Acceptance:** [Requirements §§5.1 and 17.1](specs/portfolio-cms-requirements.md#51-project-compatibility-contract).
- [ ] `MVP-SPEC-010` **PROPOSED** — Resolve internal project-detail navigation while preserving the existing external card action. **Depends:** `MVP-SPEC-002`. **Acceptance:** [Requirements §§5.1–5.2 and 17.1](specs/portfolio-cms-requirements.md#52-approved-compatibility-exceptions).
- [ ] `MVP-SPEC-011` **PROPOSED** — Approve Markdown syntax, sanitization, and safe-link policy. **Depends:** `MVP-SPEC-003`. **Acceptance:** [Requirements §§7.1 and 17.1](specs/portfolio-cms-requirements.md#71-descriptions).
- [ ] `MVP-SPEC-012` **PROPOSED** — Specify protected-preview delivery, authorization, cache/metadata isolation, and style isolation. **Depends:** `MVP-SPEC-002`, `MVP-SPEC-005`. **Acceptance:** [Requirements §6 and `CMS-DEC-PROJ-016`](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-SPEC-013` **PROPOSED** — Approve test strategy, WCAG target, supported browsers, viewport matrix, and assistive-technology coverage. **Depends:** `MVP-SPEC-001`. **Acceptance:** [Requirements §§14.2 and 15](specs/portfolio-cms-requirements.md#142-accessibility-and-regression).
- [ ] `MVP-SPEC-014` **PROPOSED** — Specify migration, fallback, cutover, rollback, backup, restore, and zero-cost hosting procedures. **Depends:** `MVP-SPEC-004`. **Acceptance:** [Requirements §§12–13 and 17.2](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).

### Milestone 2 — Application and verification foundations

- [ ] `MVP-FOUND-001` **PROPOSED** — Create the minimal admin React/Vite TypeScript shell. **Depends:** `MVP-BASE-006`, `MVP-SPEC-001`. **Acceptance:** [`CMS-REQ-025–026` and `CMS-DEC-PROJ-014`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition).
- [ ] `MVP-FOUND-002` **PROPOSED** — Establish the admin-owned style entry point and feature/shared component boundaries without selecting an unapproved visual theme. **Depends:** `MVP-FOUND-001`. **Acceptance:** [Requirements §§14.2–14.3](specs/portfolio-cms-requirements.md#142-accessibility-and-regression).
- [ ] `MVP-FOUND-003` **PROPOSED** — Create the minimal feature-oriented Express/TypeScript server shell with thin HTTP layers and centralized error middleware. **Depends:** `MVP-BASE-008`, `MVP-SPEC-001`. **Acceptance:** [`CMS-REQ-006–007`, `025–026`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition).
- [ ] `MVP-FOUND-004` **PROPOSED** — Establish Zod-based environment validation and fail-safe startup behavior. **Depends:** `MVP-FOUND-003`. **Acceptance:** [Requirements §14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-FOUND-005` **PROPOSED** — Configure strict TypeScript, ESLint, and Prettier checks for admin and server workspaces. **Depends:** `MVP-FOUND-001`, `MVP-FOUND-003`; separate dependency approval. **Acceptance:** [Requirements §14.3](specs/portfolio-cms-requirements.md#143-maintainability-and-cost).
- [ ] `MVP-FOUND-006` **PROPOSED** — Establish Vitest, Supertest, and Playwright foundations after separate dependency approval. **Depends:** `MVP-FOUND-001`, `MVP-FOUND-003`, `MVP-SPEC-013`. **Acceptance:** [`CMS-REQ-023` and Requirements §15](specs/portfolio-cms-requirements.md#15-testing-requirements).
- [ ] `MVP-FOUND-007` **PROPOSED** — Establish deterministic fixtures/builders and isolated test-environment boundaries. **Depends:** `MVP-FOUND-006`. **Acceptance:** [Requirements §§14.1 and 15](specs/portfolio-cms-requirements.md#15-testing-requirements).

### Milestone 3 — Project contracts and validation

- [x] `MVP-CONTRACT-001` **IMPLEMENTED LOCALLY** — Define the canonical Project domain fields, ordering, and lifecycle states. **Depends:** None; the server-owned pure domain contract is independent of API and trust-boundary specifications. **Acceptance:** [Requirements §§5.1, 7, and 10](specs/portfolio-cms-requirements.md#51-project-compatibility-contract). **Evidence:** `server/src/projects/project-contract.ts`, colocated contract tests, and `specs/project-data-contract.md`; focused tests, repository quality checks, and public, Admin, and server builds passed on 2026-10-29.
- [x] `MVP-CONTRACT-002` **IMPLEMENTED LOCALLY** — Define published/public Project response types and allowed fields. **Depends:** `MVP-CONTRACT-001` (completed locally). **Acceptance:** [Requirements §§5.1 and 11](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures). **Evidence:** `server/src/projects/public-project-contract.ts` and colocated contract tests; 16 focused tests, repository quality checks with 55 tests, server build, and `git diff --check` passed on 2026-10-29.
- [ ] `MVP-CONTRACT-003` **PROPOSED** — Define protected draft/admin response and mutation types without public leakage. **Depends:** `MVP-CONTRACT-001`, `MVP-SPEC-005`. **Acceptance:** [Requirements §§6, 8, and 14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-CONTRACT-004` **PROPOSED** — Implement boundary-owned Zod validation for source content fields, ordering, URLs, slugs, and operation identifiers; safe Markdown rendering remains gated by `MVP-DETAIL-002`. **Depends:** `MVP-CONTRACT-001`. **Acceptance:** [Requirements §§7 and 14.1](specs/portfolio-cms-requirements.md#7-project-descriptions-slugs-and-featured-selection).
- [x] `MVP-CONTRACT-005` **IMPLEMENTED LOCALLY** — Implement legacy compatibility mapping for existing fields, groups, order, technology order, and links. **Depends:** `MVP-CONTRACT-001` (completed locally). **Acceptance:** [Requirements §5.1](specs/portfolio-cms-requirements.md#51-project-compatibility-contract). **Evidence:** `server/src/projects/public-project-mapper.ts` and colocated compatibility tests; 5 focused tests, repository quality checks with 60 tests, server build, and `git diff --check` passed on 2026-10-29.
- [ ] `MVP-CONTRACT-006` **PROPOSED** — Implement standardized error serialization from typed application errors. **Depends:** `MVP-SPEC-003`, `MVP-FOUND-003`. **Acceptance:** [Requirements §§11 and 14.1](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).

### Milestone 4 — PostgreSQL persistence

- [x] `MVP-DB-001` **IMPLEMENTED LOCALLY** — Add separately approved Drizzle and PostgreSQL dependencies. **Depends:** approved `MVP-SPEC-004`; dependency authorization completed. **Acceptance:** [`CMS-REQ-008`, `012`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition). **Evidence:** exact `drizzle-orm@0.45.4`, `pg@8.23.1`, `drizzle-kit@0.31.10`, and `@types/pg@8.23.1` dependencies; runtime imports, Drizzle Kit CLI version/help, production audit, repository quality checks, server build, and `git diff --check` passed on 2026-10-30.
- [x] `MVP-DB-002` **IMPLEMENTED LOCALLY** — Implement the approved schema; the initial migration remains separately gated. **Depends:** `MVP-DB-001`, `MVP-CONTRACT-001` (completed locally). **Acceptance:** [Requirements §§8–10 and 14.3](specs/portfolio-cms-requirements.md#143-maintainability-and-cost). **Evidence:** `server/src/db/schema/project-schema.ts`; Drizzle schema introspection confirmed seven tables and their expected checks, foreign keys, uniqueness, and indexes; repository quality checks with 60 tests, server build, and `git diff --check` passed on 2026-10-30.
- [x] `MVP-DB-003` **IMPLEMENTED LOCALLY** — Enforce draft/published/Trash, ordering, featured-slot, slug, redirect, and uniqueness constraints. **Depends:** `MVP-DB-002` (completed locally). **Acceptance:** [Requirements §§7–10](specs/portfolio-cms-requirements.md#7-project-descriptions-slugs-and-featured-selection). **Evidence:** `server/drizzle/0000_initial-project-schema.sql` and generated Drizzle metadata, including the seeded `draft_featured_state` singleton; Drizzle Kit migration and schema-generation consistency checks, production audit with zero vulnerabilities, repository quality checks with 60 tests, server build, and `git diff --check` passed on 2026-10-31.
- [ ] `MVP-DB-004` **PROPOSED** — Implement feature repositories and explicit transaction propagation. **Depends:** `MVP-DB-002`, `MVP-FOUND-003`. **Acceptance:** [Requirements §§8–10](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-DB-005` **PROPOSED** — Persist concurrency versions, durable operation IDs, and authoritative Save Draft/publication outcomes. **Depends:** `MVP-DB-003`, `MVP-DB-004`. **Acceptance:** [Requirements §§8–9 and `CMS-DEC-PROJ-033–046`](specs/portfolio-cms-requirements.md#164-cms-dec-proj-033046-publication-and-save-draft-recovery).
- [ ] `MVP-DB-006` **PROPOSED** — Establish isolated migration and PostgreSQL integration-test execution. **Depends:** `MVP-DB-002`, `MVP-FOUND-007`. **Acceptance:** [Requirements §§15.2 and 17.2](specs/portfolio-cms-requirements.md#152-integration-tests).
- [ ] `MVP-DB-007` **PROPOSED** — Document migration commands, transaction boundaries, and rollback limitations before database use. **Depends:** `MVP-DB-002`, `MVP-SPEC-014`. **Acceptance:** [Requirements §§12, 14.3, and 19](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).

### Milestone 5 — Public Projects API

Public API work depends on contracts and persistence, not on completion of the admin editor.

- [ ] `MVP-PAPI-001` **PROPOSED** — Implement published grouped-project list reads. **Depends:** `MVP-CONTRACT-002`, `MVP-DB-004`. **Acceptance:** [Requirements §§5.1 and 11](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).
- [ ] `MVP-PAPI-002` **PROPOSED** — Implement published featured-project reads in slot order. **Depends:** `MVP-CONTRACT-002`, `MVP-DB-004`. **Acceptance:** [Requirements §§7.3 and 11](specs/portfolio-cms-requirements.md#73-featured-projects).
- [ ] `MVP-PAPI-003` **PROPOSED** — Implement published project-detail reads by slug. **Depends:** `MVP-CONTRACT-002`, `MVP-DB-004`. **Acceptance:** [Requirements §§7.1–7.2 and 11](specs/portfolio-cms-requirements.md#7-project-descriptions-slugs-and-featured-selection).
- [ ] `MVP-PAPI-004` **PROPOSED** — Implement safe prior-published-slug redirects. **Depends:** `MVP-PAPI-003`, `MVP-DB-003`. **Acceptance:** [Requirements §7.2](specs/portfolio-cms-requirements.md#72-slugs-and-redirects).
- [ ] `MVP-PAPI-005` **PROPOSED** — Distinguish valid empty and not-found responses from availability failures. **Depends:** `MVP-PAPI-001`, `MVP-PAPI-003`, `MVP-CONTRACT-006`. **Acceptance:** [Requirements §11](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).
- [ ] `MVP-PAPI-006` **PROPOSED** — Filter drafts, Trash, authentication, concurrency, and operation metadata from public responses. **Depends:** `MVP-PAPI-001–003`. **Acceptance:** [Requirements §§11 and 14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-PAPI-007` **PROPOSED** — Apply public freshness and caching rules that expose confirmed publications without polling or redeployment. **Depends:** `MVP-PAPI-001–004`, `MVP-SPEC-003`. **Acceptance:** [Requirements §§9, 11 and `CMS-DEC-PROJ-020–021`](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).

### Milestone 6 — GitHub OAuth and backend authorization

Authentication may proceed independently of public API work once its security contract and administrator identity are approved.

- [ ] `MVP-AUTH-001` **BLOCKED** — Implement GitHub OAuth initiation and callback endpoints against the approved configuration contract without requiring live production credentials. **Depends:** approved `MVP-SPEC-005`, `MVP-FOUND-003`. **Acceptance:** [Requirements §6](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-AUTH-002` **PROPOSED** — Validate OAuth state and callback allowlists. **Depends:** `MVP-AUTH-001`. **Acceptance:** [Requirements §§6 and 14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-AUTH-003` **BLOCKED** — Implement the approved session, expiry, and logout lifecycle. **Depends:** `MVP-AUTH-001`, approved `MVP-SPEC-005`. **Acceptance:** [Requirements §6](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-AUTH-004` **BLOCKED** — Enforce the stable numeric GitHub ID allowlist. **Depends:** approved `MVP-SPEC-006`, `MVP-AUTH-001`. **Acceptance:** [Requirements §6](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-AUTH-005` **BLOCKED** — Implement approved CSRF and cross-origin protections. **Depends:** `MVP-AUTH-003`, approved `MVP-SPEC-005`. **Acceptance:** [Requirements §§6 and 14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-AUTH-006` **PROPOSED** — Apply authorization middleware to every protected operation. **Depends:** `MVP-AUTH-003–005`, `MVP-FOUND-003`. **Acceptance:** [Requirements §§6 and 14.1](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-AUTH-007` **PROPOSED** — Verify allowed, denied, expired, logged-out, and cross-origin identity cases. **Depends:** `MVP-AUTH-001–006`, `MVP-FOUND-006`. **Acceptance:** [Requirements §§15.3–15.4](specs/portfolio-cms-requirements.md#153-api-tests).

### Milestone 7 — Admin dashboard and project editing

- [ ] `MVP-ADMIN-001` **PROPOSED** — Implement authenticated admin routing and session states. **Depends:** `MVP-FOUND-001`, `MVP-AUTH-003–006`. **Acceptance:** [Requirements §§4.1, 6, and 14.2](specs/portfolio-cms-requirements.md#41-included-projects-mvp).
- [ ] `MVP-ADMIN-002` **PROPOSED** — Implement the accessible admin dashboard shell and navigation. **Depends:** `MVP-FOUND-002`, `MVP-ADMIN-001`. **Acceptance:** [Requirements §14.2](specs/portfolio-cms-requirements.md#142-accessibility-and-regression).
- [ ] `MVP-ADMIN-003` **PROPOSED** — Implement the protected project-list/order API and its lifecycle status and draft-ordering UI. **Depends:** `MVP-ADMIN-002`, `MVP-CONTRACT-003`, `MVP-DB-004`, `MVP-AUTH-006`. **Acceptance:** [Requirements §§4.1, 8, and 10](specs/portfolio-cms-requirements.md#41-included-projects-mvp).
- [ ] `MVP-ADMIN-004` **PROPOSED** — Implement protected draft creation and its Zod-backed form feedback. **Depends:** `MVP-ADMIN-002`, `MVP-CONTRACT-003–004`, `MVP-DB-004`, `MVP-AUTH-006`. **Acceptance:** [Requirements §§4.1, 8, and 14.2](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-ADMIN-005` **PROPOSED** — Implement protected draft detail/edit reads and their Zod-backed form feedback. **Depends:** `MVP-ADMIN-003`, `MVP-CONTRACT-003–004`, `MVP-AUTH-006`. **Acceptance:** [Requirements §§4.1, 8, and 14.2](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-ADMIN-006` **PROPOSED** — Implement unsaved-change navigation warnings. **Depends:** `MVP-ADMIN-004–005`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-040`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-ADMIN-007` **BLOCKED** — Verify responsive and keyboard-operable admin editing without adopting an unapproved visual theme. **Depends:** `MVP-ADMIN-001–006`, approved `MVP-SPEC-013`. **Acceptance:** [Requirements §14.2](specs/portfolio-cms-requirements.md#142-accessibility-and-regression).

### Milestone 8 — Save Draft, concurrency, and uncertain-outcome recovery

- [ ] `MVP-SAVE-001` **PROPOSED** — Implement explicit Save Draft without autosave. **Depends:** `MVP-ADMIN-004–005`, `MVP-DB-004–005`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-039`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-002` **PROPOSED** — Enforce one Save Draft in flight for the active editor. **Depends:** `MVP-SAVE-001`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-041`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-003` **PROPOSED** — Lock editing while Save Draft is active. **Depends:** `MVP-SAVE-002`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-042`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-004` **PROPOSED** — Reject stale project and ordering writes through optimistic concurrency. **Depends:** `MVP-DB-005`, `MVP-SAVE-001`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-037`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-005` **PROPOSED** — Present attempted and authoritative values for manual conflict resolution. **Depends:** `MVP-SAVE-004`, `MVP-ADMIN-005`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-038`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-006` **PROPOSED** — Persist a durable Save Draft operation identity and authoritative outcome. **Depends:** `MVP-DB-005`, `MVP-SAVE-001`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-044`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-007` **PROPOSED** — Implement the 30-second timeout and read-only checks every five seconds for up to 60 additional seconds, without automatic resubmission. **Depends:** `MVP-SAVE-006`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-043–045`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).
- [ ] `MVP-SAVE-008` **PROPOSED** — Preserve unresolved outcomes and perform one read-only reopening check. **Depends:** `MVP-SAVE-007`. **Acceptance:** [Requirements §8 and `CMS-DEC-PROJ-046`](specs/portfolio-cms-requirements.md#8-save-draft-concurrency-and-uncertain-write-recovery).

### Milestone 9 — Featured selection and ordering

- [ ] `MVP-FEAT-001` **PROPOSED** — Persist independent featured slots 1–3 in draft state. **Depends:** `MVP-DB-003–004`, `MVP-CONTRACT-001`. **Acceptance:** [Requirements §7.3 and `CMS-DEC-PROJ-006–008`](specs/portfolio-cms-requirements.md#73-featured-projects).
- [ ] `MVP-FEAT-002` **PROPOSED** — Implement accessible featured selection and ordering controls. **Depends:** `MVP-FEAT-001`, `MVP-ADMIN-002–003`. **Acceptance:** [Requirements §§7.3 and 14.2](specs/portfolio-cms-requirements.md#73-featured-projects).
- [ ] `MVP-FEAT-003` **PROPOSED** — Enforce exactly three distinct eligible projects. **Depends:** `MVP-FEAT-001`, `MVP-CONTRACT-004`. **Acceptance:** [Requirements §7.3](specs/portfolio-cms-requirements.md#73-featured-projects).
- [ ] `MVP-FEAT-004` **PROPOSED** — Apply optimistic concurrency to featured ordering. **Depends:** `MVP-FEAT-001`, `MVP-SAVE-004`. **Acceptance:** [Requirements §§7.3 and 8](specs/portfolio-cms-requirements.md#73-featured-projects).
- [ ] `MVP-FEAT-005` **PROPOSED** — Block publication of invalid featured state without changing public state. **Depends:** `MVP-FEAT-003–004`, `MVP-PUB-001`. **Acceptance:** [Requirements §§7.3 and 9](specs/portfolio-cms-requirements.md#73-featured-projects).

### Milestone 10 — Project details, Markdown, slugs, and redirects

- [ ] `MVP-DETAIL-001` **PROPOSED** — Implement optional long-description editing. **Depends:** `MVP-ADMIN-005`, `MVP-CONTRACT-003–004`. **Acceptance:** [Requirements §7.1](specs/portfolio-cms-requirements.md#71-descriptions).
- [ ] `MVP-DETAIL-002` **BLOCKED** — Implement approved safe-Markdown rendering and safe URL handling. **Depends:** approved `MVP-SPEC-011`, `MVP-CONTRACT-004`. **Acceptance:** [Requirements §§7.1 and 14.1](specs/portfolio-cms-requirements.md#71-descriptions).
- [ ] `MVP-DETAIL-003` **PROPOSED** — Implement manual slug validation and published uniqueness. **Depends:** `MVP-CONTRACT-004`, `MVP-DB-003`. **Acceptance:** [Requirements §7.2](specs/portfolio-cms-requirements.md#72-slugs-and-redirects).
- [ ] `MVP-DETAIL-004` **PROPOSED** — Preserve prior published slugs and restrict redirects to current published targets. **Depends:** `MVP-DETAIL-003`, `MVP-DB-003`. **Acceptance:** [Requirements §7.2](specs/portfolio-cms-requirements.md#72-slugs-and-redirects).
- [ ] `MVP-DETAIL-005` **PROPOSED** — Implement the public project-detail presentation. **Depends:** `MVP-PAPI-003–004`, `MVP-DETAIL-002–004`. **Acceptance:** [Requirements §7 and `CMS-DEC-PROJ-009`](specs/portfolio-cms-requirements.md#7-project-descriptions-slugs-and-featured-selection).
- [ ] `MVP-DETAIL-006` **PROPOSED** — Fall back to the plain-text short description when long content is absent. **Depends:** `MVP-DETAIL-005`. **Acceptance:** [Requirements §7.1 and `CMS-DEC-PROJ-012`](specs/portfolio-cms-requirements.md#71-descriptions).
- [ ] `MVP-DETAIL-007` **BLOCKED** — Implement approved linkless-project and internal-detail navigation behavior. **Depends:** approved `MVP-SPEC-009–010`, `MVP-DETAIL-005`. **Acceptance:** [Requirements §§5.1–5.2 and 17.1](specs/portfolio-cms-requirements.md#171-pre-implementation-gates).

### Milestone 11 — Protected full-site preview

Preview depends on authentication, protected draft reads, and the public renderer—not on publication completion.

- [ ] `MVP-PREVIEW-001` **BLOCKED** — Separate public presentation components from static content transport through the approved boundary. **Depends:** approved `MVP-SPEC-002`, `MVP-CONTRACT-005`. **Acceptance:** [Requirements §§5, 6, and 14.3](specs/portfolio-cms-requirements.md#5-existing-repository-and-compatibility-constraints).
- [ ] `MVP-PREVIEW-002` **PROPOSED** — Implement authorized draft preview reads. **Depends:** `MVP-AUTH-006`, `MVP-CONTRACT-003`, `MVP-DB-004`. **Acceptance:** [Requirements §§6 and 14.1](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-PREVIEW-003` **PROPOSED** — Render draft `/`, `/all-projects`, and `/projects/:slug` views using public presentation components. **Depends:** `MVP-PREVIEW-001–002`, `MVP-DETAIL-005`. **Acceptance:** [Requirements §6 and `CMS-DEC-PROJ-016`](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-PREVIEW-004` **PROPOSED** — Display a persistent non-public preview indicator. **Depends:** `MVP-PREVIEW-003`. **Acceptance:** [Requirements §6](specs/portfolio-cms-requirements.md#6-administrator-authentication-and-preview).
- [ ] `MVP-PREVIEW-005` **BLOCKED** — Isolate admin dashboard styling from the public preview renderer through the approved mechanism. **Depends:** approved `MVP-SPEC-012`, `MVP-PREVIEW-003`. **Acceptance:** [Requirements §§6 and 14.3](specs/portfolio-cms-requirements.md#143-maintainability-and-cost).
- [ ] `MVP-PREVIEW-006` **BLOCKED** — Prevent preview caching, indexing, metadata, redirect, fallback, analytics, and normal-log leakage. **Depends:** approved `MVP-SPEC-012`, `MVP-PREVIEW-002–003`. **Acceptance:** [Requirements §§6 and 14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-PREVIEW-007` **PROPOSED** — Verify unauthorized and expired sessions cannot obtain or retain draft preview data. **Depends:** `MVP-PREVIEW-002–006`, `MVP-FOUND-006`. **Acceptance:** [Requirements §§6 and 15.3–15.4](specs/portfolio-cms-requirements.md#153-api-tests).

### Milestone 12 — Atomic publication and recovery

- [ ] `MVP-PUB-001` **PROPOSED** — Build and validate the complete candidate Projects snapshot. **Depends:** `MVP-DB-003–005`, `MVP-FEAT-001`, `MVP-FEAT-003–004`, `MVP-DETAIL-003–004`, `MVP-LIFE-001–002`. **Acceptance:** [Requirements §9](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-002` **PROPOSED** — Atomically publish content, group order, featured slots, slugs, redirects, queued unpublishes, and queued published-project Trash removals. **Depends:** `MVP-PUB-001`, `MVP-FEAT-005`, `MVP-DB-004–005`. **Acceptance:** [Requirements §9 and `CMS-DEC-PROJ-001`](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-003` **PROPOSED** — Persist a durable unique publication operation and authoritative outcome. **Depends:** `MVP-DB-005`, `MVP-PUB-002`. **Acceptance:** [Requirements §9 and `CMS-DEC-PROJ-033`](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-004` **PROPOSED** — Make repeated publication operation IDs idempotent. **Depends:** `MVP-PUB-003`. **Acceptance:** [Requirements §9 and `CMS-DEC-PROJ-033`](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-005` **PROPOSED** — Implement authenticated Publish Updates controls and candidate confirmation. **Depends:** `MVP-AUTH-006`, `MVP-ADMIN-002–003`, `MVP-PUB-001–004`. **Acceptance:** [Requirements §§9 and 14.2](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-006` **PROPOSED** — Implement bounded read-only status checks after an uncertain publication without automatic republishing. **Depends:** `MVP-PUB-003–005`. **Acceptance:** [Requirements §9 and `CMS-DEC-PROJ-034–035`](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-007` **PROPOSED** — Perform one read-only reopening check for unresolved publication. **Depends:** `MVP-PUB-006`. **Acceptance:** [Requirements §9 and `CMS-DEC-PROJ-036`](specs/portfolio-cms-requirements.md#9-atomic-publication-and-recovery).
- [ ] `MVP-PUB-008` **PROPOSED** — Confirm successful publication through fresh public reads without public polling or frontend redeployment. **Depends:** `MVP-PUB-002`, `MVP-PAPI-007`. **Acceptance:** [Requirements §§3, 9, and 11](specs/portfolio-cms-requirements.md#3-objective-and-success-conditions).

### Milestone 13 — Unpublish, Trash, Restore, and permanent-delete safeguards

- [ ] `MVP-LIFE-001` **PROPOSED** — Queue Unpublish in draft state for inclusion in a later Publish Updates candidate. **Depends:** `MVP-DB-003–004`, `MVP-ADMIN-002`, `MVP-CONTRACT-003`, `MVP-AUTH-006`. **Acceptance:** [Requirements §10 and `CMS-DEC-PROJ-004`](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-002` **PROPOSED** — Queue a published project's Trash removal for inclusion in a later Publish Updates candidate. **Depends:** `MVP-DB-003–004`, `MVP-ADMIN-002`, `MVP-CONTRACT-003`, `MVP-AUTH-006`. **Acceptance:** [Requirements §10 and `CMS-DEC-PROJ-002`](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-003` **PROPOSED** — Restore draft-only Trashed projects. **Depends:** `MVP-DB-003–004`, `MVP-ADMIN-003`. **Acceptance:** [Requirements §10](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-004` **PROPOSED** — Cancel a pending published Trash removal when restored before publication. **Depends:** `MVP-LIFE-002–003`. **Acceptance:** [Requirements §10 and `CMS-DEC-PROJ-003`](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-005` **BLOCKED** — Implement Restore after a Trash removal has already been published. **Depends:** approved `MVP-SPEC-007`, `MVP-LIFE-003`. **Acceptance:** [Requirements §§10 and 17.1](specs/portfolio-cms-requirements.md#171-pre-implementation-gates).
- [ ] `MVP-LIFE-006` **BLOCKED** — Implement permanent deletion while preventing active published references. **Depends:** approved `MVP-SPEC-008`, `MVP-LIFE-002–005`. **Acceptance:** [Requirements §§10 and 17.1](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-007` **BLOCKED** — Implement approved post-deletion redirect behavior. **Depends:** approved `MVP-SPEC-008`, `MVP-LIFE-006`. **Acceptance:** [Requirements §§10 and 17.1](specs/portfolio-cms-requirements.md#171-pre-implementation-gates).
- [ ] `MVP-LIFE-008` **PROPOSED** — Require explicit irreversible-action confirmation identifying the project and outcome. **Depends:** `MVP-LIFE-006`, `MVP-ADMIN-002`. **Acceptance:** [Requirements §§10 and 14.2](specs/portfolio-cms-requirements.md#10-project-lifecycle).
- [ ] `MVP-LIFE-009` **PROPOSED** — Verify draft lifecycle actions never modify the live portfolio before publication. **Depends:** `MVP-LIFE-001–008`, `MVP-FOUND-006`. **Acceptance:** [Requirements §§10 and 15](specs/portfolio-cms-requirements.md#15-testing-requirements).

### Milestone 14 — Public portfolio integration

Public integration depends on published read contracts, not on completion of the admin editor.

- [ ] `MVP-WEB-001` **PROPOSED** — Add a typed published-Projects client and legacy compatibility adapter. **Depends:** `MVP-PAPI-001–006`, `MVP-CONTRACT-005`. **Acceptance:** [Requirements §§5.1 and 11](specs/portfolio-cms-requirements.md#51-project-compatibility-contract).
- [ ] `MVP-WEB-002` **PROPOSED** — Replace the first-three-Personal homepage rule with published featured slots. **Depends:** `MVP-WEB-001`, `MVP-PAPI-002`. **Acceptance:** [Requirements §§5.2 and 7.3](specs/portfolio-cms-requirements.md#52-approved-compatibility-exceptions).
- [ ] `MVP-WEB-003` **PROPOSED** — Load published Personal, Work, and Capstone groups on `/all-projects`. **Depends:** `MVP-WEB-001`, `MVP-PAPI-001`. **Acceptance:** [Requirements §§5.1 and 11](specs/portfolio-cms-requirements.md#51-project-compatibility-contract).
- [ ] `MVP-WEB-004` **PROPOSED** — Add public `/projects/:slug`, safe redirects, and approved internal navigation. **Depends:** `MVP-PAPI-003–004`, `MVP-DETAIL-005–007`. **Acceptance:** [Requirements §§5.2 and 7.2](specs/portfolio-cms-requirements.md#52-approved-compatibility-exceptions).
- [ ] `MVP-WEB-005` **PROPOSED** — Implement loading, error, 30-second timeout, and manual Retry behavior with `AbortSignal`. **Depends:** `MVP-WEB-001`, `MVP-PAPI-005`. **Acceptance:** [Requirements §11 and `CMS-DEC-PROJ-017–019`](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).
- [ ] `MVP-WEB-006` **PROPOSED** — Refresh through initial load, navigation, reload, or equivalent user action without public polling. **Depends:** `MVP-WEB-001–005`, `MVP-PAPI-007`. **Acceptance:** [Requirements §§9, 11 and `CMS-DEC-PROJ-020–021`](specs/portfolio-cms-requirements.md#11-public-delivery-and-ordinary-failures).
- [ ] `MVP-WEB-007` **BLOCKED** — Preserve unaffected routes, sections, hash links, external links, theme, motion, keyboard behavior, focus, and responsive layout. **Depends:** `MVP-WEB-001–006`, approved `MVP-SPEC-013`. **Acceptance:** [Requirements §§5.3 and 15.5](specs/portfolio-cms-requirements.md#53-preserved-public-behavior).

### Milestone 15 — Legacy migration and cutover

- [ ] `MVP-MIG-001` **PROPOSED** — Inventory and compare every existing static Project field, group, order, technology, and link. **Depends:** `MVP-BASE-001`. **Acceptance:** [Requirements §§5.1, 12, and 17.2](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).
- [ ] `MVP-MIG-002` **PROPOSED** — Implement deterministic legacy-to-draft import. **Depends:** `MVP-MIG-001`, `MVP-DB-002–004`, `MVP-CONTRACT-005`. **Acceptance:** [Requirements §12](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).
- [ ] `MVP-MIG-003` **PROPOSED** — Produce data-level and rendered comparison evidence. **Depends:** `MVP-MIG-002`, `MVP-PREVIEW-003`. **Acceptance:** [Requirements §§12 and 17.2](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-MIG-004` **BLOCKED** — Prepare the approved published-only migration fallback artifact and restricted window. **Depends:** approved `MVP-SPEC-014`, `MVP-MIG-003`. **Acceptance:** [Requirements §12](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).
- [ ] `MVP-MIG-005` **PROPOSED** — Complete separately authorized initial publication. **Depends:** `MVP-MIG-003`, `MVP-PUB-001–008`, `MVP-OPS-011`. **Acceptance:** [Requirements §§9, 12, and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries).
- [ ] `MVP-MIG-006` **PROPOSED** — Complete cutover-readiness verification and obtain approval of the production cutover runbook without executing the cutover. **Depends:** `MVP-MIG-003–004`, approved `MVP-SPEC-014`, all applicable pre-production gates. **Acceptance:** [Requirements §§12 and 17.2](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-MIG-007` **PROPOSED** — Verify application rollback and data restore remain distinct and never promote drafts or resurrect removed content. **Depends:** `MVP-MIG-006`, `MVP-OPS-009`. **Acceptance:** [Requirements §12](specs/portfolio-cms-requirements.md#12-migration-fallback-cutover-and-rollback).
- [ ] `MVP-MIG-008` **PROPOSED** — Retire automatic migration fallback after PostgreSQL becomes authoritative. **Depends:** successful `MVP-LAUNCH-006–007`; separate authorization. **Acceptance:** [Requirements §§12 and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries).

### Milestone 16 — Backup, encryption, restore, and rehearsal

- [ ] `MVP-OPS-001` **PROPOSED** — Approve local backup location, encrypted off-device handling, weekly procedure, retention, and cleanup procedure. **Depends:** `MVP-SPEC-014`. **Acceptance:** [Requirements §§13 and 17.2](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-002` **BLOCKED** — Implement the Windows-compatible manual PostgreSQL backup script. **Depends:** approved `MVP-OPS-001`, `MVP-DB-002`; separate database-operation authorization. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-022`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-003` **PROPOSED** — Verify archive completeness before a backup counts as retained. **Depends:** `MVP-OPS-002`. **Acceptance:** [Requirements §13](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-004` **PROPOSED** — Document weekly and pre-risk backup execution. **Depends:** `MVP-OPS-002–003`. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-026`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-005` **BLOCKED** — Implement exact-target cleanup preview and separate owner confirmation without forcing retention to exactly five. **Depends:** approved `MVP-OPS-001`, `MVP-OPS-003`. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-024–025`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-006` **BLOCKED** — Implement destination-verified restore with explicit destructive confirmation. **Depends:** approved `MVP-OPS-001`, `MVP-OPS-003`; separate database-operation authorization. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-027`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-007` **BLOCKED** — Verify Neon supports a fresh isolated rehearsal branch within the zero-cost constraint. **Depends:** `MVP-LAUNCH-001`; infrastructure inspection requires separate authorization. **Acceptance:** [Requirements §§13 and 17.2](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-OPS-008` **PROPOSED** — Import an actual backup archive into a fresh isolated Neon test branch. **Depends:** `MVP-OPS-003`, `MVP-OPS-006–007`; separate authorization. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-028–031`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-009` **PROPOSED** — Verify restored draft, published, featured, ordering, slug/redirect, Trash, concurrency, and recovery state. **Depends:** `MVP-OPS-008`. **Acceptance:** [Requirements §13](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-010` **PROPOSED** — Document owner-managed rehearsal-branch deletion and immediate authorization required for production restore. **Depends:** `MVP-OPS-008–009`. **Acceptance:** [Requirements §13 and `CMS-DEC-PROJ-032`](specs/portfolio-cms-requirements.md#13-backup-and-restore-requirements).
- [ ] `MVP-OPS-011` **BLOCKED** — Execute and verify the separately authorized pre-cutover backup without performing migration or cutover. **Depends:** approved `MVP-OPS-001`, `MVP-OPS-002–004`, `MVP-MIG-006`; separate database-operation authorization. **Acceptance:** [Requirements §§12–13, 17.2, and 19](specs/portfolio-cms-requirements.md#172-pre-production-gates).

### Milestone 17 — Testing, accessibility, and security acceptance

Focused tests accompany their implementation tasks; these tasks close system-wide acceptance gaps.

- [ ] `MVP-QA-001` **PROPOSED** — Complete unit coverage for validation, compatibility, Markdown/URLs, slugs, featured invariants, lifecycle, recovery, and fallback decisions. **Depends:** corresponding feature tasks, `MVP-FOUND-006`. **Acceptance:** [Requirements §15.1](specs/portfolio-cms-requirements.md#151-unit-tests).
- [ ] `MVP-QA-002` **PROPOSED** — Complete PostgreSQL integration coverage for persistence, separation, recovery, publication, lifecycle, migration, and backup import. **Depends:** `MVP-DB-006` and corresponding feature tasks. **Acceptance:** [Requirements §15.2](specs/portfolio-cms-requirements.md#152-integration-tests).
- [ ] `MVP-QA-003` **PROPOSED** — Complete Supertest API coverage for auth, public filtering, concurrency, idempotency, recovery, redirects, and failure distinctions. **Depends:** corresponding API/auth tasks, `MVP-FOUND-006`. **Acceptance:** [Requirements §15.3](specs/portfolio-cms-requirements.md#153-api-tests).
- [ ] `MVP-QA-004` **PROPOSED** — Complete Playwright end-to-end coverage for allowed/denied identities, editing, recovery, preview, publication, lifecycle, details, and Retry. **Depends:** corresponding admin/public tasks, `MVP-FOUND-006`. **Acceptance:** [Requirements §15.4](specs/portfolio-cms-requirements.md#154-end-to-end-tests).
- [ ] `MVP-QA-005` **PROPOSED** — Complete public regression coverage for content, grouping, links, layouts, theme, motion, keyboard, focus, and draft-data absence. **Depends:** `MVP-WEB-001–007`, `MVP-FOUND-006`. **Acceptance:** [Requirements §15.5](specs/portfolio-cms-requirements.md#155-regression-tests).
- [ ] `MVP-QA-006` **BLOCKED** — Complete approved keyboard, focus, semantics, viewport, and assistive-technology acceptance. **Depends:** approved `MVP-SPEC-013`, admin/public feature completion. **Acceptance:** [Requirements §§14.2 and 17.2](specs/portfolio-cms-requirements.md#142-accessibility-and-regression).
- [ ] `MVP-QA-007` **PROPOSED** — Verify drafts, Trash, preview, authentication, concurrency, and operation metadata never leak publicly. **Depends:** public/protected API and preview completion. **Acceptance:** [Requirements §§14.1 and 15](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-QA-008` **PROPOSED** — Complete security acceptance for OAuth, sessions, CSRF, CORS, replay, Markdown, URLs, redirects, secrets, and destructive actions. **Depends:** auth/lifecycle/detail completion. **Acceptance:** [Requirements §§14.1 and 17.2](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-QA-009` **PROPOSED** — Review approved dependencies, structured-log redaction, secret handling, and supply-chain findings before launch. **Depends:** installed production dependency set. **Acceptance:** [Requirements §§14.1, 17.2, and 19](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-QA-010` **PROPOSED** — Record and resolve launch-blocking defects without deleting, skipping, or weakening tests. **Depends:** `MVP-QA-001–009`. **Acceptance:** [Requirements §§15 and 17.2](specs/portfolio-cms-requirements.md#15-testing-requirements).

### Milestone 18 — Zero-cost hosting, production readiness, and launch

- [ ] `MVP-LAUNCH-001` **PROPOSED** — Verify zero-cost feasibility for public/admin Vercel, Render, Neon, and Neon rehearsal branches. **Depends:** approved inspection task; no provisioning. **Acceptance:** [`CMS-REQ-005`, `011–012` and Requirements §17.2](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-LAUNCH-002` **BLOCKED** — Provision approved external resources and credentials. **Depends:** successful `MVP-LAUNCH-001`; separate external-resource and credential authorization. **Acceptance:** [Requirements §§17.2 and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries).
- [ ] `MVP-LAUNCH-003` **PROPOSED** — Configure production-safe environment validation and secret handling. **Depends:** `MVP-LAUNCH-002`, `MVP-FOUND-004`. **Acceptance:** [Requirements §14.1](specs/portfolio-cms-requirements.md#141-security).
- [ ] `MVP-LAUNCH-004` **BLOCKED** — Prepare deployment, health, smoke-test, monitoring, and rollback procedures. **Depends:** approved `MVP-SPEC-014`, application completion. **Acceptance:** [Requirements §§12, 17.2, and 19](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-LAUNCH-005` **PROPOSED** — Deploy backend and admin applications. **Depends:** `MVP-LAUNCH-002–004`, `MVP-QA-010`; separate deployment authorization. **Acceptance:** [Requirements §§17.2 and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries).
- [ ] `MVP-LAUNCH-006` **PROPOSED** — Run the separately authorized production migration and cutover exactly once using the approved runbook. **Depends:** `MVP-MIG-001–007`, `MVP-OPS-009`, `MVP-OPS-011`, `MVP-LAUNCH-005`; separate authorization. **Acceptance:** [Requirements §§12, 17.2, and 19](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-LAUNCH-007` **PROPOSED** — Verify public freshness, authorization, preview isolation, accessibility, and failure recovery in production. **Depends:** `MVP-LAUNCH-005–006`. **Acceptance:** [Requirements §§3 and 17.2](specs/portfolio-cms-requirements.md#3-objective-and-success-conditions).
- [ ] `MVP-LAUNCH-008` **PROPOSED** — Confirm verified backup, restore, and rollback readiness. **Depends:** `MVP-OPS-001–010`, `MVP-LAUNCH-006–007`. **Acceptance:** [Requirements §§12–13 and 17.2](specs/portfolio-cms-requirements.md#172-pre-production-gates).
- [ ] `MVP-LAUNCH-009` **PROPOSED** — Obtain final owner launch acceptance. **Depends:** all MVP acceptance gates and `MVP-LAUNCH-007–008`. **Acceptance:** [Requirements §§3, 17.2, and 19](specs/portfolio-cms-requirements.md#19-approval-boundaries).

## Deferred non-blocking registry

These entries are not required for Projects MVP completion. Their unchecked boxes do not block launch and do not authorize later implementation.

- [ ] `DEFER-001` **DEFERRED** — Manage Profile/About, Skills, Experience/Education, Social Links, résumé, navigation, or interface text through the CMS. **Depends:** Future owner-approved release scope. **Acceptance:** [Requirements §4.2](specs/portfolio-cms-requirements.md#42-deferred-product-scope).
- [ ] `DEFER-002` **DEFERRED** — Add project-image management and Cloudinary. **Depends:** Future owner-approved release scope. **Acceptance:** [`CMS-REQ-010` and Requirements §4.2](specs/portfolio-cms-requirements.md#42-deferred-product-scope).
- [ ] `DEFER-003` **DEFERRED** — Add Blog content, categories, tags, search, and filtering. **Depends:** Future owner-approved release scope. **Acceptance:** [`CMS-REQ-018–019`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition).
- [ ] `DEFER-004` **DEFERRED** — Add general SEO, navigation, and interface-text management beyond MVP slugs/redirects. **Depends:** Future owner-approved release scope. **Acceptance:** [`CMS-REQ-020` and Requirements §4.2](specs/portfolio-cms-requirements.md#42-deferred-product-scope).
- [ ] `DEFER-005` **DEFERRED** — Add scheduled publishing or browsable historical content revisions. **Depends:** Future owner-approved release scope. **Acceptance:** [`CMS-REQ-017`, `021`](specs/portfolio-cms-requirements.md#2-original-requirements-and-lean-disposition).
- [ ] `DEFER-006` **DEFERRED** — Implement operation-record cleanup, audit reporting, temporary-file controls, and incident-resolution infrastructure. **Depends:** Separately approved design and task. **Acceptance:** [`CMS-DEC-PROJ-047–067`](specs/portfolio-cms-requirements.md#165-cms-dec-proj-047061-deferred-cleanup-audit-and-temporary-file-subsystem).

## Next proposed task

`MVP-FOUND-001` remains the next proposed implementation task after separate owner approval. It creates only the minimal admin shell and does not authorize dependencies, visual design, CMS features, backend integration, preview work, or Git operations.

## Activity-log convention

Append one concise entry after an authorized task:

```text
YYYY-MM-DD — Task/approval reference — Result
Files: exact paths
Verification: commands and outcomes
Delivery: implemented / committed / pushed / merged / deployed statuses
Open: blockers, risks, and next proposed task
```

Use Asia/Manila dates. Record facts and evidence; do not use `Done` as a substitute for delivery fields.

2026-10-29 — `MVP-CONTRACT-001` authorized implementation — Verified locally
Files: `server/src/projects/project-contract.ts`, `server/src/projects/project-contract.test.ts`, `docs/specs/project-data-contract.md`, `docs/PROGRESS-TRACKER.md`
Verification: 15 focused contract tests passed; `npm run quality:check` passed with 39 tests; server, Admin, and public builds passed; `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Linkless-project publication and presentation behavior remains unresolved under `MVP-SPEC-009`; no API, persistence, authentication, or UI behavior was implemented.

2026-10-29 — `MVP-SPEC-002` authorized specification — Verified locally
Files: `docs/specs/public-project-presentation-contract.md`, `docs/PROGRESS-TRACKER.md`
Verification: requirements traceability, Markdown trailing-whitespace scan, exact two-file scope, and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: `MVP-SPEC-009–014` retain their recorded linkless-project, navigation, Markdown, preview, accessibility-matrix, and migration/cutover gates; no application behavior was implemented.

2026-10-29 — `MVP-SPEC-003` authorized specification — Verified locally
Files: `docs/specs/projects-api-trust-boundary.md`, `docs/PROGRESS-TRACKER.md`
Verification: requirements traceability, Markdown trailing-whitespace scan, exact two-file scope, and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Authentication/session, persistence, unresolved lifecycle, linkless-project, navigation, Markdown, preview, and migration/cutover decisions retain their recorded gates; no API, schema, authentication, database, or UI behavior was implemented.

2026-10-29 — `MVP-CONTRACT-002` authorized implementation — Verified locally
Files: `server/src/projects/public-project-contract.ts`, `server/src/projects/public-project-contract.test.ts`, `docs/PROGRESS-TRACKER.md`
Verification: 16 focused contract tests passed; `npm run quality:check` passed with 55 tests; server build and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Linkless-project presentation behavior remains unresolved under `MVP-SPEC-009`; no routes, persistence, authentication, or frontend adapters were implemented.

2026-10-29 — `MVP-CONTRACT-005` authorized implementation — Verified locally
Files: `server/src/projects/public-project-mapper.ts`, `server/src/projects/public-project-mapper.test.ts`, `docs/PROGRESS-TRACKER.md`
Verification: 5 focused compatibility tests passed; `npm run quality:check` passed with 60 tests; server build and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Linkless-project presentation behavior remains unresolved under `MVP-SPEC-009`; no routes, persistence, authentication, or frontend adapters were implemented.

2026-10-29 — `MVP-SPEC-004` authorized specification — Verified locally
Files: `docs/specs/database-persistence-contract.md`, `docs/PROGRESS-TRACKER.md`
Verification: requirements traceability, Markdown trailing-whitespace scan, exact two-file scope, and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Dependencies, schema implementation, migrations, and database access remain separately gated. `MVP-SPEC-007–009` retain unresolved lifecycle, redirect, and linkless-publication policies; `MVP-SPEC-014` retains migration, backup, restore, cutover, rollback, and Neon-feasibility decisions.

2026-10-30 — `MVP-DB-001` authorized dependency installation — Verified locally
Files: `server/package.json`, `package-lock.json`, `docs/PROGRESS-TRACKER.md`
Verification: exact dependency versions and reviewed lockfile changes confirmed; server runtime imports and Drizzle Kit CLI version/help passed; `npm audit --omit=dev` reported zero vulnerabilities; `npm run quality:check` passed with 60 tests; server build and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Development-only `GHSA-67mh-4wv8-2f99` remains provisionally accepted for local Drizzle tooling; no esbuild development server is exposed or required by this task. Schema, migrations, database access, and PostgreSQL connectivity remain separately gated.

2026-10-30 — `MVP-DB-002` authorized schema implementation — Verified locally
Files: `server/src/db/schema/project-schema.ts`, `docs/PROGRESS-TRACKER.md`
Verification: Drizzle schema introspection confirmed exactly seven tables and the expected checks, foreign keys, uniqueness, and indexes; `npm run quality:check` passed with 60 tests; server build and `git diff --check` passed.
Delivery: implemented locally: Yes; committed: No; pushed: No; merged: Not established; deployed: No.
Open: Initial migration generation and application, database connections and access, repositories, and API routes remain separately gated. No unresolved lifecycle behavior was added.
