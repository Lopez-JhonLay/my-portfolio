# Portfolio CMS Architecture

This document summarizes verified repository state and the owner-approved target direction. It does not authorize implementation. The [requirements baseline](specs/portfolio-cms-requirements.md) remains authoritative for scope and approval gates.

## Status labels

| Label | Meaning |
| --- | --- |
| **CURRENT** | Verified in the repository at `eef481b92ae28a1e401bdf415e118fae29bf218b`. |
| **APPROVED / NOT IMPLEMENTED** | Required direction that has not been built. |
| **PROPOSED** | Candidate approach requiring owner approval. |
| **GATED** | Approved outcome blocked by a required decision, feasibility check, or separate authorization. |
| **DEFERRED** | Preserved for later scope, not part of the lean MVP. |

## Current system

### Public portfolio — CURRENT

- A React 18/Vite 6 JavaScript SPA lives at the repository root (`src/`, `index.html`, and `vite.config.js`).
- `src/main.jsx` mounts `App` inside `BrowserRouter`. `src/App.jsx` defines `/` and `/all-projects`.
- `src/data/portfolio.js` is the static content source. The homepage currently selects the first three personal projects; `/all-projects` renders Personal, Work, then Capstone groups.
- Presentation is implemented by public layout, section, project, and UI components under `src/components/`, with global Tailwind/CSS in `src/index.css`.
- Theme state is initialized from `localStorage` or the system preference and applied with root `light`/`dark` classes.
- `vercel.json` rewrites SPA paths to `index.html`. This is repository configuration, not evidence of current deployment state.

There is no implemented public API, project-detail route, database layer, authentication system, automated test suite, or CI workflow.

### Workspace foundation — CURRENT

The root `package.json` declares npm workspaces for `admin` and `server`, Node 24.x, and npm 11.x.

- `admin/package.json` contains React, React DOM, Vite, and TypeScript tooling.
- `server/package.json` contains Express and TypeScript tooling.
- `admin/` and `server/` contain only their manifests. They have no source files, application entry points, local configuration, or scripts; neither application shell is implemented.

## Approved target topology

| Area | Status | Boundary |
| --- | --- | --- |
| Public portfolio | **CURRENT**, later integration **APPROVED / NOT IMPLEMENTED** | Public JavaScript/JSX application; consumes published Projects only. |
| Admin CMS | **APPROVED / NOT IMPLEMENTED** | Separate React/Vite TypeScript application for the single administrator. |
| Backend | **APPROVED / NOT IMPLEMENTED** | Separate Express/TypeScript service; sole enforcement point for protected operations. |
| Persistence | **APPROVED / NOT IMPLEMENTED**, **GATED** | Neon PostgreSQL; schema, migrations, concurrency, and idempotency design require approval. |
| Authentication | **APPROVED / NOT IMPLEMENTED**, **GATED** | GitHub OAuth plus a backend allowlist for one stable numeric GitHub user ID. |
| Media management | **DEFERRED** | Cloudinary and project-image management are outside the MVP. |

The target remains one repository with three application boundaries. A shared package, module layout, or API shape has not been approved.

## Trust and data-flow boundaries

### Public boundary — APPROVED / NOT IMPLEMENTED

- Public reads return only the current successfully published representation and safe redirects to published targets.
- Public responses exclude drafts, Trash, preview state, operation metadata, administrative fields, and secrets.
- A valid empty or not-found result must remain distinguishable from an availability failure.
- Normal database-authoritative failures use loading, error, a 30-second timeout, and manual Retry rather than a stale automatic fallback.

### Administrative boundary — APPROVED / NOT IMPLEMENTED

- The backend authenticates and authorizes every draft, preview, publish, lifecycle, backup, restore, and destructive operation.
- Client-side route protection and validation supplement but never replace backend controls.
- All untrusted input receives backend runtime validation.
- Session storage, cookie/token handling, OAuth state, callback allowlisting, CSRF, CORS, expiry, logout, and transport rules are **GATED** pending an approved security contract.

### Persistence boundary — APPROVED / NOT IMPLEMENTED

- Frontends do not access PostgreSQL directly.
- Draft edits cannot affect public content before a successful explicit Publish Updates operation.
- Publication atomically replaces the complete published Projects snapshot, including content, ordering, featured slots, slugs, redirects, unpublishes, and queued published-project Trash removals.
- Optimistic concurrency, durable operation identity, idempotency, and read-only uncertain-outcome checks are required. Their schema and API design remain **GATED**.

## Protected full-site preview — APPROVED / NOT IMPLEMENTED

Preview must render authorized draft data through the actual public presentation components and styles for `/`, `/all-projects`, and `/projects/:slug`. It must visibly identify itself as a non-public preview and must not publish, populate public caches, generate public metadata or fallback content, or expose drafts through redirects, logs, public APIs, or unauthenticated routes.

The preview renderer belongs to the public presentation boundary; admin controls and styling remain outside it. An isolated iframe, a dedicated preview entry point, or a protected route are **PROPOSED** options only. The delivery mechanism, cross-origin behavior, authentication flow, data contract, and CSS isolation require owner-approved technical design.

## UI styling boundaries

- Public portfolio components and `src/index.css` own the existing portfolio appearance.
- The Admin CMS requires an independent dashboard design, component set, and style entry point under its own application boundary.
- Sharing public presentation components for preview must not import admin globals into the public site or apply public decorative styling to the admin dashboard.
- Existing root UI dependencies and `components.json` describe the public application; they do not approve an admin framework or theme.

See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for verified public conventions and admin design gates.

## Hosting boundaries and cost gates

| Service | Intended responsibility | Status |
| --- | --- | --- |
| Vercel public project | Build and serve the public Vite SPA. | Repository configuration **CURRENT**; deployed state not established here. |
| Independent Vercel admin project | Build and serve the admin Vite application. | **APPROVED / NOT IMPLEMENTED**, **GATED** by zero-cost feasibility. |
| Render Free Web Service | Run the Express backend and OAuth/API endpoints. | **APPROVED / NOT IMPLEMENTED**, **GATED** by current free-tier feasibility and acceptance tests. |
| Neon PostgreSQL | Persistent CMS data and isolated restore-rehearsal branches. | **APPROVED / NOT IMPLEMENTED**, **GATED** by free-tier and branch-workflow feasibility. |

No provider may be substituted and no cost may be incurred without owner approval. Application rollback and data restore remain separate operations.

## Risks and unresolved decisions

The requirements baseline lists the complete gates. The most immediate architectural risks are:

- OAuth/session/CSRF/CORS behavior across separate frontend and backend origins.
- Database schema and constraints for draft/published separation, atomic publication, optimistic concurrency, durable operation outcomes, and idempotency.
- Preview authorization, cache and metadata isolation, and CSS isolation.
- Public compatibility mapping while adding featured slots, project details, Markdown, and slugs.
- Safe Markdown syntax, sanitization, and URL policy.
- Restore after published Trash removal, permanent deletion with historical slugs, and redirect behavior after deletion.
- Behavior for projects with neither `repo` nor `liveUrl`, and internal detail navigation while preserving the external card action.
- Migration inventory, fallback window, cutover, rollback, backup, and verified restore procedures.
- Zero-cost hosting viability, supported browser/WCAG targets, test viewport matrix, and the absence of test infrastructure.

Resolve each item through a separately authorized technical decision or task; do not infer it during implementation.
