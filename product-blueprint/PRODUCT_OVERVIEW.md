# Product overview

## Product in one sentence

Content Studio is a multi-brand content management application for building, configuring, previewing, and publishing customer-facing pages from reusable React widgets, with an ASP.NET API and PostgreSQL persistence.

## Evidence and naming

This blueprint describes the repository as it exists after its product-name cleanup. “Content Studio” is the visible UI name in frontend/data/data.json. A “brand” is the product’s tenant/content partition in the domain model; it does not imply a third-party brand or sample business. The former brand-specific use-case documents named in the supplied task are not present. The current primary design source is Documentation/HighLevelDesign.md, supplemented by implementation and tests. Existing requirements and proposals are labeled separately below.

## Problem and intended value

Confirmed by the code and HLD: the product lets a team operate multiple branded sites from a shared CMS, configure brand themes/domains/settings, compose pages with widgets, manage drafts and published snapshots, and serve pages through a Next.js rendering path. A reusable widget has an engineer-owned definition/schema and a content-editor-owned configuration instance. This reduces the need to implement each page as a bespoke frontend release.

Illustrative example (not a confirmed customer requirement): a travel company could maintain a general holidays site and a separate adventure-travel site. Engineers provide approved hero, destination, FAQ, gallery, and CTA widgets. Editors compose a seasonal destination page for one brand, preview and publish it, then use the same widget types with different content for the other brand. Each brand can have its own domain and theme. The repository currently contains generic travel-shaped mock-data APIs and sample widgets; this example does not assert a real customer, real travel inventory, or production integration.

The expected business benefits—faster page launches, less duplicate frontend work, consistent components, and safer brand-level governance—are product rationale, not measured outcomes in this repository.

## Users

Verified seeded role keys are admin, content_team, and engineer. Their permission assignments are defined in backend/src/Cms.Persistence/Seeding/DatabaseSeeder.cs. The UI also models page editing and brand management, but there is no dedicated reviewer/publisher role or separate publish permission in the seeded permission catalogue. See USER_ROLES_AND_PERMISSIONS.md.

## Confirmed scope

- Brands, domains, theme data, site layouts, and site settings.
- Page creation/editing, drag-and-drop widget composition, page data bindings, preview, and publish/revision APIs.
- File upload and media metadata management, with file bytes persisted in the database storage mode.
- Templates as JSON page-content records with create/update/list APIs.
- JWT login, role/permission management, assignments, and audit-log APIs.
- Next.js preview/published rendering paths, dynamic URLs, sitemap generation, and redirects.

## Not established as shipped

The source does not establish a complete template library workflow in the editor, durable workflow approvals, real-time co-editing, conflict detection, scheduled publishing, distributed cache invalidation, full route-level internationalization, CDN/blob storage, or production operational readiness. Some appear in HLD roadmap sections; others are missing or require more verification. See GAPS_AND_ROADMAP.md.

## Product experience direction

The existing UI is a professional admin workspace: light surfaces, compact gray text, blue active navigation, a persistent top bar and desktop sidebar (mobile drawer), and a focused page-builder canvas. The builder has an editor toolbar, an insert/pages/themes panel, a canvas, and widget properties. Preserve these conventions when evolving the product. This is an implementation-grounded visual direction, not a standalone approved design comp.

## Source map

- Architecture and feature intent: Documentation/HighLevelDesign.md.
- Widget conventions: Documentation/WidgetSystemOverview.md, Documentation/WidgetDevelopmentGuideV2.md, widgets/README.md.
- Permissions: backend/src/Cms.Persistence/Seeding/DatabaseSeeder.cs and backend/src/Cms.Application/Common/Security/.
- UI routes and shell: frontend/app/(admin)/ and frontend/components/layout/.
- Runtime domain: backend/src/Cms.Domain/Entities/ and backend/src/Cms.Application/Services/.
