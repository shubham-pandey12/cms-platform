# Gaps and roadmap

Priorities are based on user impact and security, not on a committed delivery plan.

## P0 — Resolve before treating as a secure multi-tenant production CMS

1. **Consistent tenant authorization.** Several APIs load by object ID or accept brandId; there is no DbContext global filter. Apply shared server-side resource authorization to every read/write, and test same-role cross-brand access through direct API requests.
2. **Publish authorization.** Add/verify an explicit publish capability enforced by API and UI; current PagesController is authenticated but has no policy-specific publish attribute.
3. **Anonymous endpoint review.** Assess open registration, RBAC bootstrap, public page data/layout/theme/file routes, proxy config, CORS, and token/external callback behavior for production. Keep intentional public rendering minimal.
4. **Publication integrity.** Verify transaction and prior published pointer behavior under revision persistence failure; add invariant tests before relying on safe releases.

## P1 — Protect authoring workflow and content integrity

1. Add optimistic concurrency (row version/ETag) for Page and surface conflict resolution.
2. Formalize server-side validation for URI uniqueness, widget schema, data bindings, SEO and required page metadata.
3. Complete and document draft versus published snapshot semantics; ensure edits never mutate public output before publish.
4. Verify template-to-page deep-copy flow; add template versioning only if product needs migration/propagation.
5. Review failure boundaries and renderer isolation so one failed widget/API does not destroy the whole page.
6. Expand audit logging to security-sensitive writes and publish/restore events, with actor, scope, result, and correlation IDs.

## P2 — Improve product completeness

- Decide whether template library, version history, audit viewer, and route management are first-class screens or embedded builder modules.
- Add a clear access-denied page, consistent loading/empty/error states, and responsive admin validation.
- Verify and test SEO output, canonical URLs, robots route, sitemap, Open Graph, semantic HTML and structured-data scope.
- Add admin language localization and route-level i18n only if needed; widget-level localization already exists.
- Evaluate object storage/image processing and CDN/cache only after defining retention, invalidation and cost needs.

## P3 — Roadmap candidates from current HLD

HLD lists collaboration/co-editing, A/B tests, analytics, Redis/CDN, backups, content scheduling, approval workflows, AI content help, and more complete widget-version tooling as future/potential capabilities. These should remain roadmap candidates until owners define target user, constraints, acceptance criteria, and operational needs.

## Documentation/code inconsistencies

- HLD stack says Next.js 14 and Node 18; current package.json says Next.js 15 and Node >=22.
- README describes Aspire as recommended; AppHost starts the database and API while frontend registration is commented out.
- HLD describes broad role capabilities, but the seeded permission mapping and endpoint attributes do not consistently enforce those descriptions.
- HLD lists templates in builder and media/version features; API/entity evidence does not prove complete user workflows.
- Product task referenced use-case/HLD file names that are absent; current HLD is generic and prior use-case docs are missing.

## Suggested next development order

1. Security audit + cross-tenant authorization tests.
2. Publish permission and publication integrity tests.
3. Draft concurrency and save-state clarity.
4. Validate complete page/preview/publish journey in browser.
5. Decide template/history/audit screen scope.
6. Align HLD/README/docs with tested behavior and deployment config.
