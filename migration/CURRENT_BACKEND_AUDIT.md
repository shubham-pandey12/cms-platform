# Current backend audit

## Scope and evidence

Inspected the actual repo root and code under backend, frontend, widgets, Widget_Specs, orchestration, scripts, tools, Docker/Compose and Documentation. Product-specific names are kept generic in these new docs per the earlier instruction to remove the original name and brand data. “Brand” below means the generic tenant entity retained in code.

The requested older use-case/HLD filenames are absent. Available references are README.md, Documentation/HighLevelDesign.md and focused widget/RBAC/SEO docs. No migration/ directory existed before this audit. There is no Git metadata in the checkout.

## Architecture

Backend uses ASP.NET Core controllers in Cms.Api, application services/DTOs/validators in Cms.Application, domain entities/value objects in Cms.Domain, and EF Core/Npgsql repositories/configurations in Cms.Persistence. Identity uses ASP.NET Core Identity. .NET Aspire AppHost provisions Postgres/API in Development; AppHost’s frontend registration is commented out. Compose provides standalone containers. Frontend is Next.js App Router/React, with shared API client in frontend/services/apiClient.ts.

The project targets net10.0; global.json pins SDK 10.0.100 with feature roll-forward and installed test output used SDK 10.0.101. Frontend package declares Next.js 15.2, React 18.3, TypeScript 5.8, Node >=22. This differs from older HLD/AGENTS claims of Next 14 and Node 18.

## API inventory

Static attribute scan finds **79 controller actions in 19 controllers**. ASP.NET routes are case-insensitive; API client commonly emits lowercase paths. There are also minimal health/readiness/liveness/root endpoints, dev-only /dev/health and a Next.js `/api/embed/widget` handler. See API_COMPATIBILITY.md for the full action inventory and DTO families. The previous local Swagger port did not respond, so schemas were mapped from controller signatures, DTOs and API client; no live OpenAPI document was available.

Controller modules: auth (5), brands/domains (11), redirects (6), media (6), mock data (6), page data (1), pages (9), proxy (2), RBAC bootstrap (1), roles (6), site layouts (5), site settings (2), system config (1), templates (3), themes (4), user assignments (2), users (3), widgets (5), audit logs (1). Sum: 79.

## Data and schema

Current EF snapshot maps 31 tables across schemas cms and mock: 26 CMS/Identity tables and 5 mock-data tables. Tables include brands, brand_domains, pages, page_revisions, page_data_configs, widget definitions/versions/categories, templates, themes, site layouts/settings, media, redirects, audit_logs, RBAC permission/role/assignment joins, ASP.NET Identity tables, and sample widget data. Database compatibility details and unique indexes/FKs are in DATABASE_COMPATIBILITY.md.

Ten versioned EF Core migrations exist from initial schema through widget versions, brand domains, media storage, embed capability, RBAC and index corrections. PostgreSQL uses jsonb for page/widget configuration and json-backed collections. Page uniqueness is brand + URI; domain and widget slug/version keys are unique. No schema-per-tenant: tenant separation is row/brand based.

## Security and tenancy

Authentication supports password login and JWT; an optional external identity provider callback/SSO integration is configuration-driven. Identity persists in PostgreSQL. JWT uses HMAC SHA-256, issuer/audience/lifetime/signature checks, and a configured key. There is an anonymous registration route and an anonymous development admin bootstrap route; production exposure must be explicitly prevented.

RBAC defines admin, content_team, engineer and 11 permissions. Assignment scope can be organization or brand. PermissionAuthorizationHandler resolves brand ID from a route value specifically named brandId; query/body IDs and routes named id are not automatically scoped. There are no EF global query filters. Media service explicitly validates brand access on writes, but read and other resource paths require endpoint-by-endpoint verification. Pages publish requires authentication but has no distinct publish permission. CORS currently allows all origins/methods/headers.

## Feature implementation and boundaries

| Module | Audit finding |
|---|---|
| Brands/domains | CRUD/host lookup/domain management exist; service/API authorization scope needs parity audit. |
| Pages/revisions | Mutable page fields, immutable publish snapshots, published pointer, semantic version string, static/dynamic URI. Republish prior revision acts as rollback. No optimistic concurrency token found. |
| Widgets | C# definitions are discovered at backend seeding; React renderers discovered at frontend build; schema/defaults/version/deprecation stored. No runtime code upload/admin definition editor. |
| Data binding | Per-page variables/API calls, widget bindings/transforms, optional server data fetch mapping. External endpoint allow-list/proxy behavior must be security tested. |
| Templates | Entity plus list/create/update API. No template version model; end-user instantiate/copy workflow unclear. |
| Media | Database bytes storage, upload validation, optional image WebP conversion; blob columns reserved. Public file GET. |
| SEO/routing | SEO value object, sitemap, dynamic route matching, redirects and robots/canonical fields. Structured-data workflow absent/unclear. |
| Auditing | Audit entity/API/panel exists; mutation coverage is not complete/proven. |
| Cache/jobs | IMemoryCache only; per-brand dynamic candidate list TTL 30 seconds, evicted on page add/update/delete. No Redis, scheduled job framework, event bus, or hosted background worker found. |
| Observability | Serilog, request/correlation logging, default Aspire health checks, optional OTLP. AWS CloudWatch sink package present/config dependent. |
| External integration | Optional external sign-in, configurable proxy/API endpoints, Google Fonts. No verified customer inventory integration. |

## Baseline tests run for this audit

- `npm test -- --reporter=dot` in frontend: **137 passed across 13 files**.
- `dotnet test Cms.slnx --no-restore --verbosity quiet`: API tests **137/137 passed**; application tests **107 passed, 6 failed of 113**. The six failures are redirect validator expectations for otherwise valid internal/HTTPS destinations and two redirect-loop service cases. .NET build/test emitted moderate OpenTelemetry package advisories and an EF Core Relational version conflict warning.
- No PostgreSQL/Testcontainers end-to-end suite, browser E2E suite, or current live API response comparison ran. Swagger was not reachable on the previously used local port.

## Risks that affect Java parity

Security scoping gaps, route/API casing, provider-callback naming, JSON/enum serialization, Identity password hash interoperability, migration ownership, database startup seeding, and current failing redirect tests must be accounted for before cutover. See RISKS_AND_OPEN_QUESTIONS.md and KNOWN_ISSUES.md.
