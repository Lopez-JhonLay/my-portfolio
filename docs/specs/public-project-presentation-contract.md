# Public Project Presentation Contract

**Task:** `MVP-SPEC-002`
**Status:** Owner-approved; Stage 4 implementation authorized
**Scope:** Public portfolio presentation and Project content-transport boundary
**Requirements:** `CMS-REQ-004`, `CMS-REQ-013–015`, `CMS-REQ-020`, `CMS-REQ-025–027`, `CMS-DEC-PROJ-006–013`, `CMS-DEC-PROJ-016–021`

This specification separates the public portfolio's presentation components
from Project data ownership and transport. It introduces no API, adapter,
route, migration, preview, authentication, or UI implementation.

## Ownership and dependency direction

- The backend owns canonical Project domain state and the published transport
  contracts derived from it.
- The public JavaScript/JSX application owns public route composition,
  presentation view models, and rendering.
- A public-application adapter maps an approved Project source into
  presentation view models. Route or page containers invoke the adapter and
  own loading, error, timeout, and Retry state; presentation components receive
  data and observable request state through props.
- Presentation components do not fetch data, select an authority source, or
  import static content, server modules, database models, admin contracts,
  authentication state, or operation metadata directly.
- No cross-workspace shared package is introduced for the MVP. Public and
  protected consumers use separately owned transport adapters and may not
  deep-import the server's Project domain contract.

The dependency direction is:

```text
approved Project source -> public adapter -> presentation view models -> routes/components
```

The adapter is a compatibility boundary, not a second Project domain model. It
preserves approved published values and removes fields that public presentation
does not consume.

## Presentation view models

The legacy-compatible card view preserves:

- required `number`, `name`, `category`, and plain-text `description`;
- optional `role`, omitted when absent;
- ordered `tech` values;
- optional `repo` and `liveUrl`; and
- the existing `liveUrl || repo` priority, external target behavior, and
  "View Live Site" versus "View Repository" labels.

The adapter must not add behavior for a Project that has neither external URL.
That presentation and publication decision remains gated by `MVP-SPEC-009`.

The detail view preserves the card content and adds the published `slug` and
optional Markdown source. When long content is absent, presentation uses the
plain-text card description. Markdown remains non-executable source until the
syntax, sanitization, and safe-link policy is approved under `MVP-SPEC-011`.

## Route contracts

### `/`

The homepage Projects section receives exactly three Projects in explicit
featured-slot order. Featured order is independent of category and within-group
order.

Before cutover, the static compatibility mapping reproduces the current
selection: Ya Gameela, DevFlow, and Rental Bill Management System. After
cutover, the successfully published featured slots supersede the current
first-three-Personal rule.

No other homepage section, hash link, layout, theme, animation, reduced-motion,
keyboard, focus, or semantic behavior changes through this boundary.

### `/all-projects`

The route receives three groups in fixed Personal, Work, and Capstone
presentation order. Each group preserves its source ordering, and every card
preserves technology and external-link ordering and behavior.

A valid empty group remains an empty-content outcome rather than an
availability failure. The adapter must not replace an intentionally empty or
removed published group with static content.

### `/projects/:slug`

This approved future route consumes one published detail view resolved by its
current published slug or an approved safe prior-slug result. Unknown,
draft-only, unpublished, or Trashed Projects use the approved not-found
outcome.

The route must not be enabled until published slug/detail transport and safe
redirect behavior exist. How a visitor reaches the route while the existing
card action remains external is intentionally deferred to `MVP-SPEC-010`.

## Source authority and transport states

### Static-authoritative state

Before separately approved cutover, `src/data/portfolio.js` remains the
authoritative public Project source. A future static adapter may translate its
three existing arrays into the same presentation view models used by published
transport. This boundary does not authorize changing the static data or
enabling the detail route.

### Approved first-publication cutover state

Before the first successful publication, the backend's explicit
`never-published` status keeps the existing six static Projects authoritative.
An unavailable or malformed status is an error and never activates static
content. The first successful publication permanently makes the published
database snapshot authoritative for normal reads.

After publication, timeout, transport failure, malformed response, or server
failure displays Error and manual Retry. Static and published Projects are
never merged, and static content is never substituted after publication. This
decision approves only the Stage 4 source-authority cutover; migration import,
backup, rollback, restore, deployment, and production cutover execution remain
separately gated under `MVP-SPEC-014`.

### Database-authoritative state

After approved cutover, published API data is the sole normal public Project
authority. Automatic static fallback is retired. Initial load, navigation,
reload, and manual Retry perform fresh public reads; there is no public polling.
Timeout, transport failure, malformed response, or server failure remains an
error state and does not silently substitute static content.

Exact API resources, DTOs, validation, errors, and cache behavior belong to
`MVP-SPEC-003`. Exact migration timing, artifact generation, cutover, rollback,
and fallback retirement belong to `MVP-SPEC-014`.

## Protected preview boundary

Protected preview reuses the actual public presentation components and view
models, but obtains authorized draft data through a separate protected adapter.
The public adapter never accepts draft or preview content.

Preview delivery, authentication, cache and metadata isolation, CSS isolation,
redirect behavior, and cross-origin transport remain gated by
`MVP-SPEC-005` and `MVP-SPEC-012`. This specification does not select a preview
mechanism.

## Compatibility and verification contract

Future implementation must verify that:

- all six existing static Projects map without changing fields, optional-field
  omission, groups, group order, within-group order, technology order, or URLs;
- the static featured mapping preserves the current three homepage cards;
- published featured order is accepted independently of category order;
- `/`, `/all-projects`, and `/projects/:slug` consume presentation view models
  without presentation components owning transport;
- public adapters cannot expose draft, Trash, preview, concurrency,
  authentication, or operation-recovery state;
- migration fallback distinguishes availability failure from valid empty,
  not-found, Unpublish, Trash-removal, and deletion outcomes; and
- existing public routes and unaffected content, responsive layout, theme,
  motion, keyboard behavior, focus, and semantics do not regress.

## Deferred decisions

- `MVP-SPEC-003`: public/admin API DTOs, resources, validation, errors, and
  trust boundaries.
- `MVP-SPEC-009`: publication and presentation behavior for Projects without
  `repo` or `liveUrl`.
- `MVP-SPEC-010`: internal detail navigation while preserving the existing
  external card action.
- `MVP-SPEC-011`: Markdown syntax, sanitization, and safe-link policy.
- `MVP-SPEC-012`: protected-preview delivery and isolation.
- `MVP-SPEC-014`: migration window, fallback artifact, cutover, rollback, and
  fallback retirement procedure.
- `MVP-SPEC-013`: supported-browser, viewport, WCAG, and assistive-technology
  acceptance matrix.

None of these deferred decisions changes the ownership and dependency direction
approved by this specification.
