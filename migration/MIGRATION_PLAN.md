# Backend migration plan

## Goal and constraints

Replace the ASP.NET Core API with Java/Spring while keeping the existing Next.js frontend, PostgreSQL database/schema, public rendering behavior, authorization and deployment workflows compatible. The current .NET backend remains authoritative and runnable throughout migration. No Java code or application behavior is changed during this audit-only phase.

The checkout has no .git directory, so there is currently no local version-control rollback point or reliable diff. Before implementation, work from a version-controlled clone or establish a committed baseline. Do not cut over or delete .NET until explicit approval and parity acceptance.

## Proposed target

- Java 25 LTS with Spring Boot 4.1.1 is a compatible current pairing: Spring Boot 4.1.1 requires Java 17 or newer and supports through Java 26. Oracle identifies Java 25 as LTS. Confirm the organization’s supported distribution/licensing policy before selecting a vendor/build. References: [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html), [Java SE support roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html).
- Maven Wrapper, Spring MVC, Spring Security, Spring Data JPA/Hibernate, Jakarta Validation, PostgreSQL JDBC, Flyway only for forward-compatible Java-owned changes, Actuator, JUnit 5, Mockito, Spring Boot Test, and Testcontainers as needed.
- Keep the existing PostgreSQL schema and data. Configure Hibernate with validate/none, never update/create against the shared database. Baseline an initial Flyway migration only if a tested safe migration ownership plan is agreed.
- Use explicit JSON DTOs/mappers to retain camelCase, enum and null behavior. Do not serialize JPA entities directly.
- No Redis migration is needed based on this audit: current caching uses process-local IMemoryCache only.

## Phases and gates

| Phase | Work | Exit criteria / gate |
|---|---|---|
| 0. Audit (current) | Record routes/contracts, schema, security, consumers, and baseline tests. | Blueprint reviewed; unknown provider callback path and current test failures acknowledged. |
| 1. Compatibility harness | Capture representative .NET HTTP requests/responses, error codes, JSON shapes, auth and CORS. Add sanitized fixtures and cross-tenant cases. | Contract corpus reproducible; environment isolated. |
| 2. Java foundation | Add backend-java, Maven Wrapper, config profiles, JSON conventions, logging/correlation, exception mapping, Actuator. No production DB writes. | Startup/health tests pass; legacy backend still runs. |
| 3. Schema and read-only modules | Connect to isolated PostgreSQL copy; schema validation; port health/system, widgets, themes/site settings/layout reads and public data. | Repository integration tests and response comparisons pass. |
| 4. Content workflows | Pages, revisions, page data, templates, redirects, brands, media. Preserve transaction and content snapshots. | Route/CRUD/publish tests pass against copied schema; frontend smoke passes. |
| 5. Identity and tenant security | Port password/JWT, optional external identity callback, permissions, assignment scopes, endpoint policies, and resource ownership checks. | JWT parity and exhaustive cross-brand 401/403/404 tests pass. Security review signs off. |
| 6. Remaining administration/integrations | Users, roles, audit, proxy, upload processing, sitemap and dynamic routes. | API compatibility matrix complete; integrations have stub/real tests. |
| 7. Shadow/canary | Run both backends against isolated/copy data or route read-only traffic; compare contract outputs and latency/error behavior. | No unexplained diffs; rollback rehearsed. Never dual-write without designed idempotency. |
| 8. Cutover | Switch API base/proxy routing only after explicit approval. Keep .NET deployment and rollback route available. | Acceptance approved; backups and rollback tested; migration progress closed. |

## Recommended module order

Start with health/configuration and widget/theme reads because they have limited write coupling. Then port value-independent CRUD and brand-domain lookup, followed by page/page-data/revision/publication and routing, then media, redirects, templates, audit, user/role assignments, authentication, and proxy. This is a dependency-aware recommendation, not an assertion that security can be postponed: Java endpoints remain unavailable to real users until auth/tenant policies are in place. Authentication foundation must exist before protected endpoints can be exposed.

## Operational rules

- Preserve .NET startup path and Docker/Compose usage until new path is proven.
- No destructive SQL, production DB connection, shared-database writes, or schema changes during initial implementation.
- Keep environment variables and provider secrets external; never copy .env values into docs/tests.
- Use separate Java integration DB copied from schema and sanitized fixture data.
- Every migrated route has contract tests for success, validation, missing, unauthorized, forbidden and server-error behavior as applicable.
- Record intentional differences and get approval before changing the frontend contract.
