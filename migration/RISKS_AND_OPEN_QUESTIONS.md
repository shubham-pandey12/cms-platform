# Risks and open questions

## High risks

| Risk | Impact | Safe next step |
|---|---|---|
| No Git metadata in this checkout | Cannot establish a clean commit, inspect a diff, or recover through local VCS if changes go wrong. | Move implementation to a VCS-managed clone and commit audit baseline before coding. |
| Tenant scoping is inconsistent | Cross-brand data exposure or mutation may survive a literal port. | Inventory resource ownership and add direct API cross-tenant tests before Java endpoints are exposed. |
| Password hashes may not interoperate | Existing users may be locked out or tempted to weaken authentication. | Read Identity hasher configuration and test sanitized hash vectors; agree on a secure rehash plan. |
| Publish authorization absent as a separate permission | Authenticated users may publish without intended role grant. | Decide least-privilege policy; enforce only with explicit approval because it changes behavior. |
| PostgreSQL DDL/EF history may diverge from snapshot | Hibernate may break or mutate a shared database. | Inspect live schema read-only; use restored copy; schema validate only. |
| Six current redirect tests fail | Baseline is not green; redirect validation/loop behavior uncertain. | Triage before using tests as parity oracle; retain the loop-prevention invariant. |
| Provider callback path and protocol are legacy-specific | Frontend sign-in callback can break if route name or exchange contract changes. | Capture existing callback traffic/config with secrets redacted; preserve URL during port, coordinate deprecation separately. |
| Frontend reaches development build but no live Swagger | Live API comparison unavailable, unknown runtime configuration/deployment state. | Start isolated API against disposable DB only after config audit, or capture from approved staging. |
| No distributed cache but local cache exists | Multi-instance routing may have different 30-second candidate snapshots. | Preserve behavior initially; decide whether to share/disable cache before horizontal scaling. |
| Generic sample data and old mock endpoint names | Existing widget API consumers depend on their shape, while brand cleanup requests generic data. | Preserve current endpoint behavior for migration; do not seed removed company data. |

## Open decisions

1. Which Java distribution/vendor and licensing policy should be used? Proposed runtime is Java 25 LTS; confirm standard image and support horizon.
2. Is Java 25 acceptable to deployment/CI hosts, or should Java 21 be selected for longer ecosystem compatibility? Spring Boot compatibility and vendor patch policy must both be evaluated.
3. Maven or Gradle? Maven Wrapper is the default recommendation for this repository’s small standalone service.
4. Should Java access existing schema read/write during a shadow phase, or only use restored isolated copies until cutover?
5. Who owns future schema changes: freeze EF migrations, formally baseline Flyway, or coordinate a single migration tool? Do not choose implicitly.
6. How will ASP.NET Identity password hashes be verified and upgraded in Java?
7. Should the anonymous registration and admin bootstrap endpoints exist in production? Current route/config gate needs inspection and approval.
8. What is the desired publish permission/approval policy? Existing role mapping does not define a distinct publish permission.
9. Should Java migration preserve current CORS-any-origin behavior or use a controlled frontend allow-list? Tightening alters deployment behavior but is advisable after inventory.
10. Is public media-file access intentional for all stored items, or should access become signed/private?
11. What is the approved Java deployment topology and how should the .NET Aspire/Postgres local workflow remain available during transition?
12. Can the omitted legacy external-provider identifier be referenced in internal compatibility fixtures/source without republishing it in generic project docs? The exact current callback route must still be captured to avoid breaking sign-in.

## Estimate

This is a high-complexity migration, not a mechanical translation. API breadth (79 controller actions), Identity/password compatibility, row-level tenant security, JSONB content shape, published snapshots, dynamic routing, widget SSR, direct frontend coupling and the absence of a version-control baseline dominate effort. A reliable timeline cannot be estimated until CI/deployment targets, database size/schema, password-hash tests and contract capture are known. Proceed module-by-module with a dual-runtime period; no rewrite/cutover approval is implied by this blueprint.
