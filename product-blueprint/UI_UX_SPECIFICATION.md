# UI/UX specification

## Evidence-based visual direction

The current admin is a light, compact desktop workspace with Plus Jakarta Sans, white surfaces, gray borders/text, blue navigation selection, and cyan/teal component accents. The shared shell has a top bar, 260px desktop sidebar, and mobile drawer. Builder-specific styling includes a central canvas, widget selection/drop states, and properties panel tokens. Evidence: frontend/components/layout/AdminShell.tsx, AdminSidebar.tsx, frontend/app/globals.css, frontend/tailwind.config.ts, and builder components.

The theme has both a dark palette and dark-mode configuration, but the shared admin shell uses explicit light colors; consistent dark-mode support is not confirmed. Keep the established visual language; do not interpret this document as a new brand identity or approved high-fidelity design.

## Principles

- Make current brand and page context visible during edits.
- Distinguish draft changes from published output in the toolbar and page list.
- Keep save, preview, publish, and destructive actions clearly separated.
- Use schema-driven field labels, help text, inline errors, and keyboard-accessible controls.
- Preserve the compact neutral admin palette; reserve accent and status colors for focus, selection, and state.
- Keep brand-themed colors inside the customer-facing page canvas, not the CMS chrome.
- Surface empty, loading, error, and success states, including API and preview failures.
- Do not represent hidden navigation as authorization; the API must enforce permissions.

## Screen layouts and interactions

### Sign-in

Route: /login. A split layout presents product/context content and email/password form. Provide clear invalid-credential and network feedback, password-manager labels, and redirect-back behavior. Provider login is configuration-dependent. The page and API should not expose registration/admin bootstrap in production without an explicit policy.

### Brand directory

Route: /brands. Brand table/cards and create/edit dialog. Make each row’s brand name, domain, theme cue, and actions scannable. Brand selection should carry context into the builder and brand-specific media/redirect management. Empty state should guide authorized users to create a brand; unauthorized users should receive an access explanation.

### Builder

Route: /builder/[brandId]. Current source shows a visual site-builder workspace rather than an approved mockup. Preserve this information architecture:

- Toolbar: brand/page identity, editable page name, undo/redo, preview, save, view published, publish, SEO/settings actions. Keep pending/saved state and active viewport obvious.
- Left panel: Insert, Pages, Themes tabs. Widget search/category browsing and drag/drop are supported by the component architecture. Empty page and no-results states need helpful next steps.
- Canvas: selected page with widget/section selection, move/remove/reorder affordances and responsive viewport width presets. Use in-flow header behavior in editor mode; see root AGENTS.md widget renderer guidance.
- Inspector: selected widget’s schema-rendered controls. Tabs may include Content, Style, Bindings, Actions, Visibility; show grouped fields and inline validation. Explain where a setting comes from (page, widget, theme) when ambiguity is likely.
- Dialog/sheets: publish, SEO, page data/API calls, media library, layouts, settings, widget version choice. Keep dialogs focused and preserve unsaved state on close.

The repository supports many of these elements. Exact three-panel always-visible layout and every toolbar action must be checked against the current viewport; do not claim every suggested control exists.

### Media

Route: /media. Brand-filtered library with upload, crop, details/edit, search/filter and selection. Clearly indicate unsupported storage or upload failure. Show image alt text and dimensions where available; alt field exists. Use confirmation for delete and communicate that public file URLs may remain accessible if intended.

### Users and roles

Routes: /users and /roles. Use readable tables, explicit scope labels (organization vs brand), permission matrix names with descriptions, and clear unsaved/saved status. Editing assignments should show brand names alongside scoped roles. Never imply a UI-only restriction is security.

### Redirects

Route: /brands/[brandId]/redirects. Breadcrumb to brand directory; table of source, target, status and row actions. Validate redirect loops and malformed paths before save; display conflict/error state.

### Published/preview page

Routes: /preview/[brandKey]/[[...uri]], with not-found and error boundaries; page output should inherit the selected brand’s theme/layout and expose semantic, accessible HTML. Provide an editor-safe preview distinct from public published route behavior.

## Shared states and accessibility

AdminShell centralizes authentication loading and unauthenticated redirect. Route loading components exist for admin and builder. Tables include empty messages in some screens; standardize skeleton, retryable error, empty, and success toast patterns. Preserve skip links, semantic HTML, labels, keyboard focus, live announcements for save status, and non-color-only status cues. See Documentation/Semantic.md. Responsive admin beyond the mobile navigation drawer is not established; validate key screens at narrow widths.

## Recommendations (proposed)

1. Add persistent “Editing brand X / page Y” context and a visible published/draft indicator.
2. Make publish permission and validation outcomes explicit before confirmation.
3. Add a recoverable unsaved-changes warning and conflict detection.
4. Unify light/dark token usage; current hardcoded shell hex colors diverge from semantic tokens.
5. Standardize navigation labels and route titles; keep permission-denied and not-found states distinct.
