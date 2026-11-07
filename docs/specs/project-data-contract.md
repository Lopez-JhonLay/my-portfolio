# Project Data Contract

**Task:** `MVP-CONTRACT-001`
**Status:** Implemented locally; owner review pending
**Scope:** Server-owned, transport-neutral Project domain contract
**Requirements:** `CMS-REQ-003`, `CMS-REQ-014`, `CMS-REQ-016`, `CMS-REQ-027`, `CMS-DEC-PROJ-002–013`

This contract defines canonical Project content, draft and published separation,
lifecycle state, category ordering, and featured slots for the Projects-first
MVP. It does not define an API DTO, database schema, authentication rule, or UI
model and is not shared directly across application boundaries.

## Canonical fields

### Project identity

`ProjectId` is an opaque, stable, non-empty string. It identifies Projects in
featured slots and across mutable content such as slugs. Its generation and
persistence format remain database-design concerns and are not selected here.

### Project version

A draft or published Project version contains:

| Field | Contract |
| --- | --- |
| `number` | Required non-empty display string. |
| `name` | Required non-empty string. |
| `category` | `Personal Project`, `Work Project`, or `Capstone Project`. |
| `description` | Required non-empty plain-text card description. |
| `role` | Optional non-empty string; omitted when absent. |
| `tech` | Required ordered list containing at least one non-empty string. |
| `repo` | Optional absolute HTTP(S) URL. |
| `liveUrl` | Optional absolute HTTP(S) URL. |
| `slug` | Required lowercase ASCII kebab-case string. |
| `longDescriptionMarkdown` | Optional non-blank Markdown source; omitted when absent. |
| `groupOrder` | Positive integer ordering the Project within its category. |

The compatibility category presentation order is fixed as Personal, Work, then
Capstone. `groupOrder` controls only within-category order.

Both `repo` and `liveUrl` may be absent from valid Project data. Publication and
presentation behavior for such a Project remains unresolved under
`MVP-SPEC-009`; this domain contract does not select that behavior.

### Protected Project record

A protected Project record contains:

- `id: ProjectId`
- `lifecycle: "active" | "trashed"`
- `publicationIntent: "include" | "exclude"`
- `draft: ProjectVersion`
- `published: ProjectVersion | null`

Draft and published content are separate values. Editing or Trashing a Project
does not remove or modify its current published representation. A Trashed
Project must have `publicationIntent: "exclude"`.

The contract deliberately derives observable lifecycle situations rather than
creating an ambiguous combined status:

| State | Representation |
| --- | --- |
| Draft-only or currently non-public | `published` is `null`. |
| Currently published | `published` contains the current public version. |
| Candidate publish or update | Active with `publicationIntent: "include"`. |
| Queued Unpublish | Active, excluded, and has a published version. |
| Queued published Trash removal | Trashed, excluded, and has a published version. |
| Non-public Trash item | Trashed, excluded, and has no published version. |

Permanent deletion is record removal, not a lifecycle value. This contract does
not authorize unresolved Restore, permanent-deletion, or redirect transitions.

## Featured slots and publish-candidate invariants

Draft featured state always has three explicit independently ordered slots, but
each slot may be `null` and duplicate selections are allowed while editing:

```text
[ProjectId | null, ProjectId | null, ProjectId | null]
```

A complete publication candidate requires exactly three non-null, distinct
Project IDs. Each featured ID must reference an active Project whose publication
intent is `include`. Featured order is independent of category and
`groupOrder`.

For included Projects, a complete publication candidate also requires:

- unique Project IDs across the candidate;
- unique draft slugs; and
- unique `groupOrder` values within each category.

Invalid candidate state fails validation. This pure contract does not mutate a
draft or published snapshot.

## Validation and TypeScript types

`server/src/projects/project-contract.ts` exports strict Zod schemas and types
inferred with `z.output`. Unknown properties are rejected. Plain required text
is trimmed and must remain non-empty. Markdown source is checked for non-blank
content without being rendered, sanitized, or otherwise interpreted.

The schema accepts only absolute HTTP(S) external URLs and lowercase ASCII
kebab-case slugs. Draft records are allowed to contain slug collisions because
the approved requirement establishes uniqueness for published slugs; the full
publication candidate rejects collisions among included Projects.

Safe Markdown rendering, historical redirect rules, persistence constraints,
transport filtering, and public/admin request or response validation remain in
their separately gated tasks.

## Existing-project compatibility

Contract tests represent the six current static Projects without removing or
renaming legacy content fields:

| Category | Existing order |
| --- | --- |
| Personal | Ya Gameela; DevFlow; Rental Bill Management System; Classroom Randomizer |
| Work | LottoMatik Marketing Website |
| Capstone | Barangay Information System |

The initial compatibility featured slots are Ya Gameela, DevFlow, and Rental
Bill Management System, preserving the current homepage selection. Tests also
preserve display numbers, optional-role omission, technology order, and existing
repository and live URLs.

## Explicit exclusions and unresolved decisions

- `MVP-SPEC-003` is not a prerequisite for this server-owned pure domain
  contract. It remains required for API resources, DTOs, errors, and trust-boundary
  validation.
- `MVP-SPEC-009` must decide publication and presentation behavior when both
  external URLs are absent.
- `MVP-SPEC-011` must approve Markdown syntax, sanitization, and safe-link
  policy before rendering long descriptions.
- Historical-slug collision and redirect retention rules remain part of the
  separately approved persistence and redirect design.
- Restore after a published Trash removal, permanent deletion with surviving
  published references, and redirect behavior after deletion remain unresolved
  under the requirements baseline.
