# Database compatibility and data preservation

## Current model

PostgreSQL is the existing source of truth. EF Core uses schema `cms` for application/Identity tables and `mock` for generic sample widget data. Current model snapshot maps **31 tables** (26 in cms, 5 in mock). No per-tenant schemas or database-per-brand behavior was found; brands are row-level tenant IDs.

### cms tables (26)

audit_logs, brands, brand_domains, media_items, pages, page_data_configs, page_revisions, rbac_permissions, rbac_roles, rbac_role_permissions, rbac_user_role_assignments, redirects, site_layouts, site_settings, templates, themes, widget_categories, widget_definitions, widget_definition_versions, users, roles, role_claims, user_claims, user_logins, user_roles, user_tokens.

### mock tables (5)

destinations, faq_items, gallery_images, simple_destinations, travel_packages.

Table count is based on backend/src/Cms.Persistence/Migrations/CmsDbContextModelSnapshot.cs, not on a live production database introspection. Before any migration, inspect the actual target database catalog and migration history read-only.

## Migration history

Ten EF migrations exist: initial schema (2026-01-10), widget versioning, site-layout default flag, supported locales and rename to supported langs, brand domains, media storage columns, HTML embed capability, RBAC/assignments, and unique-index correction. EF history table is expected to be __EFMigrationsHistory; verify exact schema/name from deployment. Existing constraints include brand+URI unique page index, unique domains, unique widget slug and slug+version, unique page-data per page, unique site settings per brand, unique brand+redirect source, unique RBAC role/permission keys, and scoped-assignment check/index constraints.

Many document fields are PostgreSQL jsonb: widget schema/config, page body/layout, SEO collections, settings scripts/languages, user/brand IDs, page dynamic variables, and page data. Preserve JSON shape, null/empty distinctions, UTC timestamp semantics, enum representation, UUID values and defaults (gen_random_uuid()) exactly.

## Java persistence plan

1. Build a sanitized database copy from a consistent backup and inspect schemas, columns, constraints, extensions, migration history and row counts.
2. Map the existing table/column names explicitly in JPA. Keep UUID and JSONB mapping deliberate. Add contract fixtures for snake/camel conversion where frontend DTOs differ from database names.
3. Configure Hibernate schema validation only. Do not use ddl-auto=update/create/create-drop against existing or shared data.
4. Initially make Java read-only against a disposable copy; later test writes/transactions on a resettable migration database.
5. Do not run Flyway baseline or alter the shared migration-history table until an approved ownership strategy exists. Options include freeze legacy schema and Java changes via reviewed SQL, or formally baseline Flyway at an exact schema snapshot; do not run EF and Flyway migrations concurrently.
6. Preserve all current rows, identity password hashes, serialized page content, revision pointers, media bytes, and IDs. Verify round-trip reads/writes and compare checksums/row counts before any cutover.
7. Any schema change must be additive, reversible where practical, reviewed, applied only to isolated staging, and separately approved for production.

## Schema details and migration concerns

- Page body and layout JSON are stored as jsonb despite C# model strings; Java must map as JsonNode/Json type or equivalent without string-escaping the JSON.
- Identity password hash interoperability is not guaranteed by matching the column. Test ASP.NET Identity hashes with a compatible verifier or plan a controlled rehash-after-login migration; never force resets or weaken verification silently.
- EF owns certain tables with provider-specific naming and Identity relationships. Capture exact DDL from the target database before Hibernate mapping.
- Existing migrations use Npgsql/EF-specific generated SQL and may depend on extensions/functions. Verify gen_random_uuid support and schema setup.
- Identity table `roles` is separate from CMS RBAC `rbac_roles`; do not conflate them.
- MediaItem stores bytes in DB for current provider. The reserved blob fields do not mean cloud object storage is active.
- In-memory cache means no cache table or Redis schema exists.

## Non-destructive acceptance checks

- Model/schema validation succeeds on a restored copy.
- Java integration tests assert expected columns, indexes, FKs, check constraints and JSONB types.
- Every existing table remains present; initial/current migration history is unchanged by Java startup.
- Representative records from each aggregate load and serialize equivalently; page body and widget JSON round trip byte/semantic-equivalent.
- No production-like connection string is used by automated tests.
