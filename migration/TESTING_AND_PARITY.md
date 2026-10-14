# Testing and parity plan

## Baseline (freshly run during audit)

| Suite | Result | Command / notes |
|---|---|---|
| Frontend Vitest | 137 passed / 137 total; 13 files passed | `npm test -- --reporter=dot` in frontend. |
| API xUnit | 137 passed / 137 total | Included in `dotnet test Cms.slnx --no-restore --verbosity quiet`. |
| Application xUnit | 107 passed, 6 failed / 113 total | Failures are four redirect validator expectations and two redirect loop detection tests. |
| Whole .NET solution test | Failed due to the six application failures | Also reports moderate OpenTelemetry advisories and EF Relational 10.0.0/10.0.1 assembly conflict warnings. |
| Build | Not run as a separate command in this audit | `dotnet test` built as required for the test run, but no standalone Release build or Java build exists. |
| Database/browser integration | Not run | Swagger port did not respond; no E2E/Testcontainers configuration was found in inspected test projects. |

Do not mark Java parity green by porting tests with broken assumptions. First triage the six failing redirect tests against current product behavior; record whether code or test expectations are wrong. Migration should reproduce agreed behavior and prevent redirect loops.

## Test layers required

1. **Serialization contract:** DTO fixtures for camelCase, null omission, string enums, UUID, timestamps, nested page/widget JSON, multipart upload and raw HTML/XML/file responses.
2. **Unit:** validators, page state transitions, dynamic route matcher, redirect normalization/loop detection, permission resolution, media validation/conversion, proxy allow-list.
3. **Repository integration:** JPA mappings/queries against PostgreSQL Testcontainers and a disposable schema matching the 31-table snapshot; test unique constraints, FK behavior, jsonb round trips and transactional state.
4. **Controller/API:** MockMvc tests for each of the 79 controller actions, including success, malformed body, validation failure, missing row, unauthenticated, insufficient permission and cross-brand access where relevant.
5. **Authentication:** Existing JWT vector acceptance, issuer/audience/expiry/signature rejection, token-version and role claims, password verification compatibility.
6. **Workflow integration:** create page → save draft → preview → publish → public fetch → publish previous revision → verify old output; publish failure leaves prior pointer unchanged; concurrent update produces conflict after implementation.
7. **Frontend parity:** point existing frontend API base URL at Java staging; run existing Vitest/build and browser smoke for login, brand list, builder, media, users/roles, preview and published routes.
8. **Security:** full route × role × brand matrix, SSRF tests, CORS preflight, public endpoint exposure, upload validation and audit redaction.
9. **Operational:** startup with missing/invalid config, database unavailable, readiness/liveness, graceful shutdown, migration/schema validation, structured logs/correlation.

## Required acceptance criteria

- All frontend tests/build pass unchanged against supported API URLs.
- For each endpoint, captured .NET and Java response comparisons match status, relevant headers, JSON fields/types/null behavior and error schema, except explicitly approved differences.
- Java startup never mutates an existing schema automatically; existing migration history and data remain intact.
- Existing valid users can authenticate without mass reset or weaker password policy.
- Cross-brand object access is denied for read/write/delete/publish/preview/media/revisions; role/permission scope matches the approved policy matrix.
- Saving a draft leaves the published revision unchanged. Publish atomically moves the active published pointer after its snapshot is durable.
- Previous revision republish yields equivalent page content/SEO/theme/layout.
- Dynamic route ordering, route parameters, sitemap eligibility, redirects and response codes match current behavior.
- All Java unit/integration/API tests pass; environmental skips are explicit. No blanket “migration complete” while a module row remains incomplete.

## Parity status template

| Module | Implemented | Unit tests | Integration tests | Frontend compatibility | Remaining issues |
|---|---|---|---|---|---|
| Health/config | Not started | Not run | Not run | Not run | Audit only |
| Auth/RBAC | Not started | Not run | Not run | Not run | Password hash and scope behavior |
| Brands/domains | Not started | Not run | Not run | Not run | Tenant scope |
| Pages/revisions | Not started | Not run | Not run | Not run | Publish transaction/concurrency |
| Widgets/data | Not started | Not run | Not run | Not run | JSON and SSR parity |
| Media | Not started | Not run | Not run | Not run | DB bytes/WebP/public file behavior |
| Templates/themes/layouts/settings | Not started | Not run | Not run | Not run | Scope and JSON fields |
| Redirects/routing/SEO | Not started | Not run | Not run | Not run | Existing six failures; route semantics |
| Users/roles/audit | Not started | Not run | Not run | Not run | RBAC output parity |
| Proxy/integrations | Not started | Not run | Not run | Not run | SSRF, secrets, timeouts |
