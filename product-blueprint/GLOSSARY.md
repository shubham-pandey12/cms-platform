# Glossary

| Term | Meaning in this repository |
|---|---|
| Brand | Tenant-like unit with domains, pages, media, settings, themes, layouts and redirects. Isolation is intended but not consistently enforced in all paths. |
| Page | Brand-associated content record with URI, status, SEO, theme/layout references and serialized body content. |
| Draft | Mutable current page fields edited in the builder. Exact immutable draft-revision behavior is not established. |
| Published revision | PageRevision snapshot referenced by Page.PublishedRevisionId and used to render public output. |
| Template | Reusable JSON page-content record, optionally associated with a brand. Version history is not modeled. |
| Widget definition | Engineer-authored metadata, configuration schema, defaults, category and availability; discovered from source. |
| Widget version | Specific schema/default snapshot with semantic version, release notes and deprecated/latest flags. |
| Widget instance | A configured placement of a widget inside page/layout JSON, including styles, bindings, actions and visibility. |
| Custom renderer | React component for rendering a widget beyond generic schema-driven rendering. |
| Page data | Per-page variables and API-call configurations that widgets can bind to. |
| Theme | Colors/fonts and related visual tokens, optionally brand-specific. |
| Site layout | Brand-level header/footer/sidebar widgets and default-layout selection. |
| Site settings | Site identity, navigation, scripts, locale, robots/canonical and related settings for a brand. |
| Media item | Metadata and file bytes/URL associated with a brand; database storage implemented, blob mode reserved. |
| Role definition | Named RBAC role made of permission assignments; system roles are seeded. |
| Permission definition | Capability key, description, and intended organization-vs-brand scope. |
| User role assignment | Role assigned at organization scope or a specific brand scope. |
| Tenant isolation | Server-side guarantee that an actor can access only authorized brand resources; requirement not universally verified. |
| SSR | Next.js server-side rendering for preview/published pages; optional widget endpoint data can be loaded server-side. |
| CMS | Content management application, currently shown as “Content Studio” in frontend copy. |
| Approval workflow | Proposed review/publish gate; no complete approval state machine found. |
| Rollback | In current implementation, republishing an existing PageRevision through the publish endpoint; not a distinct transactional rollback subsystem. |

## Naming note

These documents intentionally use generic product naming and sample Brand A/Brand B. They avoid reintroducing removed company names or brand-specific sample data.
