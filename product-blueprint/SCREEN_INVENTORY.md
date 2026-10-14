# Screen inventory

This inventory is from Next.js App Router source under frontend/app. API handlers are listed separately from user screens. “Confirmed” means a route file exists; it does not certify all empty/error/permission states.

## Existing routes

| Route | Purpose / user | Main UI and actions | Data/API dependencies | States/access notes |
|---|---|---|---|---|
| / | Entry redirect/landing | Entry point into admin | Auth context | Inspect frontend/app/page.tsx for final redirect behavior. |
| /login | Authenticate user | Email/password; provider path when configured | POST api/auth/login; AuthContext | Split login composition; validation/loading/error; not an admin-shell route. |
| /brands | Choose/manage brands | Brand list, create/edit brand | Brands and theme/domain APIs | Authenticated shell; brand-management permission gating in UI; API policy required. |
| /brands/[brandId]/redirects | Manage one brand’s redirects | Breadcrumb, redirects table, create/edit/delete | api/brands/{id}/redirects | Requires redirect-management policy in API. |
| /builder/[brandId] | Create/edit pages | Toolbar, insert/pages/themes panel, canvas, inspector, dialogs | pages, widgets, templates, themes, layouts, settings, media, page-data APIs | Auth required; specific brand authorization must be server checked. Has loading.tsx. |
| /media | Media library | Upload, crop, select, details/update/delete | api/media | Auth + media permissions; file read route is anonymous. |
| /users | User administration | User table, edit dialog and access assignments | api/users and /assignments | Auth + users.read/manage policies; scope operations. |
| /roles | Role Studio | Role/permission table and editing | api/roles | Auth + roles.read/manage. |
| /preview/[brandKey]/[[...uri]] | Render page preview/published content | PublishedPageRenderer + site layout | Brand lookup, page by URI, theme, layout, SSR widget data | Dynamic route; not-found.tsx and error.tsx. Verify preview/public authorization mode. |
| /preview/[brandKey]/sitemap.xml | Sitemap | XML response route | Brand/page API | Public-facing output; static published pages only per implementation docs. |
| /api/embed/widget | HTML fragment for supported widgets | API route response, not interactive screen | Widget definition and SSR/rendering | See Documentation/widget-html-embed.md; capability is allow-listed. |
| /dev/health | Development health | JSON/status handler | Local runtime | Development utility; not product screen. |
| /signin, /signin-callback | External sign-in flow | Redirect/callback | Auth provider config and backend callback | Conditional integration; exact provider availability depends on config. |

## Screens/modules without dedicated route

| Capability | Current location | Status |
|---|---|---|
| Page creation/list | Builder side panel and dialogs | Exists inside builder; no separate /pages route. |
| Page SEO | Builder sheet/panel | Exists; no standalone route. |
| Template library/manager | Template API and builder references | Dedicated routable screen not found; use workflow unverified. |
| Version history | Builder dialogs/API revision endpoints | Revision API and version dialogs exist; complete history/restore flow needs verification. |
| Brand settings/theme/layout management | Brand dialogs and builder tabs | Components exist; not separate top-level routes. |
| Audit logs | AuditLogPanel component/API | Standalone route not found; access and UI reachability require verification. |
| Route management | Dynamic page URI and redirect features | No standalone route-management screen. |
| Access denied | Shell redirects unauthorized user to /brands | Dedicated 403 page not found; improve explanatory state. |
| Dashboard/analytics | None found | No dashboard route; analytics is HLD roadmap. |

## Additional screens only if approved as product scope

- Publishing history with revision compare, restore, and actor/version metadata.
- Template library with category/search, preview, and safe page instantiation.
- Audit event viewer and export.
- Explicit 403/access-denied and recoverable API-error pages.
- Brand-scoped member management if not covered sufficiently in user assignment dialogs.

These are proposals, not confirmed requirements. Frontend source evidence: frontend/app/(admin)/ and frontend/components/{layout,admin,builder,media}/. API route evidence: backend/src/Cms.Api/Controllers/.
