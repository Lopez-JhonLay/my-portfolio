# Portfolio CMS — Lean Projects MVP Requirements Baseline

**Status:** Owner-approved requirements baseline  
**Governing scope decision:** `CMS-SCOPE-MVP-001`  
**Approved source:** Portfolio CMS Lean MVP Revision Draft 4  
**Implementation authorization:** Not granted  
**SDD stage:** Requirements baseline approved; technical specifications, plans, tasks, implementation, schema changes, database operations, migration, Git writes, infrastructure changes, and deployment require separate approval  

No owner-approval timestamp is recorded because none was supplied.

## 1. Document authority and source precedence

This document is the authoritative requirements baseline for the Projects-first Portfolio CMS lean MVP. It reconciles the original requirements, the approved lean scope, the historical detailed decision summaries supplied by the owner, repository evidence, and the owner-approved Revision Draft 4.

When interpreting this baseline, use the following precedence:

1. Owner-approved Lean MVP Revision Draft 4, as formalized here.
2. `CMS-SCOPE-MVP-001`.
3. `CMS-DEC-PROJ-001` through `CMS-DEC-PROJ-067`.
4. `CMS-REQ-001` through `CMS-REQ-027`.
5. Repository evidence for existing behavior and compatibility.

Missing verbatim historical decision text must not be reconstructed. Where only an owner-approved summary is available, this document identifies it as a summary rather than repository-verified wording.

Approval of this baseline does not approve a module design, implementation plan, dependency, API shape, database schema, migration, external resource, credential, Git operation, production cutover, or deployment.

## 2. Original requirements and lean disposition

The original requirements remain historically authoritative. `DEFER` means retained for a later release, not cancelled. `SIMPLIFY` means the required outcome remains while Revision Draft 4 narrows its MVP procedure. `KEEP` means the requirement remains operative as stated or as clarified by the approved detailed decisions.

| ID | Original approved requirement | Lean disposition | Reconciled treatment |
|---|---|---|---|
| `CMS-REQ-001` | Eventually manage Projects, Profile/About, Skills, Experience/Education, Social Links, Media/Résumé, Blog, SEO Metadata, and Website Navigation/Text. | DEFER in part | Projects are the MVP; every other named content area remains future scope. |
| `CMS-REQ-002` | One administrator. | KEEP | One backend-authorized GitHub identity. |
| `CMS-REQ-003` | Draft and publish workflow. | KEEP | Explicit Save Draft and atomic batch Publish Updates. |
| `CMS-REQ-004` | Near-immediate publishing through APIs without mandatory frontend redeployment. | KEEP | Confirmed publications are returned by fresh public reads without a Vercel rebuild. |
| `CMS-REQ-005` | Strictly zero monthly operating cost. | KEEP, GATED | Provider and usage feasibility must be verified before provisioning and production. |
| `CMS-REQ-006` | Separate Node.js backend. | KEEP | Backend remains separate from both Vite frontends. |
| `CMS-REQ-007` | Express.js backend framework. | KEEP | New backend uses Express. |
| `CMS-REQ-008` | PostgreSQL database. | KEEP | Deployed persistence uses Neon PostgreSQL. |
| `CMS-REQ-009` | GitHub OAuth for administrator authentication. | KEEP | OAuth authentication is combined with one stable-ID allowlist authorization check. |
| `CMS-REQ-010` | Cloudinary for media storage. | DEFER | Media and project-image management are outside the MVP. The future requirement is preserved. |
| `CMS-REQ-011` | Render Free Web Service for backend hosting. | KEEP, GATED | Subject to current zero-cost feasibility and acceptance testing. |
| `CMS-REQ-012` | Neon for PostgreSQL hosting. | KEEP, GATED | Subject to database and test-branch feasibility. |
| `CMS-REQ-013` | Gradual migration of existing portfolio content with a temporary, carefully controlled static fallback. | SIMPLIFY | Static fallback is migration-only. Normal database-authoritative failures use errors and manual Retry. |
| `CMS-REQ-014` | Draft edits remain separate from the currently published version until explicitly published. | KEEP | Applies to edits, unpublish, published-project Trash removal, featured ordering, slugs, and redirects. |
| `CMS-REQ-015` | Protected full website preview using the portfolio's actual components. | KEEP | Includes draft `/`, `/all-projects`, and `/projects/:slug` presentation. |
| `CMS-REQ-016` | Soft deletion with Trash and Restore; permanent deletion requires explicit confirmation. | KEEP | Unresolved lifecycle transitions remain blocked rather than inferred. |
| `CMS-REQ-017` | No historical revision tracking. | KEEP | Operational outcome records needed for idempotency are not browsable content history. |
| `CMS-REQ-018` | Markdown blog editor. | DEFER | Blog remains future scope. Project long descriptions use safe Markdown under separate approved decisions. |
| `CMS-REQ-019` | Blog categories, tags, search, and filtering. | DEFER | Future Blog scope. |
| `CMS-REQ-020` | Basic SEO: titles, descriptions, readable URLs, social metadata, and sharing images. | DEFER in part | General SEO is deferred; project slugs and safe prior-slug redirects are included in the MVP. |
| `CMS-REQ-021` | Manual publishing only; no scheduled publishing. | KEEP | Publish Updates is an explicit administrator action. |
| `CMS-REQ-022` | Manual database backups and documented restore procedures. | KEEP | Expanded by `CMS-DEC-PROJ-022–032`; no mandatory automatic schedule is introduced. |
| `CMS-REQ-023` | Comprehensive automated testing, including unit, integration, API, end-to-end, and regression tests. | KEEP | All five categories remain mandatory. |
| `CMS-REQ-024` | Milestone-based autonomous development. Each implementation task requires owner approval, and the agent must stop after reporting results. | KEEP | Baseline approval does not authorize any implementation task. |
| `CMS-REQ-025` | Existing JavaScript frontend remains JavaScript; new Express backend uses TypeScript. | KEEP | A separate React/Vite admin frontend is also required; its language details require an approved technical specification. |
| `CMS-REQ-026` | One repository, retaining the existing frontend structure and introducing a separate `server/` directory. | KEEP | Public frontend, separate admin frontend, and `server/` remain in one repository. |
| `CMS-REQ-027` | Projects-first MVP. Other content areas are deferred to later releases. | KEEP | Governing release boundary. |

## 3. Objective and success conditions

The MVP shall allow the one authorized administrator to create and explicitly save project drafts, preview them in the real portfolio, and atomically publish an approved Projects snapshot without requiring a public-frontend redeployment.

The MVP succeeds only when:

- Drafts cannot affect public content before successful Publish Updates.
- Atomic publication cannot expose a partial Projects snapshot.
- Stale and uncertain writes are handled according to the approved recovery rules.
- The public portfolio preserves its existing behavior except for explicitly approved featured-selection and project-detail additions.
- Migration, backup, restore, authorization, accessibility, regression, and zero-cost gates pass before production cutover.
- Each implementation task and each production-affecting operation has its own explicit owner authorization.

## 4. Included and deferred scope

### 4.1 Included Projects MVP

- One GitHub-authenticated, stable-ID-allowlisted administrator.
- Separate React/Vite admin frontend in the same repository.
- Independent admin Vercel project, subject to zero-cost feasibility.
- Express/TypeScript backend under `server/`.
- Neon PostgreSQL persistence.
- Project creation, editing, explicit Save Draft, and draft ordering.
- Protected full-site draft preview.
- Atomic batch Publish Updates.
- Exactly three manually selected featured projects with independent slots 1, 2, and 3.
- Published and protected-preview `/projects/:slug` routes.
- Plain-text card descriptions and optional safe-Markdown long descriptions.
- Queued Unpublish, queued published-project Trash removal, Restore, and separately confirmed permanent deletion.
- Optimistic concurrency and uncertain-write recovery.
- Public loading, error, 30-second timeout, and manual Retry behavior.
- Controlled migration, rollback, backup, and verified restore.
- Unit, integration, API, end-to-end, and regression tests.

### 4.2 Deferred product scope

- CMS management of Profile/About, Skills, Experience/Education, Social Links, résumé/media, Blog, general SEO metadata, navigation, and interface text.
- Project images and Cloudinary implementation.
- Scheduled publishing.
- Historical content revision tracking.
- Any new public content type beyond Projects.

### 4.3 Deferred advanced maintenance

`CMS-DEC-PROJ-047–067` are deferred as a connected maintenance subsystem. They cover completed Save Draft operation-record retention and protected cleanup, production cleanup attestations, audit-report and JSON management, local-directory and temporary-file safety, and incident-resolution infrastructure.

Deferral does not authorize destructive operation-record cleanup, deletion of audit or incident evidence, or implementation or execution of the deferred cleanup workflow. Any such work requires a separately approved design and task.

## 5. Existing repository and compatibility constraints

Repository evidence at baseline formalization shows:

- A React 18/Vite 6 JavaScript public frontend.
- `BrowserRouter` with `/` and `/all-projects` routes.
- Static portfolio content in `src/data/portfolio.js`.
- No existing backend, admin frontend, database layer, authentication system, automated test suite, or CI workflow.
- Vercel SPA path rewriting to `index.html`.
- Existing theme, navigation, animations, reduced-motion rules, keyboard focus treatment, and responsive layouts.

### 5.1 Project compatibility contract

The CMS and public API compatibility layer shall preserve:

| Field | Required behavior |
|---|---|
| `number` | Required display string. |
| `name` | Required. |
| `category` | Required. |
| `description` | Required plain-text card description. |
| `role` | Optional and omitted when absent. |
| `tech` | Required ordered list of strings. |
| `repo` | Optional external URL. |
| `liveUrl` | Optional external URL. |

The system shall also preserve:

- Personal, Work, and Capstone project grouping.
- Personal → Work → Capstone group presentation on `/all-projects`.
- Existing within-group ordering.
- Technology ordering.
- `liveUrl || repo` external-link priority.
- “View Live Site” when `liveUrl` exists and “View Repository” otherwise.
- Existing external-link behavior.

The behavior of a new project with neither `liveUrl` nor `repo` remains unresolved.

### 5.2 Approved compatibility exceptions

- Manually selected featured projects in slots 1, 2, and 3 supersede the current first-three-Personal-Projects homepage rule.
- `/projects/:slug` is a new approved public and preview route.
- Manual slugs, safe prior-published-slug redirects, and optional Markdown long descriptions extend the legacy project model without removing legacy fields.

### 5.3 Preserved public behavior

Except for the approved exceptions, the implementation shall preserve:

- Homepage and `/all-projects`.
- Existing navigation and hash links.
- Project cards and external project links.
- Theme initialization, light/dark switching, and transition fallback.
- Desktop and mobile layouts.
- Animations, hover behavior, and reduced-motion behavior.
- Keyboard operation, visible focus, navigation labels, and semantic structure.
- Existing About, Experience, Skills, Contact, Footer, résumé, mail, and social-link behavior.

## 6. Administrator authentication and preview

- GitHub OAuth authenticates the administrator.
- Backend authorization shall allow exactly one configured stable GitHub numeric user ID. A login name alone is insufficient.
- Every admin, preview, publication, backup, restore, and destructive operation requires server-side authorization.
- Unauthorized users shall not receive draft, Trash, preview, or operation-status data.
- OAuth state, callback allowlisting, session expiration, logout, CSRF protection, cookie/token storage, transport security, and cross-origin behavior require approval and testing before release.
- Protected preview shall use the actual public portfolio components for draft `/`, `/all-projects`, and `/projects/:slug` views.
- Preview shall clearly identify itself as non-public.
- Previewing shall not publish, populate a public cache, generate fallback content, or expose drafts through public APIs, redirects, metadata, or normal logs.

## 7. Project descriptions, slugs, and featured selection

### 7.1 Descriptions

- Card `description` remains plain text.
- The separate long description is optional.
- When present, the long description is authored and rendered as safely sanitized Markdown.
- Executable markup, script injection, and unsafe URL protocols are prohibited.
- When the long description is absent, the detail page displays the short description as plain text.

### 7.2 Slugs and redirects

- Slugs are manually entered and validated.
- Published slugs are unique.
- `/projects/:slug` returns published project content only.
- Changing a previously published slug creates a safe redirect from the prior published slug to the current published slug.
- A redirect is public only while its target resolves to an authorized published representation.
- Redirects shall never disclose or route to draft-only, unpublished, or Trashed content.
- Unknown or non-public slugs use the approved not-found behavior.

### 7.3 Featured projects

- Featured projects are manually selected.
- Each successfully published snapshot contains exactly three distinct eligible featured projects.
- Featured order is independent of category and within-group order.
- Slots 1, 2, and 3 are explicit and unique.
- The homepage renders the three published featured projects in slot order.
- Invalid featured state blocks publication without altering public state.

## 8. Save Draft, concurrency, and uncertain-write recovery

- Creating or editing a project changes draft state only.
- Save Draft is explicit; there is no autosave.
- Unsaved-change navigation warnings are required.
- Only one Save Draft may be in flight for the active editing context.
- Editing is locked while that Save Draft is active.
- Project edits and featured ordering use optimistic concurrency.
- A stale write is rejected without overwriting newer data.
- Conflict resolution is manual and presents attempted and authoritative values side by side.
- Save Draft has a 30-second request timeout.
- An uncertain timeout or lost response starts read-only outcome verification; the mutation is not automatically resubmitted.
- Verification occurs every five seconds for up to 60 additional seconds.
- If the outcome remains unresolved, the dashboard preserves and visibly reports the uncertainty.
- Reopening the dashboard performs one read-only check for an unresolved Save Draft.
- The UI shall not report definitive success or failure without an authoritative outcome.

The timing and polling behavior above is the approved baseline. An equivalent simpler recovery design may replace it only after separate owner review and approval supported by tests demonstrating the same or stronger observable safety. The lean MVP does not require the deferred operation-log cleanup, audit-report, or incident-resolution subsystem.

## 9. Atomic publication and recovery

- Publish Updates is an explicit authenticated operation.
- It atomically publishes the complete candidate Projects update set.
- The batch includes project content, group order, featured slots, slug changes and redirects, queued unpublishes, and queued published-project Trash removals.
- Either the complete candidate becomes public or the previous published state remains public.
- Every publication has a durable unique operation ID and one authoritative outcome.
- Reusing an operation ID cannot create a second logical publication.
- An uncertain publication starts bounded read-only status checks and never automatic republishing.
- Checks occur every five seconds within a 60-second window.
- If the outcome remains unresolved, reopening the dashboard performs one read-only check.
- Confirmed successful publication shall be visible to fresh public reads.
- Public polling is not required; public data refreshes through initial load, navigation, reload, or equivalent user-triggered reads.
- Publication-operation metadata required for idempotency is not browsable content revision history.

The timing, durability, idempotency, and polling behavior above is the approved baseline. An equivalent simpler design requires separate owner review, approval, and evidence before it may supersede these requirements.

## 10. Project lifecycle

- Unpublish is queued in draft state and affects public content only after successful Publish Updates.
- Trashing a currently published project queues its public removal until successful Publish Updates.
- Restore before publication of a pending Trash removal cancels that pending removal.
- Draft actions alone shall not unexpectedly modify the live portfolio.
- Normal deletion is soft deletion with Trash and Restore.
- Permanent deletion requires a separate explicit confirmation identifying the project and irreversible outcome.
- Permanent deletion is not implied by Trash, unpublish, restore, or publication.
- No additional mandatory Unpublish or Restore step may be introduced without a demonstrated safety need and separate owner approval.

The following transitions remain unresolved:

- Restore after a Trash removal has already been published.
- Permanent deletion while a published representation or published-slug redirect may remain active.
- Public redirect behavior after permanent deletion.

Until those rules are approved, permanent deletion shall be blocked whenever potentially active published content or redirect references may exist. This is a temporary safety gate and does not select the final lifecycle.

## 11. Public delivery and ordinary failures

- Public APIs return published content and fields only.
- Draft, Trash, concurrency, authentication, and operation-recovery metadata are excluded.
- The homepage, `/all-projects`, and `/projects/:slug` use published data.
- A public Projects read displays a non-destructive loading state.
- The read times out after 30 seconds.
- Timeout, transport failure, malformed response, or server failure displays a clear error with manual Retry.
- Retry performs a fresh public read.
- Valid empty and valid not-found results are not availability failures.
- Normal database-authoritative operation shall not substitute stale static content.
- Errors shall not expose secrets or sensitive internals.

## 12. Migration, fallback, cutover, and rollback

- Existing static project content remains authoritative before separately approved cutover.
- Existing values, categories, order, optional fields, technologies, and links shall be inventoried and migrated without silent change.
- Draft import, rendered comparison, initial publication, cutover, and fallback retirement are separately verified stages.
- Automatic static fallback is restricted to an explicitly approved migration window.
- A fallback artifact contains only an owner-approved published snapshot and never draft or preview content.
- Fallback logic distinguishes availability failure from valid empty, not-found, unpublish, published Trash removal, and deletion outcomes.
- After PostgreSQL becomes authoritative, ordinary failures use the loading, error, and manual-Retry behavior in Section 11.
- Automatic static fallback is then retired.
- Any later snapshot rollback is an explicitly authorized recovery operation, not an ordinary request fallback.
- Fallback and rollback shall never promote a draft or resurrect intentionally unpublished, removed, or permanently deleted content.
- Application rollback and data restore are separate operations.
- Production migration, cutover, rollback, and restore each require separate owner authorization.

## 13. Backup and restore requirements

The following requirements from `CMS-DEC-PROJ-022–032` remain mandatory:

1. Backups use a manually run PostgreSQL backup script compatible with the approved Windows environment.
2. Each backup set is stored locally and copied to encrypted off-device storage.
3. Retain the latest five fully verified backup sets.
4. Older eligible sets may be removed only after a preview identifies the exact targets and the owner explicitly confirms deletion.
5. If cleanup is cancelled, blocked, or unsafe, preserve the additional backup sets.
6. Cleanup shall never be forced merely to reduce the retained count to exactly five.
7. Backups are run weekly and before migrations, destructive operations, production cutover, or other approved risky operations.
8. The protected local restore script verifies its destination and requires explicit destructive confirmation.
9. Restore rehearsals normally use an isolated test database.
10. Each rehearsal uses a fresh, separate Neon test branch within the same Neon project and imports the actual backup archive.
11. The owner manually deletes rehearsal branches.
12. Backup files, archives, reports, and credentials are excluded from Git and public hosting.
13. Restore verification covers draft, published, featured, ordering, slug/redirect, Trash, concurrency, and required operation-recovery state.
14. Production restore requires separate immediate owner authorization.
15. Backup verification, encryption, production authorization, and restore rehearsal shall not be weakened.
16. Automatic backup scheduling is not mandatory for the MVP.

If the applicable Neon free tier cannot support the approved branch workflow, work stops for owner resolution rather than silently substituting or weakening the procedure.

## 14. Security, accessibility, and maintainability

### 14.1 Security

- Authentication and authorization are enforced by the backend for every protected operation.
- All untrusted input receives backend runtime validation independent of TypeScript, frontend checks, or PropTypes.
- Secrets shall not be hard-coded, committed, sent to public clients, or written to normal logs.
- Before credentials are introduced, `.env`, `.env.*`, and equivalent secret-bearing files shall be protected against accidental Git commits. Only explicitly approved non-secret examples may be tracked.
- Safe Markdown rendering shall prevent executable or unsafe content.
- Publication and destructive actions shall resist unauthorized invocation and accidental replay.
- Public APIs and fallback artifacts shall not expose drafts, Trash data, or administrative metadata.

### 14.2 Accessibility and regression

- Existing keyboard, focus, semantic heading, navigation-label, theme, responsive, animation, and reduced-motion behavior shall not regress.
- Admin forms, conflict views, dialogs, preview controls, status messages, Retry controls, and destructive confirmations shall be keyboard operable and programmatically labelled.
- Supported browsers, WCAG target, assistive-technology coverage, and regression viewport matrix remain approval gates.

### 14.3 Maintainability and cost

- The public frontend remains JavaScript/JSX and the Express backend uses TypeScript.
- Public presentation components shall be separated from content transport through a documented compatibility boundary.
- Database migrations, API contracts, environment requirements, backup/restore, and operational limitations shall be documented before use.
- The approved providers remain Vercel, Render Free, Neon, GitHub OAuth, and later Cloudinary, subject to verified zero-cost feasibility.
- A paid tier, billing change, or provider substitution requires explicit owner approval.

## 15. Testing requirements

All five categories required by `CMS-REQ-023` remain mandatory:

### 15.1 Unit tests

- Validation and legacy compatibility mapping.
- Safe Markdown and URL handling.
- Slug and redirect rules.
- Featured selection and ordering invariants.
- Lifecycle state transitions.
- Concurrency and recovery decisions.
- Fallback decision logic.

### 15.2 Integration tests

- PostgreSQL persistence and constraints.
- Draft/published/Trash separation.
- Save Draft operation recovery.
- Durable publication identity and atomic publication.
- Queued unpublish and Trash removal.
- Migration behavior and backup import.

### 15.3 API tests

- Authentication and authorization.
- Public-field filtering and draft isolation.
- Stale-write rejection and idempotency.
- Read-only outcome checks and safe errors.
- Slug redirect confidentiality.
- Valid empty/not-found outcomes versus availability failures.

### 15.4 End-to-end tests

- Allowed and denied GitHub identities.
- Create, edit, Save Draft, recover, preview, and publish flows.
- Uncertain Save Draft and publication outcomes.
- Unpublish, Trash, Restore, and approved permanent-delete behavior.
- Featured selection and order.
- Public and preview project-detail routes.
- Public timeout, error, and Retry.

### 15.5 Regression tests

- Homepage, `/all-projects`, and existing navigation.
- Project grouping, order, fields, technologies, and external links.
- Desktop and mobile layouts.
- Theme behavior, animations, reduced motion, keyboard access, and focus.
- Existing non-Projects content.
- Absence of draft or administrative data from public responses and fallback artifacts.

No failing test may be removed, skipped, or weakened merely to complete a task.

## 16. Detailed decision traceability

### 16.1 `CMS-SCOPE-MVP-001`

| ID | Status | Effect |
|---|---|---|
| `CMS-SCOPE-MVP-001` | APPROVED | Establishes the lean Projects-first MVP, retains essential security and recovery requirements, and defers the connected advanced cleanup and incident-reporting subsystem. |

### 16.2 `CMS-DEC-PROJ-001–021`: Core Projects behavior

These owner-approved summaries are retained in the MVP:

| ID | Status | Approved summary |
|---|---|---|
| `CMS-DEC-PROJ-001` | KEEP | Atomic batch Publish Updates. |
| `CMS-DEC-PROJ-002` | KEEP | Published-project Trash removal is queued until publication. |
| `CMS-DEC-PROJ-003` | KEEP | Restore can cancel a pending Trash removal before publication. |
| `CMS-DEC-PROJ-004` | KEEP | Unpublish is queued until Publish Updates. |
| `CMS-DEC-PROJ-005` | KEEP | No new project-image management in the MVP. |
| `CMS-DEC-PROJ-006` | KEEP | Manually selected featured projects. |
| `CMS-DEC-PROJ-007` | KEEP | Exactly three eligible published featured projects. |
| `CMS-DEC-PROJ-008` | KEEP | Independent featured slots 1, 2, and 3. |
| `CMS-DEC-PROJ-009` | KEEP | Published `/projects/:slug` routes and protected previews. |
| `CMS-DEC-PROJ-010` | KEEP | Plain-text short description and separate long description. |
| `CMS-DEC-PROJ-011` | KEEP | Safe Markdown long description. |
| `CMS-DEC-PROJ-012` | KEEP | Optional long description with published short-description fallback. |
| `CMS-DEC-PROJ-013` | KEEP | Manual slugs and safe redirects for previously published slugs. |
| `CMS-DEC-PROJ-014` | KEEP | Separate React/Vite admin frontend in the same repository. |
| `CMS-DEC-PROJ-015` | KEEP, GATED | Independent admin Vercel project, subject to zero-cost verification. |
| `CMS-DEC-PROJ-016` | KEEP | Protected full-site draft preview. |
| `CMS-DEC-PROJ-017` | KEEP | Public API loading, error, and Retry states. |
| `CMS-DEC-PROJ-018` | KEEP | 30-second public Projects read timeout. |
| `CMS-DEC-PROJ-019` | KEEP | Manual Retry after failed public reads. |
| `CMS-DEC-PROJ-020` | KEEP | Fresh successful public reads after publication. |
| `CMS-DEC-PROJ-021` | KEEP | No public polling; refresh/navigation-triggered updates. |

### 16.3 `CMS-DEC-PROJ-022–032`: Backup and recovery

| ID | Status | Approved summary |
|---|---|---|
| `CMS-DEC-PROJ-022` | KEEP | Manually run PostgreSQL backup script on Windows. |
| `CMS-DEC-PROJ-023` | KEEP | Local backup plus encrypted off-device copy. |
| `CMS-DEC-PROJ-024` | KEEP | Retain the latest five fully verified backup sets; preserve additional sets when cleanup does not safely complete. |
| `CMS-DEC-PROJ-025` | KEEP | Backup cleanup previews exact deletions and requires owner confirmation. |
| `CMS-DEC-PROJ-026` | KEEP | Weekly manual backups and backups before risky operations. |
| `CMS-DEC-PROJ-027` | KEEP | Protected local restore script with verified destination and destructive confirmation. |
| `CMS-DEC-PROJ-028` | KEEP | Normally rehearse restores in an isolated test database. |
| `CMS-DEC-PROJ-029` | KEEP | Use an isolated Neon test branch and import the actual backup archive. |
| `CMS-DEC-PROJ-030` | KEEP | Separate test branch within the same Neon project. |
| `CMS-DEC-PROJ-031` | KEEP | Fresh temporary branch for each rehearsal. |
| `CMS-DEC-PROJ-032` | KEEP | Owner manually deletes rehearsal branches. |

### 16.4 `CMS-DEC-PROJ-033–046`: Publication and Save Draft recovery

| ID | Status | Approved summary |
|---|---|---|
| `CMS-DEC-PROJ-033` | KEEP | Durable unique publication operation ID, authoritative outcome, and idempotency. |
| `CMS-DEC-PROJ-034` | KEEP | Bounded read-only publication checks; no automatic republishing. |
| `CMS-DEC-PROJ-035` | KEEP | Publication checks every five seconds within a 60-second window. |
| `CMS-DEC-PROJ-036` | KEEP | Reopening the dashboard checks an unresolved publication once. |
| `CMS-DEC-PROJ-037` | KEEP | Optimistic concurrency checks for project edits and featured ordering. |
| `CMS-DEC-PROJ-038` | KEEP | Manual side-by-side conflict resolution. |
| `CMS-DEC-PROJ-039` | KEEP | Explicit Save Draft; no autosave. |
| `CMS-DEC-PROJ-040` | KEEP | Unsaved-change navigation warnings. |
| `CMS-DEC-PROJ-041` | KEEP | One Save Draft in flight. |
| `CMS-DEC-PROJ-042` | KEEP | Editing locked during active Save Draft. |
| `CMS-DEC-PROJ-043` | KEEP | 30-second Save Draft timeout. |
| `CMS-DEC-PROJ-044` | KEEP | Read-only verification of uncertain Save Draft outcomes. |
| `CMS-DEC-PROJ-045` | KEEP | Save Draft checks every five seconds for up to 60 additional seconds. |
| `CMS-DEC-PROJ-046` | KEEP | Reopening checks an unresolved Save Draft once. |

The observable requirements and timings remain the baseline. An equivalent simpler design requires separate owner approval and test evidence. Such a proposal does not authorize the deferred cleanup and audit subsystem.

### 16.5 `CMS-DEC-PROJ-047–061`: Deferred cleanup, audit, and temporary-file subsystem

Exact individual wording for these decisions is not present in the repository or supplied owner record. Their historical IDs and approved grouped summaries are preserved without invented detail.

| ID | Status | Available approved historical context |
|---|---|---|
| `CMS-DEC-PROJ-047` | DEFER | Part of completed Save Draft operation retention and protected cleanup (`047–050`). |
| `CMS-DEC-PROJ-048` | DEFER | Part of completed Save Draft operation retention and protected cleanup (`047–050`). |
| `CMS-DEC-PROJ-049` | DEFER | Part of completed Save Draft operation retention and protected cleanup (`047–050`). |
| `CMS-DEC-PROJ-050` | DEFER | Part of completed Save Draft operation retention and protected cleanup (`047–050`). |
| `CMS-DEC-PROJ-051` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-052` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-053` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-054` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-055` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-056` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-057` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-058` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-059` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-060` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |
| `CMS-DEC-PROJ-061` | DEFER | Part of production cleanup backup attestations, audit reports, JSON writing, local-directory safety, and temporary-file handling (`051–061`). |

### 16.6 `CMS-DEC-PROJ-062–067`: Deferred incident-resolution subsystem

| ID | Status | Approved historical summary |
|---|---|---|
| `CMS-DEC-PROJ-062` | DEFER | Block destructive cleanup while a prior temporary-audit-file incident is unresolved. |
| `CMS-DEC-PROJ-063` | DEFER | Protected, owner-approved JSON incident-resolution record. |
| `CMS-DEC-PROJ-064` | DEFER | Dedicated `IncidentResolutions` subfolder. |
| `CMS-DEC-PROJ-065` | DEFER | Indefinite resolution-record retention. |
| `CMS-DEC-PROJ-066` | DEFER | Local-only resolution-record storage. |
| `CMS-DEC-PROJ-067` | DEFER | Block destructive cleanup if required resolution evidence goes missing. |

## 17. Outstanding gates

### 17.1 Pre-implementation gates

These block all implementation or the indicated implementation area:

1. Separate authorization for the specific implementation task.
2. Stable GitHub numeric administrator ID and approved OAuth/session security contract before authentication or protected-preview implementation.
3. Approved database schema, migration, concurrency, and idempotency design before persistence or write-recovery implementation.
4. Approved Restore behavior after a published Trash removal before completing that lifecycle transition.
5. Approved permanent-deletion behavior with published content or redirects before enabling that operation; deletion remains blocked while potentially active references exist.
6. Approved redirect behavior after permanent deletion before completing deletion/redirect lifecycle work.
7. Approved linkless-project behavior before supporting publication where both `repo` and `liveUrl` are absent.
8. Approved internal project-detail navigation while preserving the existing external card action.
9. Approved Markdown syntax, sanitization, and safe-link policy before rendering long descriptions.
10. Protection against accidental `.env`, `.env.*`, and equivalent secret-file commits before credentials are introduced.

Independent specification work may proceed only through its own approval gate. These unresolved items shall not be resolved implicitly during implementation.

### 17.2 Pre-production gates

1. Verified zero-cost feasibility for the public Vercel project, independent admin Vercel project, Render backend, and Neon database.
2. Verification that the approved fresh Neon test-branch rehearsal workflow is available within the accepted cost constraints.
3. Approved backup locations, encrypted off-device handling, weekly procedure, retention procedure, and cleanup procedure.
4. A successful isolated restore rehearsal using the actual backup archive.
5. Complete inventory and comparison of existing static project content.
6. Approved migration fallback window, cutover criteria, rollback procedure, and fallback retirement.
7. Passing unit, integration, API, end-to-end, and regression suites.
8. Security acceptance for OAuth, authorization, sessions, preview isolation, redirects, Markdown, secrets, and public responses.
9. Accessibility and responsive-regression acceptance.
10. Separate authorization for production database operations, migration, external resource changes, production cutover, restore, and deployment.

## 18. Commands and technical selections

The currently established public-frontend commands remain:

| Purpose | Command |
|---|---|
| Development | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Preview | `npm run preview` |

Backend, admin-frontend, test, migration, backup, restore, cleanup, and deployment commands are not selected by this requirements baseline. They require later approved technical specifications. No cleanup command may be introduced from the deferred subsystem without separate approval.

## 19. Approval boundaries

### Always required

- Trace work to approved requirement and decision IDs.
- Preserve draft/published isolation and enforce authorization server-side.
- Validate untrusted input at runtime.
- Preserve existing public behavior except for approved exceptions.
- Report verification evidence and exact changed files after every authorized task.

### Separate owner approval required

- Every implementation task and milestone.
- Dependencies, technical designs, API contracts, and session mechanisms.
- Database schema, migrations, and any database access or operation.
- Backup cleanup, restore rehearsal, and production restore.
- Credentials, external resources, hosting, CI, and environments.
- Migration import, cutover, rollback, and fallback retirement.
- Git staging, commit, push, merge, and pull requests.
- Production deployment.
- Any relaxation of `CMS-DEC-PROJ-001–046`.
- Any implementation or execution of `CMS-DEC-PROJ-047–067`.

### Prohibited by this approval

- Treating baseline approval as implementation authorization.
- Publishing drafts implicitly.
- Exposing secrets, draft data, Trash data, or protected operation metadata publicly.
- Automatically republishing after an uncertain result.
- Using stale static fallback during normal database-authoritative operation.
- Permanently deleting a project while potentially active published references remain unresolved.
- Forcing backup cleanup merely to retain exactly five sets.
- Performing destructive operation-record cleanup under the deferred subsystem.
- Incurring cost or silently substituting providers.
- Weakening, skipping, or deleting tests to pass a milestone.

## 20. Review state

The owner has approved this requirements baseline. Outstanding technical and release gates remain separately controlled. The next SDD phase, technical planning, implementation, database work, Git operations, migration, and deployment have not been authorized by this approval.
