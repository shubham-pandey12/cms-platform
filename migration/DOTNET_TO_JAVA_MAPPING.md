# .NET to Java mapping

This is a proposed mapping for a later implementation phase, not a Java code scaffold. Keep each mapping tied to current implementation evidence in CURRENT_BACKEND_AUDIT.md.

| Current .NET component | Java/Spring equivalent | Compatibility notes |
|---|---|---|
| ASP.NET Core controllers + attributes | Spring MVC @RestController, explicit @RequestMapping methods | Preserve route, method, query/body binding, status codes and public/protected behavior. Add MockMvc contract tests. |
| DTO records and System.Text.Json | Java request/response records + Jackson configuration | Configure camelCase, null omission on responses, tolerant request names if required, camelCase enums, ISO timestamps, UUIDs, and exact error envelopes. Never serialize entities directly. |
| FluentValidation validators | Jakarta Bean Validation + service-level validators | Preserve current validation order/messages/status and distinction between route input and business invariants. Some validation tests currently fail and must not be ported as desired truth without product decision. |
| Application services | Spring @Service transactional application workflows | Keep business rules outside controllers. Use explicit @Transactional for page snapshots, RBAC assignment replacement, domain creation and audit semantics. |
| Domain entities/value objects | JPA persistence entities plus immutable Java value/DTO types | Avoid coupling serialization to JPA; map JSONB properties deliberately; preserve C# enums’ persisted values and UUID defaults. |
| Repository interfaces/EF repositories | Spring Data JPA repositories and focused custom queries | Preserve filtering, ordering, route matching, unique-violation handling, paging and query semantics. Review implicit lazy loading/N+1 behavior. |
| CmsDbContext + EF migrations | EntityManager/DataSource + schema validation; controlled Flyway for approved Java-owned changes | Do not let Hibernate mutate schema. Keep existing migration history and schema intact. See DATABASE_COMPATIBILITY.md. |
| ASP.NET Identity UserManager/RoleManager | Spring Security AuthenticationProvider + compatible password encoder/identity adapter | Password hash format is a migration blocker until test vectors prove compatibility. The CMS’s RBAC tables differ from Identity role table. |
| JWT bearer middleware + JwtService | Spring Security resource-server JWT decoder/encoder or equivalent | Preserve HMAC algorithm/key bytes, issuer, audience, expiry, token-version and claim names. Keep auth response field shape/token storage semantics. |
| PermissionAuthorizationHandler/IPermissionResolver | AuthorizationManager/method security + tenant-aware access service | Resolve resource ownership from DB, not only route variables. Current permission handler only extracts route value `brandId`; add cross-brand tests. |
| IMemoryCache | Caffeine/local cache or Spring Cache with in-process provider | Dynamic-page candidate list keyed by brand, TTL 30s, evict on writes. Ensure parity before considering distributed cache. No Redis currently. |
| HttpClient/standard resilience handler | Spring WebClient or RestClient + bounded timeouts/retry policy | Separate provider auth HTTP timeout from proxy integrations; preserve retry/timeout/error mapping. Avoid blind retry of writes. |
| Serilog, request logging/correlation middleware | SLF4J/Logback structured logs + filter/interceptor + Micrometer tracing | Propagate correlation ID; redact credentials and sensitive values; preserve useful event context. CloudWatch sink is config-dependent. |
| GlobalExceptionHandlerMiddleware | @RestControllerAdvice + typed exception-to-response mapping | Preserve exact status/message/statusCode/correlationId, validation payload and non-disclosing not-found behavior. |
| Fluent API validation behavior | Jakarta Validation + explicit error mapper | Validation response compatibility should be based on HTTP fixture comparisons, not framework defaults. |
| .NET Aspire service defaults | Docker Compose and/or Java Actuator; retain Postgres orchestration initially | Aspire AppHost is .NET-specific; do not remove it during migration. New app health should match `/health` and `/alive` as needed. |
| Aspire AppHost | Existing Compose/local scripts plus later approved Java service config | Current AppHost starts Postgres/API; frontend registration is commented. Keep old path runnable during transition. |
| Widget C# definitions/discovery | Keep widget source pipeline and add Java-compatible metadata discovery/import | Widget definitions are data produced from repo source; decide whether Java reads seeded definitions only or shares generated manifest. Do not rewrite widget renderers. |
| Next.js custom renderer discovery | No Java replacement; preserve frontend build-time renderer tree | Java API supplies metadata; Next.js continues rendering widgets and published pages. |
| Optional widget SSR endpoint map | Existing Next.js SSR integration with API data | Keep API timeout, auth/public distinctions, serialization and fallback semantics. |
| EF audit entities | JPA entities/repositories and explicit audit event service | Verify every sensitive mutation emits equivalent actor/entity/action/time/details; avoid accidental data leakage. |
| Image conversion/upload | Existing frontend unchanged; Java ImageIO or vetted imaging library only if required | Audit current allowed formats, limits, quality and WebP behavior before choosing dependency. Test byte fidelity and resource limits. |
| Next.js proxy/API base config | Keep current frontend API base URL/proxy contract | Minimal/no frontend changes is a gate. Change only after compatibility is proven. |

## Proposed package structure

Start small under `backend-java/src/main/java/...`: `api` for controllers/error mapping, `application` for workflows/validators, `domain` for meaningful invariants/types, `persistence` for JPA mappings/repositories, `security` for JWT/RBAC, and `config` for Jackson/CORS/DB/observability. Add a `tenant` package only for concrete resource-scope enforcement. Avoid duplicating .NET interfaces without an actual Java use case.

## Important implementation details

- Jackson default enum names will not automatically match camelCase values; configure a stable mapping.
- LocalDateTime/Instant conversion needs UTC and the same wire format.
- PostgreSQL jsonb needs typed JSON mapping, not double-encoded `String` values.
- EF GUID defaults and sequence behavior must be read from actual DDL.
- Use response DTO assemblers/mappers for DTOs where current C# uses Mapster/adaptation.
- Spring’s default 400/401/403/404/500 bodies differ from current middleware. Implement explicit parity.
- Preserve `CreatedAtAction` location headers where clients/tests depend on them.
- Transaction rollback and cache eviction ordering are significant for publish and route behavior.
