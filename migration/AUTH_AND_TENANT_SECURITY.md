# Authentication, authorization, and tenant security

## Existing authentication

- ASP.NET Core Identity user table with GUID IDs and password-based login/register.
- JWT bearer token generated with HMAC SHA-256. Issuer, audience, expiry, and signing-key validation are enabled. Token default lifetime is 60 minutes unless configured; claims include subject, email, user ID/name, token ID/version, and Identity role claims.
- Frontend API client sends Bearer authorization and manages token state; inspect frontend/services/apiClient.ts and AuthContext.tsx for exact storage/refresh/logout behavior before porting.
- Optional external identity-provider callback in AuthService; it depends on configured provider endpoint, client ID/secret and callback settings. Local provider credentials were blank in prior local configuration; no external sign-in runtime was verified. Callback URL is consumed by the Next.js sign-in callback route and is contract-sensitive.
- Anonymous registration and development admin bootstrap exist. Ensure bootstrapping is restricted to Development or a one-time protected process before any production exposure.

## Existing authorization

Permission keys: users.read, users.manage, brands.manage, redirects.manage, themes.read/manage/delete, media.read/manage, roles.read/manage. Seeded roles: admin, content_team, engineer. RBAC assignments support organization or brand scope. PermissionResolver computes effective permission sets for both scopes. PermissionAuthorizationHandler extracts a route value named `brandId` and passes it to the resolver.

Important limitation: a route key named `id`, a brand ID in a query string/body, or a related object’s BrandId is not automatically passed to the handler. Controllers using only `[Authorize]` require a valid identity but not a product permission. Page create/update/publish/delete use this pattern; publish has no distinct policy. Role UI navigation and backend policy enforcement must be treated separately.

## Java port requirements

- Implement a Spring Security authentication converter/filter that validates the existing JWT algorithm, key bytes, issuer, audience, clock skew, expiration, token-version claim and claim names. Keep Authorization: Bearer behavior and JSON field names unchanged.
- Determine password hash compatibility. Do not store plaintext, accept weaker hashes, or silently reset passwords. Add compatibility vectors from sanitized test accounts.
- Port identity/permission claims without overloading Identity role strings as fine-grained permission keys. Preserve authorization policy semantics, then fix identified weaknesses with explicit approval and test coverage.
- Resolve target brand from server-side resource records, not only the client’s brandId. Enforce organization grant or specific brand grant for every read/write. Return non-disclosing 404 or 403 consistently.
- Add tests for cross-brand direct ID access, query manipulation, page revision access, media file visibility, template/theme/layout/settings/redirect access, publishing, assignment writes and anonymous paths.
- Protect open registration/bootstrap operations; configure CORS to the actual frontend origins; evaluate CSRF based on whether browser auth remains bearer-only or gains cookies.
- Preserve proxy allow-host/base URL and credential redaction controls; test SSRF bypasses, redirects, DNS/IP ranges, timeouts and header forwarding.
- Validate uploads by bytes/content sniffing as well as declared type; retain size limits; guard decompression bombs and malicious image files.
- Do not log tokens, passwords, provider codes, secrets or full sensitive request bodies.

## Route authorization baseline

See API_COMPATIBILITY.md for each action’s observed state. Most endpoints are anonymous, authenticated, or governed by a named permission policy. Do not infer a tenant requirement from the route alone. A migration must preserve existing public behavior and separately highlight security fixes that alter status/body behavior.

## Required security gate before cutover

All protected API tests pass against Java. A matrix tests organization and brand roles for every route. Cross-tenant access tests prove read/update/delete/publish/preview/file denial. Public page, sitemap, widget metadata and asset exposure are explicitly reviewed. The security reviewer approves any changed auth behavior, token lifetime, callback path, CORS rule, or bootstrap control.
