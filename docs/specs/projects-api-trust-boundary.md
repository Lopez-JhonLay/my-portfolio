# Projects API and Trust-Boundary Contract

**Task:** `MVP-SPEC-003`
**Status:** Owner-approved; Stage 4 implementation authorized
**Scope:** Projects-first public and authenticated API boundaries
**Requirements:** `CMS-REQ-002–004`, `CMS-REQ-006–009`, `CMS-REQ-013–016`, `CMS-REQ-021`, `CMS-REQ-025–027`, `CMS-DEC-PROJ-001–004`, `CMS-DEC-PROJ-006–021`, `CMS-DEC-PROJ-033–046`

This specification defines the transport and trust boundaries required before
Projects API implementation. It derives transport representations from the
server-owned Project domain contract without exporting domain records across
application boundaries. It does not implement routes, schemas, authentication,
persistence, or UI behavior.

## Trust boundaries

The Express backend is the only application boundary that may read or mutate
Project persistence. The public portfolio and Admin CMS use separate API
clients and separate DTO schemas.

- Public reads are unauthenticated and expose only the current successfully
  published representation.
- Every draft, preview, Save Draft, publication, lifecycle, operation-status,
  backup, restore, or destructive capability is protected and authorized by
  the backend.
- Client-side route guards and validation are usability measures, not security
  controls.
- Public and protected schemas are feature-owned. Neither frontend imports the
  server domain contract, database models, repository records, or the other
  trust boundary's DTOs.
- The public adapter defined by `MVP-SPEC-002` consumes public DTOs only. The
  protected preview adapter must consume a separately authorized preview DTO.

The dependency direction is:

```text
untrusted request -> boundary Zod schema -> service/domain -> DTO projection -> response
```

Domain-to-DTO projection is an allowlist. Serializing a domain or persistence
object directly is prohibited even when its current fields appear safe.

## Public read contract

All public resources are read-only and live below `/api/projects`:

| Method and resource | Direct success body | Public outcome |
| --- | --- | --- |
| `GET /api/projects/status` | `{ status: "never-published" | "published" }` | The minimum source-authority state needed for the approved first-publication cutover. |
| `GET /api/projects` | `PublicProjectGroupsDto` | The published Personal, Work, and Capstone groups in fixed group order and published within-group order. |
| `GET /api/projects/featured` | `PublicFeaturedProjectsDto` | Exactly three distinct published cards in featured-slot order. |
| `GET /api/projects/:slug` | `PublicProjectDetailDto` | One current published detail, a safe prior-published-slug redirect, or public not-found. |

`/api/projects/status` and `/api/projects/featured` are reserved collection
resources and must be matched before the slug route. Query-driven draft
selection, preview flags, publication versions, and administrative filters are
not public API features.

The status resource exposes no snapshot revision, operation identifier,
timestamp, Project identifier, or protected publication state. A failed status
read is an availability failure; clients must not infer `never-published`.

A safe prior-slug result may redirect only to the current published slug for
the same Project. The redirect target must be resolved from published state;
it must never point to draft-only, unpublished, or Trashed content. The exact
redirect status and public-route handoff remain part of the approved slug and
navigation implementation work, not an excuse to expose draft resolution.

Valid empty groups return `200` with empty `projects` arrays. An unknown or
non-public slug returns the standardized `404` result. Neither outcome is an
availability failure. A published snapshot that violates the exactly-three
featured invariant is a server consistency failure, not a valid empty featured
response.

## Public DTO allowlists

Public DTOs use JSON-compatible values and omit absent optional properties.
They contain no database representation or server-only identifier.

`PublicProjectCardDto` allows only:

- `number`, `name`, `category`, and plain-text `description`;
- optional `role`;
- ordered `tech` strings;
- optional `repo` and `liveUrl`; and
- the current published `slug`.

`PublicProjectDetailDto` allows the card fields plus optional
`longDescriptionMarkdown`. The source remains Markdown text; it is not trusted
or rendered HTML.

`PublicProjectGroupsDto` contains exactly three entries in Personal, Work, and
Capstone order. Each entry contains only `category` and an ordered `projects`
array of `PublicProjectCardDto` values.

`PublicFeaturedProjectsDto` contains one `projects` tuple of exactly three
`PublicProjectCardDto` values in slots 1, 2, and 3. Slot numbers, internal
Project IDs, and group-order values are not needed by the public consumer and
are omitted.

Public projections must exclude at least:

- draft content and draft ordering;
- `lifecycle` and `publicationIntent`;
- Trash, preview, and pending lifecycle state;
- concurrency tokens or revisions;
- authentication, authorization, and administrator identity data;
- Save Draft and publication operation IDs or outcomes;
- persistence metadata, secrets, and internal errors.

Both `repo` and `liveUrl` may be absent from a transport-valid Project. This
contract does not add a publication ban or presentation behavior for that case;
the product decision remains gated by `MVP-SPEC-009`.

## Authenticated Projects boundary

Protected Projects resources live below `/api/admin/projects` or another
explicitly protected `/api/admin` subresource. There is no route that changes
trust level through a query parameter, request body field, or client-selected
mode.

The protected resource surface supports only the approved Projects-first
capabilities:

- Project list and detail reads containing draft and current published values;
- draft creation and explicit Save Draft;
- draft group ordering and three draft featured slots;
- queued Unpublish and queued published-project Trash removal;
- Restore only for transitions already approved by the requirements;
- complete publication-candidate review and explicit Publish Updates;
- read-only Save Draft and publication outcome checks; and
- authorized preview reads through the separately approved preview boundary.

Permanent deletion remains blocked where published content or redirects may
survive. Restore after a published Trash removal and post-deletion redirects
remain unresolved. This API contract does not infer command routes or
transitions for those cases.

Protected Project response DTOs may allow only the canonical `id`, `lifecycle`,
`publicationIntent`, `draft`, and `published` fields defined by the Project
domain contract. Feature-specific protected DTOs may separately add the
minimum opaque concurrency token or operation identifier and status required
by the approved recovery rules. Authentication provider data, secrets, raw
session data, and persistence records are never Project DTO fields.

Mutation DTOs are capability-specific allowlists. Clients cannot submit a
complete protected record to choose server-owned lifecycle, published state,
authorization, concurrency outcome, or operation outcome. Save Draft and
featured-order requests carry the authoritative expected concurrency token.
Publish Updates carries one client-stable operation ID for one publication
intent. Retrying with the same operation ID may recover the same authoritative
outcome but must not create a second logical publication.

Exact protected request and response schemas belong to `MVP-CONTRACT-003–004`.
Exact paths for preview delivery, authentication, and unresolved lifecycle
commands remain gated by their recorded specifications. Those contracts may
refine protected representations but may not weaken this trust separation.

## Boundary validation

Every route validates all untrusted path parameters, query parameters, headers,
and JSON bodies with route-owned strict Zod schemas before invoking a service.
Unknown object keys are rejected. TypeScript types are inferred selectively
from those schemas and do not replace runtime validation.

Validation responsibilities are separated as follows:

- request schemas validate transport syntax, bounds, allowed fields, operation
  identifiers, concurrency tokens, slugs, URLs, and Project content;
- services enforce cross-record and state-dependent rules such as uniqueness,
  eligibility, stale writes, allowed lifecycle transitions, and complete
  publication candidates;
- DTO projection schemas validate the allowlisted response shape before it
  crosses the server boundary; and
- public and Admin clients validate received JSON with consumer-owned schemas
  before using it.

The domain Project schemas may be composed inside server boundary schemas, but
they are not API DTOs by themselves. Public response schemas must project only
published values. Protected schemas must be separate modules so an import or
schema extension cannot accidentally add protected fields to a public response.

Malformed JSON or transport syntax is distinct from a well-formed request that
fails schema or domain validation. Validation details may identify safe field
paths and machine-readable issue codes but must not echo secrets, credentials,
session material, or unsafe supplied values.

## Success and error responses

Successful responses return the typed resource body directly. They do not use
a generic `{ data: ... }` envelope. Creation may use `201`; successful reads and
updates use `200`; a successful command with no response body may use `204`.
Long-running or uncertain writes must return their approved operation response
rather than claiming success prematurely.

Every error uses this JSON shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "requestId": "opaque-request-id",
    "details": []
  }
}
```

`code`, `message`, and `requestId` are required. `details` is optional and is
used only for safe, actionable validation or conflict information. Error
message text is not a machine contract; clients branch on `code` and HTTP
status.

| Status | Contract |
| --- | --- |
| `400` | Malformed JSON, path, query, or header syntax. |
| `401` | Authentication is absent or invalid on a protected resource. |
| `403` | The authenticated identity is not authorized for the protected capability. |
| `404` | A public representation is unknown/non-public, or an authorized protected resource is not found. |
| `409` | Stale concurrency token, operation-ID conflict, or disallowed current-state transition. |
| `422` | A well-formed request fails Zod or domain validation, including an invalid publication candidate. |
| `500` | Unexpected internal failure with redacted public text. |
| `503` | The service cannot provide an authoritative result or published snapshot. |

Typed application errors are mapped once by centralized error middleware.
Internal exceptions, stack traces, SQL details, secrets, draft values, and
authorization internals must not be serialized. Structured logs retain the
request or operation identifier and redact protected content.

## Draft isolation and publication consistency

Public handlers read only the current successfully published snapshot. They do
not query the mutable draft representation and do not derive public state from
`publicationIntent`, pending lifecycle commands, or an in-progress publication.

Each public response is projected from one authoritative published snapshot.
Publish Updates changes project content, category order, featured slots, slugs,
redirects, queued unpublishes, and queued published-project Trash removals as
one atomic outcome. Until that outcome succeeds, every public read observes the
previous published snapshot. After success, a fresh public read observes the
new complete snapshot.

An uncertain Save Draft or publication never triggers an automatic mutation
retry. Only authenticated read-only status checks may resolve its authoritative
outcome. Public endpoints do not expose operation status and do not poll.

The migration fallback defined by `MVP-SPEC-002` is not part of normal API
error handling. It remains restricted to the separately approved migration
window and cannot activate for empty, not-found, Unpublish, Trash-removal,
deletion, draft, preview, or unresolved-operation outcomes.

## Caching and freshness

For the MVP, every Projects API response sends `Cache-Control: no-store`.
Protected, preview, operation-status, and error responses must never populate a
browser, shared, CDN, or service-worker cache. Public reads are also uncached so
initial load, navigation, reload, and manual Retry perform authoritative fresh
reads after publication without polling or frontend redeployment.

No `stale-if-error`, stale-while-revalidate, hidden automatic retry, or normal
static fallback is permitted. A future public conditional-cache design requires
separate approval and must preserve publication freshness, valid empty and
not-found semantics, and draft isolation.

The public browser client uses the validated `VITE_PUBLIC_API_ORIGIN`. The
server validates `PUBLIC_ORIGIN`, allows credential-free public GET responses
only for that exact browser origin, and permits originless direct/server reads.
This public CORS boundary does not change the protected Admin CORS contract.

## URL and Markdown transport safety

- Project URL fields accept and return only absolute HTTP(S) URLs under the
  canonical Project contract. The API does not fetch or execute them.
- Slugs are validated at the request boundary. Published uniqueness and safe
  prior-slug resolution are service and persistence invariants.
- Card descriptions remain plain text.
- Long descriptions remain Markdown source in request and DTO fields. The API
  does not accept a client-supplied rendered HTML representation.
- No public or preview renderer may interpret Markdown until the syntax,
  sanitization, and safe-link policy is approved under `MVP-SPEC-011`.

## Verification contract

Future contract and API tests must verify:

- public grouped, featured, detail, redirect, empty, and not-found outcomes;
- exact public and protected DTO allowlists, including omitted optional fields;
- rejection of unknown request fields and malformed params, queries, headers,
  bodies, URLs, slugs, operation IDs, and concurrency tokens;
- one standardized redacted error shape and meaningful status/code mappings;
- public exclusion of draft, Trash, preview, lifecycle, concurrency,
  authentication, and operation metadata;
- unchanged public state during draft edits and failed or uncertain publication;
- one complete old or new snapshot across successful atomic publication;
- exactly three featured cards in independent slot order;
- fresh uncached reads and manual Retry without public polling or stale fallback;
  and
- HTTP(S)-only URL transport and non-executable Markdown-source handling.

## Deferred security and feature decisions

- `MVP-SPEC-004` owns persistence constraints, transactions, concurrency
  storage, and durable idempotent operation records.
- `MVP-SPEC-005–006` own GitHub OAuth, the stable numeric administrator ID,
  sessions, cookie/token storage, OAuth state, callback allowlisting, CSRF,
  CORS, expiry, logout, and transport security.
- `MVP-SPEC-007–008` own unresolved Restore, permanent-deletion, and
  post-deletion redirect transitions.
- `MVP-SPEC-009` owns linkless-project publication and presentation behavior.
- `MVP-SPEC-010` owns internal detail navigation while preserving the existing
  external card action.
- `MVP-SPEC-011` owns Markdown syntax, sanitization, and safe-link policy.
- `MVP-SPEC-012` owns protected-preview delivery, authorization, cache and
  metadata isolation, cross-origin behavior, and style isolation.
- `MVP-SPEC-014` owns the migration fallback window and cutover procedure.

These gates block their respective implementation details. They do not permit
public access to protected data or weaken the public/protected DTO separation.
