# Functional specification

This document maps product areas to code-backed behavior. “Verified” means supported by implementation inspection and/or existing focused tests; it does not mean every production scenario is tested. See REQUIREMENTS_TRACEABILITY.md for status vocabulary and evidence.

## Brand and tenant management

**Implemented:** Brand records include name, domain/subdomain, logo, colors, CSS, and custom font URLs. Brand endpoints include list/get/create/update/delete, host resolution, sitemap, domain list/add/remove, and availability checks. Site settings, themes, layouts, media, redirects, pages, and templates can be associated with a brand.

**Partial / risk:** User brand IDs and scoped RBAC assignments exist. Media upload/update/delete explicitly validates brand access. There is no EF global tenant filter, and several page, theme, site-layout, template, redirect, or domain-object service paths load records by ID without consistent caller-brand verification. A brandId query parameter must not be treated as authorization. Add authorization checks at every object boundary before claiming robust isolation.

## Page builder

**Implemented:** The editor route is /builder/[brandId]. The UI provides page selection/creation, a sortable canvas, widget library, property inspector, page data configuration, page SEO, media selection, layout and settings dialogs, responsive viewport modes, preview mode, and undo/redo controls. See frontend/app/(admin)/builder/[brandId]/PageContent.tsx and frontend/components/builder/.

**Partial / verify:** There is a publish dialog and API, but frontend permission gating and endpoint authorization must be audited together; PagesController has class-level authentication without a policy-specific publish requirement. Do not infer a separate approval stage or draft autosave from the presence of Save/Publish controls. API creation and updates require a signed-in user but are not shown here to enforce per-brand scope.

**Configuration:** Widget fields come from schema JSON. Documentation/PropertiesPanel.md describes field types, conditional visibility, groups, tabs, responsive styles, element styles, and custom renderers. Data binding and API-call configuration are present in builder components.

## Widget management

**Implemented:** Definitions and versions are discovered from widgets/**/Definition.cs. The seeder upserts their data into widget-definition tables; the Next.js custom-renderer registry discovers widget React files at build time. Definitions contain schema/defaults, category, brand IDs, advanced flag, embed capability, and latest version. Version rows support deprecation and change logs. APIs expose definitions and versions.

**Not an admin authoring UI:** Engineers create/update source files and release through code/build/deploy. Editors configure instances in the CMS. Version records exist, but a complete migration assistant or editor for authoring/releasing widget code is not evidenced.

## Templates

**Implemented in API/domain:** Template contains name, description, optional BrandId, JSON BodyContent, thumbnail, category, and author/timestamps. TemplatesController lists, creates, and updates. Template service/repository can filter by brand.

**Missing/unclear:** No delete endpoint in the inspected controller, no template-version entity/history, no assured UI screen in the route inventory, and no verified “instantiate as a deep copy” workflow. HLD says template application exists in builder; implementation path needs focused verification. Proposed acceptance: a page instantiated from a template receives independent content and never mutates the source template.

## Page lifecycle and revisions

**Implemented:** Page stores mutable current body/SEO/theme/layout/CSS and status; PageRevision stores snapshots. Publishing without revisionId copies current draft fields into a new revision and sets PublishedRevisionId. Publishing with a revisionId points publication at an existing revision. Published route resolution reads the selected published revision. API exposes revisions and revision detail. This gives a rollback-like mechanism by publishing an earlier revision again.

**Limits:** No optimistic concurrency token or conflict check was found. Publish endpoint has no explicit publish policy attribute. No workflow approval, schedule, automatic rollback, explicit unpublish transition, or atomic failure guarantee has been established from inspection. A failed publish must leave the previous live revision intact; verify transactional boundaries before treating that as guaranteed.

## Media

**Implemented:** Brand-scoped media entity and API list/get/upload/metadata update/delete. Upload bytes are stored in database mode, validated by content type/extension, and optionally converted to WebP. Media UI includes library, upload, crop, and details components. Public file endpoint is anonymous by design; metadata operations are permission-protected.

**Partial:** Blob storage fields are reserved for future use. The media list UI and service authorization should be checked for every cross-brand read. Image derivatives, virus scanning, durable external object storage, and usage/reference cleanup are not established.

## Routing, SEO, and accessibility

**Implemented:** Pages have static/dynamic URI support, page metadata (title, description, keywords, canonical, Open Graph, noindex/nofollow), brand sitemap endpoint, redirects, robots text in site settings, and published-page rendering. Dynamic URL behavior is described in Documentation/DynamicUrlPages.md. Semantic guidance is in Documentation/Semantic.md.

**Partial / missing:** No dedicated SEO screen route; the editor has a PageSeoPanel. Sitemap excludes dynamic pages per HLD/code docs. robots.txt behavior, canonical consistency, Open Graph output, structured data, redirects, and accessible output need route-level tests. No structured-data management feature was verified.

## Administration and governance

**Implemented:** Login/register and identity, JWT, permission catalog, role definitions, role-permission mappings, scoped user-role assignments, users UI, roles UI, audit-log entity/API, and system endpoints. Audit access is permissioned at controller level. Page-level audit coverage across every mutation is not established.

**Not established:** Separate reviewer/publisher workflow, approvals, user invite/credential lifecycle, comprehensive audit coverage, or custom role creation experience beyond role studio capabilities should be verified per route and permission.

## Integrations and data

PageDataConfig stores variable and API-call JSON. Widget instances can map API data and variables using bindings and transformations. Optional widget ssrEndpoints.ts allow published-page SSR data fetching. API proxy exists and has configuration and execution routes. Mock endpoints serve sample galleries, destinations, FAQ, packages. No production travel/inventory provider or integration catalog was verified. API failures need clear editor and SSR fallback behavior; SSR failures should not prevent unrelated page content rendering.

## Functional rules to adopt (proposals)

1. Enforce tenant authorization on both reads and writes, including ID-addressed resources.
2. Save draft changes without affecting the currently published revision.
3. Publish only after server-side validation and a dedicated permission check.
4. Preserve the prior published revision if a new publication fails.
5. Detect stale writes and make the user resolve conflicts rather than silently overwrite.
6. Validate widget schema and URL/SEO values server-side; show field-level errors.
7. Template instantiation deep-copies its source content.
8. Keep public assets intentionally public and metadata operations protected.

## Acceptance criteria proposals

- Given a user scoped to Brand A, when that user requests a Brand B page, media item, theme, layout, template, or revision by ID, then the API denies access without returning restricted data.
- Given a page with a published revision, when an editor saves a draft update without publishing, then public rendering continues to serve the prior revision.
- Given a user without publish permission, when they call the publish endpoint directly, then the API denies the request even if the UI hides the publish action.
- Given an invalid widget field or page URI, when the editor saves or publishes, then the API returns actionable validation details and retains the last valid published revision.
- Given a publish persistence failure, when publication is attempted, then the active published pointer remains unchanged.
- Given two editors load the same page and one saves first, when the second submits stale data, then the API reports a conflict instead of silently overwriting the first save.
- Given a page is created from a template, when an editor changes the page, then the stored template content remains unchanged.
- Given a public page request matches a brand and published URI, when it is rendered, then metadata, theme, shared layout, and page content correspond to that same brand and revision.
