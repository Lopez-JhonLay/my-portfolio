# Portfolio CMS Admin UI/UX

- **Status:** Owner-approved design direction; implementation not authorized
- **Scope:** Admin application under `admin/` only
- **Applies to:** Authentication, Overview, Projects, Project Editor, Featured
  Projects, and Publish Updates
- **Does not apply to:** The public portfolio design system or protected preview
  renderer

This document is the UI source of truth for Portfolio CMS Admin work. It
records product-design decisions without granting permission to install
dependencies, modify source, change contracts, run infrastructure, or perform
Git operations. Each implementation slice still requires separate owner
approval under `CMS-REQ-024` and the repository instructions.

The governing product behavior remains the owner-approved
[`portfolio-cms-requirements.md`](../specs/portfolio-cms-requirements.md).
Preserve the existing authentication, authorization, draft/public separation,
explicit-save behavior, optimistic concurrency, and uncertain-operation
recovery defined by `CMS-REQ-002–004`, `CMS-REQ-009`, `CMS-REQ-014–016`,
`CMS-REQ-021`, `CMS-DEC-PROJ-001–008`, and `CMS-DEC-PROJ-033–046`.

## 1. Product design principles

1. **State before decoration.** Make it immediately clear what is unsaved,
   saved privately, blocked, unresolved, or confirmed public.
2. **One workflow per destination.** Projects, Featured Projects, and Publish
   Updates have separate pages because they save different state and carry
   different consequences.
3. **Dense, not cramped.** Prefer compact controls, tables, separators, and
   deliberate whitespace over large cards and oversized typography.
4. **One primary action.** Each page region has one visually dominant action.
   Secondary and low-frequency actions remain quiet.
5. **No implied success.** Save Draft and Save Featured never imply
   publication. Only an authoritative publication result may claim the public
   site changed.
6. **Recovery is part of the normal UI.** Conflict, timeout, uncertain outcome,
   Retry, and Check Status states are designed surfaces, not generic errors.
7. **Semantic first.** Use native headings, landmarks, labels, tables, forms,
   and buttons before adding ARIA.
8. **Admin and public styling stay isolated.** Admin styles and dependencies
   must not enter the public portfolio or protected preview renderer.
9. **Do not fabricate capability.** Never display timestamps, published state,
   diffs, metrics, or readiness details the current contracts cannot prove.

## 2. Navigation and information architecture

Desktop uses a compact persistent left sidebar. Mobile uses a labelled menu
button that opens the same navigation in a Sheet.

```text
Portfolio CMS
├── Overview
├── Projects
│   ├── Project list
│   ├── New Project
│   └── Edit Project
├── Featured
└── Publish

Account menu
├── Light / Dark
└── Log out
```

Recommended routes:

| Route | Purpose |
| --- | --- |
| `/` | Overview and recovery-oriented next actions |
| `/projects` | Searchable and filterable Project catalog |
| `/projects/new` | Dedicated Project creation page |
| `/projects/:projectId` | Dedicated Project editor |
| `/featured` | Three independently ordered Featured slots |
| `/publish` | Publication readiness, confirmation, and status |

After authentication, navigate to `/projects`, the primary working area.
Overview remains a navigation destination rather than an obligatory landing
page.

Preview and Trash are planned capabilities. Do not show them as working
navigation items. Reserve Preview for a future editor/page action and Trash for
a future Projects subsection after their technical and security designs are
approved.

### Application shell

- Sidebar width: approximately `232px` on desktop.
- Top-level destinations use text labels and 16–18px Lucide icons.
- The current location uses a quiet surface fill and clear text contrast, not a
  colored glow or heavy shadow.
- The account menu sits at the bottom of the sidebar on desktop and in the
  mobile header.
- Theme selection is a direct Light/Dark toggle. Light is the first-visit
  default; the manual choice is remembered.

## 3. Page layouts

### Authentication

- Use one bordered panel with a maximum width near `400px`.
- Present the product name, a short private-workspace explanation, and one
  GitHub sign-in action.
- Loading keeps the layout stable and exposes `aria-busy` or a polite status.
- Authentication failure stays inline with a Retry action.
- Do not use a gradient, grid background, illustration, or oversized heading.

### Overview

Overview answers “What needs attention?” It is not an analytics dashboard.

- **Workspace status:** Project count, saved Featured completeness, and any
  unresolved save or publication operation supported by existing state.
- **Next actions:** Direct links to the incomplete or blocked workflow.
- Use flat sections or divided rows, not a grid of metric cards.
- Do not add charts, trends, last-published time, or pending-change counts
  without an approved data contract.

### Projects

- Header: page title, concise description, and **New Project** primary action.
- Toolbar: search, category filter, supported workspace-state filter, and a
  restrained sort control.
- Desktop: semantic table with compact rows.
- Narrow screens: labelled stacked rows; do not force a horizontally unusable
  table.
- Supported information includes Project name, slug, category, lifecycle,
  publication intent, Featured slot, revision, and row actions.
- The entire row need not be clickable. Provide a clear Edit action and place
  low-frequency actions in a DropdownMenu.
- Default ordering follows approved category/group order or an explicit
  supported sort. Do not offer “Recently updated” because the current Admin
  contract has no timestamp.
- Do not label a Project “Published” from `publicationIntent` alone. The
  current `AdminProject` contract does not prove the authoritative public
  representation.

### New Project and Project Editor

Creation and editing share one full-page, continuous form. Do not use a Dialog,
Sheet, tabs, or a narrow settings rail.

1. **Basics:** Display number, name, category, and order within category.
2. **Summary:** Short description and optional role.
3. **Technologies:** Ordered technology input and guidance.
4. **Links:** Optional repository and live-site URLs.
5. **Detail content:** Slug and optional long-description Markdown.

Layout rules:

- Show breadcrumbs above one page title.
- Pair fields in two columns only when the relationship is natural; collapse to
  one column on narrow screens.
- Keep labels visible. Placeholder text does not replace a label.
- Show required state, helper text, and errors consistently.
- Use a sticky bottom action bar containing authoritative draft state and the
  **Save Draft** action.
- A failed submit shows inline field errors and a short summary that moves or
  links focus to the first invalid field.
- While Save Draft is active, preserve the existing edit lock and duplicate-
  submission prevention.
- Browser/tab exit retains the native before-unload protection. In-app
  navigation uses a focused confirmation Dialog.

### Conflict mode

A stale-edit conflict temporarily replaces the normal editor body with a
blocking, full-width comparison surface.

- Compare “Your attempted changes” with “Latest saved draft.”
- Long text must wrap and remain readable on mobile.
- Provide deliberate choices to retain attempted edits or load the saved
  version.
- Do not allow another Save Draft until the conflict is resolved.
- Do not present conflict resolution in a toast, banner, or cramped Dialog.

### Featured Projects

- Show exactly three rows labelled Featured 1, Featured 2, and Featured 3.
- Each row uses a searchable Project selector and displays category and
  eligibility context.
- Provide accessible Move Up and Move Down controls; drag-and-drop is not
  required.
- Show duplicate, missing, and ineligible selections inline and block Save
  Featured.
- Use a separate sticky **Save Featured** action with persistent operation
  status.
- Saving Featured changes draft configuration only; success copy must not imply
  publication.

### Publish Updates

- Show publication readiness, saved Featured order, known blockers, and any
  unresolved publication operation.
- Show only candidate information supported by approved contracts.
- Use one **Publish Updates** primary action.
- Open one AlertDialog that identifies the atomic scope and asks for explicit
  confirmation. Do not use a multi-step wizard.
- While publication is active, prevent duplicate publication.
- A pending or uncertain result remains visible with **Check Status**. Never
  retry publication automatically.
- Only an authoritative succeeded outcome may report that the public snapshot
  changed.

An exact saved-versus-published change list needs a separately approved read
contract. Revision numbers, lifecycle, and publication intent must not be used
to invent that diff.

## 4. Visual system

### Typography

Use a native system UI stack such as Segoe UI, SF Pro, and `system-ui`. Do not
add a font dependency solely for the Admin.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Page title | `24px / 32px` | 650–700 |
| Section heading | `16px / 24px` | 600 |
| Body and controls | `14px / 20px` | 400–500 |
| Secondary text | `13px / 20px` | 400 |
| Metadata and status | `12px / 16px` | 500–600 |

- Maintain correct heading order.
- Avoid routine uppercase eyebrows and decorative letter spacing.
- Use tabular numerals for revisions, ordering, and slot numbers.

### Spacing and density

- Base spacing unit: `4px`.
- Desktop page padding: `24px`; compact/mobile padding: `16px`.
- Ordinary desktop control height: `32–36px`.
- Compact/mobile interactive targets: at least `44px` where space permits.
- Table row height: approximately `44–48px`.
- Main content maximum: approximately `1120–1200px`.
- Editor content width: approximately `760–880px`.
- Use whitespace to separate functional groups; do not wrap every group in a
  Card.

### Radius, borders, and elevation

- Default radius: `6px`.
- Large containers and overlays: `8px`.
- Full pills are reserved for statuses, category labels, and compact filters.
- Use soft 1px borders and separators.
- Routine sections, tables, and controls have no shadow.
- Use one restrained shadow level for Dialog, AlertDialog, Sheet, DropdownMenu,
  and sticky separation.

### Color tokens

Use CSS variables exposed through Tailwind v4 `@theme inline`. The palette is
cool neutral with one deep-teal brand accent. Semantic success, warning,
danger, and information colors are functional exceptions, not additional
brand accents.

| Token | Light | Dark |
| --- | --- | --- |
| Canvas | `oklch(0.985 0.004 170)` | `oklch(0.16 0.008 170)` |
| Surface | `oklch(1 0 0)` | `oklch(0.19 0.01 170)` |
| Subtle surface | `oklch(0.965 0.006 170)` | `oklch(0.23 0.012 170)` |
| Foreground | `oklch(0.22 0.014 170)` | `oklch(0.94 0.005 170)` |
| Muted foreground | `oklch(0.48 0.014 170)` | `oklch(0.70 0.012 170)` |
| Border | `oklch(0.88 0.012 170)` | `oklch(0.32 0.014 170)` |
| Primary teal | `oklch(0.43 0.09 170)` | `oklch(0.72 0.10 170)` |

Implementation must measure text, focus, control-boundary, and status contrast
in both themes and adjust these starting values if required. The final WCAG
target, supported browsers, viewport matrix, and assistive-technology coverage
remain gated by `MVP-SPEC-013`.

### Iconography and motion

- Use Lucide icons only; do not mix icon libraries.
- Icons support an action or state and do not decorate every Project row.
- Pair state color with text and, where useful, an icon.
- Keep transitions near `120–180ms` and limited to overlays, navigation
  disclosure, and small state changes.
- Disable nonessential motion when reduced motion is requested.

## 5. shadcn/ui usage rules

shadcn/ui is the primitive source, not the finished visual identity. Keep all
Admin components and tokens inside `admin/`, customize them to this document,
and do not reuse the public app's root `components.json`.

| Component | Admin use |
| --- | --- |
| Button | One primary action per page region; quiet secondary variants |
| AlertDialog | Publish and irreversible/destructive confirmation |
| Dialog | Unsaved-navigation and focused reversible decisions |
| Sheet | Mobile navigation; supplementary content only when justified |
| DropdownMenu | Account menu and low-frequency row actions |
| Toast | Brief acknowledgement, never authoritative operation state |
| Alert | Persistent blockers, API errors, and uncertain outcomes |
| Tooltip | Unfamiliar icon-only controls; never required information |
| Badge | Short semantic states; not every table value |
| Skeleton | Known loading structure with an accessible loading state |
| Combobox | Searchable Featured Project selection |
| Table | Compact Projects catalog |
| Breadcrumb | Project creation and editing location |

Do not add TanStack Table, a form library, a global state library, or a theme
library until a demonstrated requirement and separate dependency approval
justify it. Reuse existing Hooks, form validation, API clients, and operation
recovery logic.

## 6. Feedback and operation-state rules

### Save Draft

- Persistent states: Up to date, Unsaved changes, Saving, Outcome unknown, and
  failed.
- Inline validation is authoritative for field problems.
- A success toast may acknowledge completion, but the sticky status remains
  the durable indicator.
- Success copy: **Draft saved.**

### Save Featured

- Use the same persistent state model as Save Draft.
- Validation stays near the affected slots.
- Success copy: **Featured selection saved.**

### Publish Updates

- Treat publication as a distinct, consequential operation.
- Use an AlertDialog before starting it.
- Keep progress and uncertain recovery on the Publish page.
- Success copy may include the authoritative published snapshot revision.

### Loading, empty, and error states

- Skeletons are for predictable page/table structure; use a spinner only for a
  compact action already in progress.
- Empty states explain what is absent and provide one relevant next action.
- Recoverable errors explain what failed and expose Retry or Check Status.
- Do not clear useful content merely because a refresh failed.
- Status announcements use an appropriate polite or assertive live region and
  avoid repeating the same message through both toast and inline output.

## 7. Responsive and accessibility requirements

- Design and verify at approximately 320px, 768px, 1024px, and 1440px after
  the formal viewport matrix is approved.
- Replace the desktop sidebar with a labelled mobile menu Sheet.
- Collapse form grids without changing field order.
- Convert the Projects table to labelled stacked rows when a useful table can
  no longer fit.
- Sticky action bars must not obscure focused fields, validation, or mobile
  browser controls.
- All functionality must be keyboard operable with visible focus.
- Dialogs, AlertDialogs, Sheets, and menus must manage focus and return it to
  the trigger.
- Icon-only buttons require accessible names.
- Status, error, and eligibility meaning must never rely on color alone.
- Respect zoom, text reflow, reduced motion, and high-contrast/forced-color
  behavior within the eventual approved acceptance matrix.

## 8. Existing and planned capability boundaries

| Capability | UI treatment |
| --- | --- |
| GitHub authentication and logout | Existing; redesign presentation only |
| Project list, create, edit, validation | Existing; preserve behavior |
| Explicit Save Draft and unsaved warnings | Existing; preserve behavior |
| Stale conflict and uncertain-save recovery | Existing; preserve behavior |
| Three Featured slots and Save Featured | Existing; preserve behavior |
| Publish confirmation and recovery | Existing; preserve behavior |
| Accurate saved-versus-published diff | Not available; requires approved contract |
| Last-updated or last-published timestamps | Not available; do not display |
| Authoritative per-row public state | Not proven by current Admin contract |
| Protected full-site Preview | Planned and separately gated |
| Trash, Restore, and permanent deletion | Planned; unresolved transitions remain blocked |
| Other CMS content areas | Deferred beyond the Projects MVP |

## 9. Patterns to reject

- Purple/lavender default accents, gradients, glows, and glassmorphism.
- Card grids used where a list, table, or divided section is clearer.
- Decorative stat banners or invented dashboard metrics.
- Oversized headings, controls, empty states, and spacing.
- Fully rounded inputs and buttons without a functional reason.
- Arbitrary Project icons, category rainbow palettes, or emoji navigation.
- Repeated all-caps labels and colored left-border cards.
- Multiple primary actions competing in the same region.
- Toast-only errors, saves, conflicts, or publication results.
- Tabs that hide required form fields or validation.
- Disabled navigation that portrays future features as nearly operational.
- Copying the public portfolio's branding into the Admin.
- Unmodified shadcn defaults presented as the product's design system.

## 10. Technical and verification gates

- Tailwind CSS v4 and `@tailwindcss/vite` are already configured in `admin/`;
  do not migrate the public portfolio or add a second Admin Tailwind pipeline.
- Create an Admin-local shadcn configuration only after separate dependency and
  implementation approval.
- Before adopting generated primitives, verify the exact current shadcn output
  against the Admin's React 18 + Tailwind v4 combination. If it is not safely
  compatible, stop for an owner decision; do not upgrade the public app.
- Inspect every shadcn CLI diff because generated files and theme CSS can be
  overwritten.
- Do not start dependency work while it would overlap unresolved Stage 4
  changes in the root package manifest or lockfile.
- Verify each approved slice with focused tests plus the relevant Admin lint,
  typecheck, format, and build commands.
- Browser, keyboard, screen-reader, responsive, and public-style-isolation
  acceptance requires the separately approved testing matrix and tooling.
- After each implementation task, report exact files, commands, results,
  assumptions, and unresolved risks, then stop for owner review.

## 11. Reference sources

- [Tailwind CSS: Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind CSS: theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS: dark mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui: Vite installation](https://ui.shadcn.com/docs/installation/vite)
- [shadcn/ui: Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui: components.json](https://ui.shadcn.com/docs/components-json)
- [shadcn/ui: Data Table](https://ui.shadcn.com/docs/components/data-table)
- [AI design-slop pattern review](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)
