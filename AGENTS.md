# Portfolio CMS Agent Instructions

These instructions apply repository-wide. They supplement higher-priority platform and owner instructions. Repository-specific authorization boundaries take precedence over generic workflow advice.

## Authority and SDD workflow

Use this order when sources differ:

1. The owner's explicit scope and authorization for the current task.
2. The owner-approved [requirements baseline](docs/specs/portfolio-cms-requirements.md).
3. Separately approved technical specifications and task plans.
4. [Architecture](docs/ARCHITECTURE.md), [design-system](docs/DESIGN-SYSTEM.md), and [progress-tracker](docs/PROGRESS-TRACKER.md) documentation, according to their status labels.
5. Existing source and repository conventions.

Documentation describes state; it does not grant implementation or operational authority. Trace work to applicable `CMS-REQ-*`, `CMS-DEC-PROJ-*`, and `CMS-SCOPE-*` identifiers. Follow requirements -> `TASKS.md` priority -> short plan when needed -> approved implementation task -> verification -> report -> STOP; consult an approved technical specification when the task depends on one. Obtain explicit owner approval before every implementation task and do not continue automatically to the next task or milestone.

## Day-to-day development workflow

- Use root [`TASKS.md`](TASKS.md) as the current priority and status tracker; keep the longer specifications as reference material.
- Use native Codex Plan Mode for complex changes and Agent Mode for implementation. Prefer short plans and small end-to-end tasks that deliver and verify working behavior.
- Reuse existing repository evidence. Avoid repeated discovery, unnecessary specification files, and documentation-only work unless the owner requests it or an unresolved security, data-integrity, or operational decision genuinely requires it.
- Update `TASKS.md` after meaningful milestones; do not duplicate detailed requirements there.
- This lean workflow does not relax authentication, backend authorization, credential and draft secrecy, data-integrity, verification, Git, database, infrastructure, or deployment protections in this file and the approved requirements baseline.

## Application boundaries

- Preserve the existing public portfolio in `src/` as JavaScript/JSX with its current PropTypes convention. Do not migrate it to TypeScript or rename existing files incidentally.
- Implement the separate admin application in `admin/` as TypeScript/TSX and the backend in `server/` as TypeScript.
- Keep public presentation, admin dashboard, and backend responsibilities separate. Any shared module or contract requires an approved technical design.
- Preserve existing public routes, hash navigation, content sections, project grouping and ordering, external-link behavior, responsive layouts, theme behavior, animations, reduced-motion handling, keyboard behavior, focus treatment, and semantics except for explicitly approved changes.

## Code organization and naming

- Use kebab-case for new files and folders. Do not rename existing public JavaScript/JSX files merely to apply this convention.
- Organize admin React code feature-first. Keep components, behavior-focused Hooks, schemas, API adapters, and focused tests with their owning feature; move code to shared locations only after genuine reuse is established.
- Use function components. Prefer local Hooks, targeted Context for cross-cutting state, and reducers for complex state transitions. Do not introduce a global state library without separate approval.
- Give custom Hooks a focused behavioral purpose, keep them feature-local by default, and do not extract wrappers that add no meaningful abstraction.
- Configure application-local import aliases. Use relative imports for nearby same-feature modules and prohibit deep imports across workspace boundaries; cross-application sharing requires an approved public contract.

## TypeScript and code quality

- Use standard strict TypeScript for admin and server code. Do not add unexplained `any`, non-null assertions, `@ts-ignore`, or similar suppressions.
- Prefer type aliases for DTOs, unions, mapped types, component props, and ordinary object shapes. Use interfaces for intentional extension or library augmentation.
- Use ESLint for correctness and Prettier for deterministic formatting. Preserve existing public formatting unless a line is otherwise changed by an authorized task.
- Document exported contracts and non-obvious security, authorization, recovery, transaction, and compatibility reasoning. Do not comment self-explanatory code.

## Backend, API, and persistence

- Organize Express code by feature. Keep routes and controllers thin, services responsible for use cases, repositories responsible for persistence, and middleware responsible for cross-cutting HTTP concerns.
- Return direct typed success bodies and standardized error bodies with meaningful HTTP status codes. Detailed contracts belong in separately approved feature or API specifications.
- Use typed application errors and map them once in centralized error middleware. Produce structured, redacted logs with request or operation identifiers; never log secrets or protected content unnecessarily.
- Validate environment, request, and other untrusted boundary data with boundary-owned Zod schemas. Export inferred types selectively and do not create a global schema module that couples public and protected contracts.
- Keep typed API clients separated by trust boundary. Support `AbortSignal`, approved explicit timeouts, and observable request states; do not hide Save Draft or publication recovery behavior behind automatic retries.
- Use Drizzle ORM for PostgreSQL access. Centralize schema and migration definitions, keep feature queries behind repositories, and pass explicit transactions through services that own atomic operations.

Selection of Drizzle, Zod, Prettier, Vitest, Supertest, or Playwright is a coding standard, not authorization to install packages, change configuration, create a schema, or implement a feature.

## Testing and accessibility

- Use Vitest for unit and integration tests, Supertest for HTTP/API tests, and Playwright for end-to-end and public regression coverage after their dependencies and setup are separately approved.
- Use a hybrid layout: colocate focused unit tests with their feature and centralize integration, API, end-to-end, fixtures, and regression suites.
- Name tests by observable behavior, mock only external or process boundaries, and use deterministic factories or builders for test data.
- Build components semantic-first. Require keyboard operation, visible focus, accessible names, labelled validation, and programmatically announced status changes; the exact WCAG target and assistive-technology matrix remain separately gated.

## UI and preview boundaries

- The public portfolio and Admin CMS have distinct design systems. Admin components and styles must not inherit or copy the public visual identity by default.
- Keep admin-specific components and styling inside the admin application. Existing public UI dependencies or configuration do not approve an admin component library or theme.
- Specific admin colors, typography, navigation layout, components, motion, and theme modes require separate owner approval.
- Protected full-site preview must render authorized draft Projects through the actual public presentation components and styles for `/`, `/all-projects`, and `/projects/:slug`.
- Keep admin chrome and global styles from affecting the preview or public site. The exact preview delivery and style-isolation mechanism remains gated by an approved technical design.
- Preview must be visibly identified as non-public and must never publish or expose draft data through public APIs, caches, metadata, redirects, fallback artifacts, logs, or unauthenticated routes.

## Security and data rules

- Enforce authentication and authorization on the backend for every protected operation; frontend checks are not authorization.
- Authorize the single administrator using the configured stable GitHub numeric user ID, not a login name alone.
- Validate all untrusted input at runtime on the backend, independent of TypeScript and client validation.
- Preserve strict draft, published, Trash, preview, and operation-status separation.
- Handle Markdown and URLs according to an approved policy; rendered output must exclude executable markup and unsafe URL protocols.
- Never hard-code, commit, expose to public clients, or write secrets to normal logs. Preserve the repository's environment-file ignore rules.
- Do not infer unresolved authentication, session, CSRF, CORS, schema, migration, concurrency, idempotency, redirect, deletion, or recovery behavior.

## Verification and reporting

- Use tests appropriate to the approved task and retain the required unit, integration, API, end-to-end, and regression coverage. Never delete, skip, or weaken a failing test merely to finish work.
- Verify public behavior, accessibility, responsiveness, security boundaries, and draft confidentiality whenever affected.
- Do not run unrelated builds or mutate external systems for verification without authorization.
- Report exact changed files, commands/checks run, results, assumptions, and unresolved risks. Then STOP for owner review.

## STOP and authorization boundaries

STOP when approval is missing or conflicting, a requirement is unresolved, the working tree differs materially from the expected state, a change could expose drafts or secrets, a destructive or production-affecting action is needed, or a provider/cost constraint cannot be satisfied.

Separate owner authorization is required for:

- Each implementation task or milestone.
- Dependency additions, removals, or upgrades.
- Git staging, commits, pushes, merges, pull requests, and releases.
- Database access, schema changes, migrations, backup, restore, cleanup, or destructive operations.
- Credentials, OAuth applications, external resources, hosting, CI, infrastructure, migration cutover, rollback, and deployment.
