# Portfolio CMS Design Systems

The public portfolio, Admin CMS, and protected preview have different presentation responsibilities. This document records verified public behavior and approved boundaries; it does not approve new visual choices. See the [requirements baseline](specs/portfolio-cms-requirements.md) and [architecture](ARCHITECTURE.md).

## A. Public Portfolio Design System — CURRENT

Preserve the current appearance and behavior unless the owner separately approves a change.

### Typography and color

- `src/index.css` imports **Barlow Condensed** at weights 400–700 and **Bebas Neue**.
- Body and controls inherit Barlow Condensed. `h1`, `h2`, and `h3` use Bebas Neue with uppercase text and `0.03em` tracking.
- `tailwind.config.js` maps the sans family to Barlow Condensed.
- The palette is deliberately monochrome. `src/index.css` defines semantic Tailwind variables and public `--noir-*` variables for backgrounds, panels, ink, borders, accents, web lines, shadows, grain, and spotlight effects.
- Light mode uses pale gray panels with dark ink and black accents; `.dark` uses near-black panels with light ink and white accents.
- Public radii are defined as panel (`24px`), card (`18px`), small (`12px`), and pill (`999px`).

Sources: `src/index.css`, `tailwind.config.js`.

### Spacing and layout

- Main sections are centered to `1180px` and use fluid horizontal padding. Standard section padding is `112px clamp(20px, 6vw, 80px)` and becomes `82px 16px` on narrow screens.
- Typography and hero sizes use `clamp()` for fluid scaling.
- Content uses grids that collapse as space narrows; dossier and contact layouts change from two columns to one.
- Public `.noir-button` actions have a minimum 44px height, and those actions expand to full width on narrow screens.

Source: `src/index.css`.

### Navigation

- `src/components/layout/Navbar.jsx` implements a sticky public header with brand, primary hash navigation, theme control, and a disclosure-based mobile menu.
- Desktop navigation appears from `860px`; below it the labelled menu button exposes the mobile navigation.
- Links retain the existing `/#section` behavior defined in `src/data/portfolio.js`.

Sources: `src/components/layout/Navbar.jsx`, `src/data/portfolio.js`, `src/index.css`.

### Project presentation

- Projects use an evidence-board/case-file motif: corkboard panels, connecting strings, pinned cards, file numbers, category labels, technology pills, and a single external action.
- The homepage displays `personalProjects.slice(0, 3)`. `/all-projects` presents Personal, Work, then Capstone groups while retaining within-group order.
- `ProjectCard` displays the optional role, preserves technology order, prefers `liveUrl` over `repo`, and labels the action `View Live Site` or `View Repository` accordingly.
- The featured-project rule and future `/projects/:slug` route are approved CMS exceptions but are not implemented.

Sources: `src/components/sections/Projects.jsx`, `src/components/pages/AllProjects.jsx`, `src/components/projects/ProjectCard.jsx`, `src/data/portfolio.js`, `src/index.css`.

### Theme and motion

- `src/components/ui/theme-provider.jsx` initializes theme from `localStorage`, then the system `prefers-color-scheme`, and applies a root `light` or `dark` class.
- `src/components/ui/theme-switcher.jsx` provides a spider-pull interaction, uses the View Transition API when available, and has a non-View-Transition fallback.
- Framer Motion supplies section entrance and project-card hover movement; CSS supplies navigation, theme, social-card, and decorative motion.
- Reduced-motion handling bypasses the theme transition and globally reduces animation, transition, and smooth scrolling. Social-card transitions also have a targeted reduced-motion rule.

Sources: `src/components/ui/theme-provider.jsx`, `src/components/ui/theme-switcher.jsx`, `src/components/projects/ProjectCard.jsx`, `src/index.css`.

### Responsive behavior

- `860px` switches between desktop and mobile navigation.
- At `900px` or below, major two-column layouts collapse, project grids become one column, and decorative project strings are hidden.
- At `560px` or below, navigation and section padding tighten, the hero becomes content-height, actions become full width, and supporting grids become one column.

Source: `src/index.css`.

### Accessibility conventions

- A global `:focus-visible` outline uses a 2px public accent with 3px offset.
- Navigation landmarks have distinct accessible labels; the menu button exposes `aria-expanded`; the theme control exposes `aria-pressed` and a descriptive label.
- Sections use headings and `aria-labelledby`; project cards use semantic `article`; decorative grain, vignette, strings, pins, and icons are hidden from assistive technology where coded.
- External project actions use anchors and preserve the current new-tab behavior.
- Motion respects `prefers-reduced-motion`.

These are verified conventions, not a claim of WCAG conformance. The WCAG target, supported browsers, assistive-technology coverage, and regression viewport matrix remain approval gates.

## B. Admin CMS Design System — APPROVED DIRECTION / NOT IMPLEMENTED

The Admin CMS requires its own design language. It is a content-management dashboard optimized for clarity, efficient project editing, state awareness, error prevention, and recovery—not a visual extension of the public portfolio.

### Approved principles

- Keep admin components, styles, and reusable patterns inside the admin application boundary.
- Provide a responsive and keyboard-operable interface with programmatic names, visible focus, meaningful landmarks, appropriate heading order, and status announcements.
- Make Draft, Published, queued Unpublish, queued Trash removal, Trash, conflict, pending, uncertain, success, and error states unambiguous without relying on color alone.
- Design clear navigation, project lists or tables, forms, editors, dialogs, validation, status messages, retry controls, and destructive-action confirmations.
- Preserve unsaved-change warnings and prevent duplicate or unsafe actions while writes are active.
- Do not import public decorative globals into the dashboard. Existing public dependencies and `components.json` do not select an admin component library.
- A light/dark theme is not required merely because the public portfolio supports one.

### TO BE DESIGNED / OWNER APPROVAL REQUIRED

- Color palette and semantic status colors.
- Typography and type scale.
- Spacing, density, elevation, and radius scales.
- Navigation model and layout, including any sidebar or top-bar choice.
- Form, table/list, editor, dialog, notification, and confirmation visuals.
- Component library or design framework, if any.
- Iconography and illustration use.
- Motion and transition behavior.
- Light, dark, or system theme modes.
- Responsive mockups and final layouts.

Do not encode these open choices as tokens, components, mockups, or dependencies until separately approved.

## C. Protected Full-Site Preview — APPROVED DIRECTION / NOT IMPLEMENTED

Preview must use the actual public portfolio presentation components and styles with backend-authorized draft Project data. It covers draft versions of `/`, `/all-projects`, and `/projects/:slug` and must visibly state that the content is a non-public preview.

### Presentation and style isolation

- The preview renderer remains public-owned and uses the same public component behavior and CSS as the published portfolio.
- Admin controls may surround or launch preview but must not restyle its rendered portfolio surface.
- Admin global styles must not enter the public site, and public decorative globals must not style the dashboard.
- An isolated iframe, dedicated preview entry point, or protected route are **PROPOSED** mechanisms only. The precise mechanism, shared-module boundary, data adapter, and CSS isolation strategy are **GATED / OWNER APPROVAL REQUIRED**.

### Authorization and confidentiality

- Every draft-data request requires backend authentication and authorization.
- Preview data must never enter public API responses, public caches, search metadata, social metadata, redirects, migration fallback artifacts, analytics payloads, or normal logs.
- Previewing must not publish or mutate content.
- Unauthorized and expired sessions must not render retained draft data.
- Caching policy, iframe or route security headers, cross-origin session behavior, and preview URL handling require an approved security design and tests.
