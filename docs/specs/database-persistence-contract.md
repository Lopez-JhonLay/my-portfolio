# Database and Persistence Contract

**Task:** `MVP-SPEC-004`
**Status:** Implemented locally; owner review pending
**Scope:** Projects-first PostgreSQL and Drizzle persistence boundaries
**Requirements:** `CMS-REQ-003`, `CMS-REQ-008`, `CMS-REQ-014`, `CMS-REQ-016`, `CMS-REQ-017`, `CMS-REQ-021`, `CMS-REQ-027`, `CMS-DEC-PROJ-001–004`, `CMS-DEC-PROJ-006–013`, `CMS-DEC-PROJ-033–046`

This specification defines the persistence decisions required for the
Projects-first MVP. It applies the canonical Project domain contract and the
Projects API trust-boundary contract to PostgreSQL and Drizzle without
implementing a schema, migration, repository, route, database connection, or
operational procedure.

## Persistence ownership and boundaries

PostgreSQL is the authoritative store for Project drafts, current published
state, slug reservations, concurrency revisions, and operation outcomes. The
Express backend is the only application boundary that accesses it. Public and
Admin clients never connect to PostgreSQL or import Drizzle records.

Drizzle schema definitions, migrations, and repositories remain server-owned.
Repositories return domain or purpose-specific persistence values to services;
raw rows are never serialized as API DTOs. Zod remains authoritative at
untrusted transport boundaries and for complete publication-candidate domain
validation. Database constraints independently protect structural and
cross-record invariants that must survive application defects or concurrent
writes.

The MVP stores only the mutable draft and current published representation. It
does not create browsable content revision history. Durable operation records
exist for concurrency, idempotency, and uncertain-outcome recovery and are not
content revisions.

## Seven-table design

### `projects`

One row owns the stable Project identity and protected lifecycle state:

- `id`: server-generated PostgreSQL UUID primary key, represented externally as
  the opaque canonical `ProjectId`;
- `lifecycle`: `active` or `trashed`;
- `publication_intent`: `include` or `exclude`;
- `draft_revision`: positive `bigint`, initialized to 1 and incremented by each
  successful Project draft, lifecycle, or publication-intent mutation; and
- internal creation and update timestamps.

A check constraint requires every Trashed Project to have
`publication_intent = 'exclude'`. Permanent deletion is row removal, is not a
lifecycle value, and remains blocked wherever unresolved published content or
slug references may survive.

### `project_drafts`

Each Project has exactly one draft row keyed by `project_id`. It stores the
canonical Project version fields: display number, name, category, description,
optional role, ordered technology values, optional repository and live URLs,
manual slug, optional Markdown source, and positive within-category group
order.

Draft slug and group-order collisions are allowed while editing. The service
and canonical publish-candidate validator reject them before publication.
Required text remains non-blank, technology values remain ordered and
non-empty, URLs remain HTTP(S)-only, and slugs retain the canonical lowercase
ASCII kebab-case format.

### `draft_featured_state`

One seeded singleton row contains nullable `slot_1_project_id`,
`slot_2_project_id`, and `slot_3_project_id` foreign keys to `projects`, plus a
positive `revision`. Slots are independent and may be incomplete or duplicate
while editing. A successful featured-order Save Draft conditionally increments
the singleton revision.

### `published_projects`

One row per currently published Project stores a copy of the public Project
content and ordering, separate from `project_drafts`. The current slug is joined
from `published_slugs`; draft rows are never used to complete a public read.

Published rows enforce positive group order and unique `(category,
group_order)` positions. Removing a row from this table makes that Project
non-public only as part of a successful Publish Updates transaction.

### `published_state`

At most one singleton row identifies the current complete publication:

- a monotonically increasing positive `snapshot_revision`;
- the successful publication `operation_id`;
- `slot_1_project_id`, `slot_2_project_id`, and `slot_3_project_id`, each
  non-null and referencing a row in `published_projects`;
- pairwise-distinct featured-slot constraints; and
- the publication timestamp.

The explicit columns preserve featured slot order independently of category and
group order. The singleton is created only when the first valid snapshot is
published; before that, public Project reads have no authoritative published
snapshot and return the approved availability failure rather than draft data.

### `published_slugs`

This table owns the published slug namespace:

- `slug`: lowercase ASCII kebab-case primary key, reserving the value globally;
- `project_id`: foreign key to the stable `projects` row; and
- `kind`: `current` or `redirect`.

A partial unique index permits at most one current slug per Project. Publishing
a slug change demotes the former current slug to a redirect and claims the new
current slug in the same transaction. A prior slug cannot be claimed by another
Project while its reservation remains.

Public redirect resolution joins the redirect's Project to that Project's
current slug and `published_projects` row. A reservation is therefore not a
public redirect when its target is draft-only, unpublished, or Trashed. Slug
reservations are retained for the MVP; cleanup, reactivation after a published
Trash removal, and behavior after permanent deletion remain gated.

### `project_operations`

One durable row represents one mutation intent:

- client-stable opaque `operation_id` primary key;
- `kind`: `save_project_draft`, `save_featured_draft`, or `publish`;
- nullable target Project ID where the operation is Project-specific;
- a deterministic request fingerprint calculated from the validated intent;
- `status`: `pending`, `succeeded`, or `failed`;
- safe outcome code and the resulting draft, featured, or published revision
  when available; and
- creation and completion timestamps.

The table stores no secret, credential, session material, raw error, or
browsable content snapshot. Operation records are retained for the MVP because
their cleanup and maintenance subsystem is deferred.

## Constraints and publication eligibility

PostgreSQL constraints enforce primary and foreign keys, enum domains, positive
revisions and ordering, singleton identities, non-empty ordered technology
arrays, slug syntax, current-slug uniqueness, published category positions,
and exactly three distinct published featured references.

The publication service additionally validates the complete locked candidate
with the canonical `projectPublishCandidateSchema`. Every featured Project must
be active and included; included draft slugs and within-category group orders
must be unique. Database constraints are the final race-safe enforcement layer,
not a replacement for domain validation or actionable validation errors.

Both URL fields remain nullable in draft and persistence records. This schema
does not add a publication ban. Publishing a Project with neither URL remains
blocked until `MVP-SPEC-009` approves the product policy.

## Optimistic concurrency and operation identity

Project Save Draft requests carry the expected `projects.draft_revision`.
Featured-order requests carry the expected `draft_featured_state.revision`.
The repository updates the target only when its stored revision matches, then
increments the revision in the same transaction. A zero-row conditional update
is a stale-write conflict and must not overwrite newer state.

Before executing a mutation, the service atomically claims its operation ID in
`project_operations`. The unique primary key selects one winner:

- the same ID and fingerprint returns the stored pending or terminal state;
- the same ID with a different fingerprint is an operation-ID conflict; and
- a pending duplicate never executes the mutation a second time.

The request fingerprint is a one-way digest of the canonical validated intent,
not the raw protected payload. Operation IDs and fingerprints are never exposed
through public Project reads.

## Save Draft transaction and reconciliation

After the operation claim is durably committed, a Save Draft transaction locks
the relevant operation and Project or featured singleton, performs the
expected-revision update, increments the revision, and records `succeeded` with
the resulting revision. A confirmed validation or stale-write failure changes
no draft data and records a safe authoritative `failed` outcome.

If a transaction is known to have rolled back, failure reconciliation may mark
the already claimed operation `failed` in a separate transaction. If that
reconciliation write cannot be confirmed, the record remains `pending`; the
server must not manufacture a definitive failure.

If connection loss or timeout makes the commit result uncertain, the operation
must not be retried automatically and must not be marked failed merely because
the response was lost. Authenticated status checks read the durable operation:

- `succeeded` or `failed` is authoritative;
- `pending` means the outcome is still unresolved and no duplicate mutation is
  permitted; and
- not found means the operation was never durably claimed and therefore did not
  mutate Project state.

This persistence behavior supports the approved bounded read-only checks and
one reopening check without changing their API timing contract.

## Atomic Publish Updates transaction

Publication first durably claims the publication operation ID. The publication
transaction then runs at PostgreSQL `SERIALIZABLE` isolation and:

1. locks the operation row, draft featured singleton, and all Project and draft
   rows in a stable order;
2. validates the complete current candidate and unresolved-policy gates;
3. copies every active, included draft into `published_projects`;
4. updates current and prior slug reservations;
5. writes the three eligible featured Project IDs and advances
   `published_state.snapshot_revision`; and
6. removes published rows for queued Unpublish and queued published-project
   Trash removal only after `published_state` no longer references them; and
7. records the operation as `succeeded` with that snapshot revision.

Step 3 establishes every new published row before the featured foreign keys can
reference it. Step 5 moves all three featured references before step 6 deletes
any excluded old row, so immediate foreign-key checks remain valid. Slug
reservation changes remain inside the same transaction and continue to resolve
publicly only through rows that survive in `published_projects`.

Steps 3–7 commit together. Until commit, public reads observe the preceding
snapshot. A validation, constraint, or confirmed serialization failure rolls
back the published rows, featured references, slug changes, removals, snapshot
revision, and operation outcome together. It never partially changes public
content. The service does not automatically retry a serialization failure or
any other uncertain publication.

If the result of `COMMIT` is uncertain, a read-only operation lookup provides
safe reconciliation. Because the success status and published replacement are
in the same transaction, a later `succeeded` result proves the new snapshot
committed; a still-pending result preserves uncertainty and blocks duplicate
execution. The previous snapshot remains authoritative unless a successful
commit is observed.

## Consistent public snapshot reads

Public repositories read only `published_state`, `published_projects`, and the
current or redirect rows in `published_slugs`. They never fall through to draft
tables, publication intent, lifecycle state, or pending operation records.

Every public response must be derived from one PostgreSQL MVCC snapshot and one
`published_state.snapshot_revision`:

- grouped Projects, including all three categories and their ordering, are read
  in one statement or one read-only repeatable-read transaction;
- featured Projects and all three ordered slots are read in one statement or
  one read-only repeatable-read transaction; and
- any repository use case that combines grouped and featured results pins both
  queries to the same read-only transaction and snapshot revision.

Separate HTTP requests may legitimately observe different complete revisions
when publication commits between them. A single response must never combine
grouped data from one revision with featured or slug state from another.

## Queued lifecycle changes

Queued Unpublish is represented by an active Project with
`publication_intent = 'exclude'` while its `published_projects` row remains.
Queued published-project Trash removal is represented by a Trashed, excluded
Project whose published row also remains. Neither draft action changes public
content. Successful Publish Updates removes those published rows and makes
their slug reservations non-resolving publicly.

Restoring a published Project before its queued Trash removal is published may
cancel that pending removal under the approved requirements. Restore after the
published row has been removed, permanent deletion with surviving content or
slug reservations, and redirect behavior after deletion remain blocked by
`MVP-SPEC-007–008` and are not selected here.

## Drizzle migrations and safe local testing

The future implementation keeps feature schema modules under
`server/src/db/schema/`, repository code under `server/src/projects/`, reviewed
generated SQL under `server/drizzle/`, and PostgreSQL integration tests under
`server/tests/integration/`. Drizzle schema generation does not authorize
`push`, migration application, or database access.

Every migration is generated as a versioned forward SQL artifact, reviewed
against the approved contract, and tested from an empty database state. Applied
migrations are not edited in place. Production correction uses a new migration;
database rollback and restore remain separately authorized operations under
`MVP-SPEC-014`.

Local integration tests require an explicit test-only PostgreSQL connection,
`NODE_ENV=test`, and a database name accepted by a fail-closed test-target
guard. Tests create a uniquely prefixed temporary schema, apply all migrations,
run deterministically, and drop only the exact generated schema after verifying
its name and connection target. They must refuse known production targets,
default credentials, missing test markers, and ambiguous cleanup targets.
Neither Neon nor any external database is contacted by default.

Database dependencies, migration generation or application, and any local or
remote database connection require separate authorization. Neon branch,
backup, restore, fallback, cutover, rollback, and deployment procedures remain
owned by `MVP-SPEC-014`.

## Verification contract

Future schema and integration tests must prove:

- migrations apply from empty state and every declared constraint rejects
  invalid rows;
- the six existing Projects round-trip without field, category, group,
  technology, optional-field, link, or featured-order loss;
- draft edits, queued Unpublish, and queued Trash removal leave public reads
  unchanged before publication;
- competing Project and featured writes allow one expected revision and reject
  stale revisions without lost updates;
- operation-ID replay, fingerprint conflict, pending duplicates, confirmed
  failures, and uncertain outcomes reconcile without duplicate mutation;
- successful publication exposes one complete new snapshot, while invalid,
  failed, and unresolved publication preserves the complete preceding snapshot;
- grouped and featured reads each use one snapshot, and combined repository
  reads cannot mix revisions;
- exactly three distinct eligible featured Projects, published slug and order
  uniqueness, prior-slug reservation, and safe redirect resolution hold under
  concurrent transactions; and
- the test-target guard refuses unsafe connection and cleanup targets.

## Explicit exclusions and remaining gates

- This specification does not approve dependencies, schema implementation,
  migrations, database access, seed data, or operational commands.
- `MVP-SPEC-005–006` own authentication, sessions, authorization, and secrets.
- `MVP-SPEC-007–008` own unresolved Restore, permanent-deletion, and
  post-deletion redirect behavior.
- `MVP-SPEC-009` owns linkless-Project publication and presentation policy.
- `MVP-SPEC-011` owns Markdown rendering and sanitization; persistence stores
  source text only.
- `MVP-SPEC-014` owns migration rollout, fallback, backup, restore, cutover,
  rollback, and Neon feasibility.
