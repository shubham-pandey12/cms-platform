# Known issues and unverified behavior

This list records the audit state only. Findings are not fixed by this document-only change.

## Confirmed baseline failures

Six failures in backend/tests/Cms.Application.Tests during fresh `dotnet test Cms.slnx --no-restore --verbosity quiet`:

- CreateRedirectRequestValidatorTests: valid internal paths expected valid; HTTPS target expected valid, but validator returns invalid.
- UpdateRedirectRequestValidatorTests: valid partial update (only To or only From) expected valid, but validator returns invalid.
- RedirectServiceTests: create-chain and update-loop cases expected InvalidOperationException, but no exception was thrown.

The remaining application tests (107/113) pass. All API tests pass (137/137); all frontend tests pass (137/137). The failures mean redirect behavior must be investigated before porting. Do not silently adjust tests or behavior during the Java migration.

## Security/behavior issues from source inspection

- Tenant-scoped permission handler obtains brand ID only from route value `brandId`; many endpoints use query/body brand IDs or resource IDs.
- No global EF tenant query filters; per-resource ownership enforcement is inconsistent and requires a full endpoint audit.
- Pages controller uses authentication without explicit page/publish permissions; publish capability is not in the permission catalog.
- Anonymous registration and a dev admin bootstrap route exist; production exposure needs verification.
- CORS permits any origin/method/header in Program.cs; deployment-specific restrictions are needed.
- Proxy execute is an SSRF-sensitive feature; verify allow-list enforcement for redirects/DNS/IP cases.
- Media bytes are served through an anonymous file endpoint; intended access model must be explicit.
- Several read endpoints (themes/layouts/site settings/templates/widgets/page data) are anonymous. Review returned fields and tenant/brand constraints.
- OpenTelemetry package advisories and EF Relational assembly version conflict warnings appeared in test run; assess before release.

## Functional/operational uncertainty

- No concurrency token or optimistic lock found for page edits.
- Existing revision selection supports republish, but safe transaction behavior under DB failure needs integration proof.
- Template API has no version entity and no independently verified deep-copy instantiation workflow.
- Audit model and endpoint exist; completeness of mutation event creation is unclear.
- Robots settings exist, but serving route behavior should be verified. Structured-data editing was not located.
- No Redis, background job engine, scheduler, event bus, browser E2E, or Testcontainers project was found.
- Local Swagger endpoint did not answer on port 5002 during audit, so no live API contract snapshot was captured.
- Current checkout has no Git metadata; do not begin implementation here without a safe version-control baseline.

## Documentation mismatches

- HLD/AGENTS describe Next.js 14 and Node 18; frontend/package.json specifies Next.js 15 and Node >=22.
- AppHost currently provisions PostgreSQL and API; frontend registration is commented out.
- HLD describes intended role permissions more broadly than both seeded RBAC and endpoint-specific policy attributes support.
- No .NET-to-Java implementation or Java dependency compatibility has been tested; target stack in the blueprint is a proposal only.
