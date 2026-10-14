# Migration progress

## Current phase

**Phase 0 — audit and blueprint complete. Phase 1+ not started.** This is the initial audit-only pass requested in the migration brief. No Java project was created and no .NET/frontend application behavior was changed.

## Status

| Module | Audit | Java implementation | Tests | Frontend parity | Notes |
|---|---|---|---|---|---|
| Repository/build/config | Complete | Not started | Baseline captured | Not started | No .git directory in this checkout. |
| API inventory/contracts | Static inventory complete | Not started | Baseline captured | Not started | 79 controller actions; live Swagger not available. |
| Database/schema | Snapshot/migrations inspected | Not started | No DB integration run | Not started | 31 mapped tables; live database catalog still needs inspection. |
| Authentication/RBAC | Source audit complete | Not started | API tests pass; focused security parity not run | Not started | Password hasher/provider path need compatibility vectors. |
| Brands/tenant isolation | Source audit complete | Not started | Cross-tenant matrix missing | Not started | Existing scope coverage uneven. |
| Pages/revisions/publish | Source audit complete | Not started | Unit/API baseline captured | Not started | Publish policy/transactions/concurrency need attention. |
| Widgets/data/SSR | Source audit complete | Not started | Widget/frontend tests included in pass set | Not started | Java keeps existing Next renderer system. |
| Media/templates/themes/layouts | Source audit complete | Not started | Focused coverage exists but no E2E | Not started | DB media; template workflow incomplete/unclear. |
| Redirects/SEO/routing | Source audit complete | Not started | Six application baseline failures | Not started | Loop validation failures need triage. |
| Observability/deployment | Source audit complete | Not started | No Java verification | Not started | Compose exists; Aspire is .NET-specific and retained initially. |

## Baseline command results

- Frontend: 137/137 Vitest checks pass (13 files).
- Backend API: 137/137 xUnit checks pass.
- Backend application: 107 pass, 6 fail of 113, all redirect validation/loop cases.
- No standalone Release build, Testcontainers, live database parity, browser E2E, external SSO, or Java tests were run.

## Gate before implementation

Review migration/MIGRATION_PLAN.md and migration/RISKS_AND_OPEN_QUESTIONS.md. Establish a version-controlled baseline and isolated database copy. No Java implementation/cutover is authorized by this audit document; the supplied task explicitly says to wait for approval after audit.
