# Requirements traceability

## Status definitions

- **Implemented and verified:** source behavior and a focused existing test or successful local verification supports it.
- **Implemented but not fully verified:** relevant code exists, but end-to-end behavior/security/configuration is not proven.
- **Partially implemented:** some pieces exist; important workflow or safeguards are absent.
- **Documented but missing:** documentation promises it; no supporting implementation was found.
- **Not documented or unclear:** evidence is insufficient to define expected behavior.
- **Blocked by configuration/dependencies:** code exists but required provider/configuration/data is absent.

## Matrix

| Requirement | Status | Evidence and notes |
|---|---|---|
| Brand CRUD and domains | Implemented but not fully verified | BrandsController, BrandService, Brand/BrandDomain entities, brand dialogs; tenant policy coverage remains risk. |
| Brand themes and styling | Implemented but not fully verified | ThemeService/Theme entity, brand colors/CSS, Theme APIs and editor tabs. |
| Page create/edit/list | Implemented and verified | PagesController, PageService, PageRepository, BuilderPage; API tests in backend/tests/Cms.Api.Tests/Controllers/PagesControllerTests.cs. |
| Drag/drop widget composition | Implemented but not fully verified | GoogleSitesCanvas, BuilderCanvas, SortableWidget, page builder state; full browser workflow not verified here. |
| Schema-driven widget inspector | Implemented and verified | PropertiesPanel and field renderers; focused frontend tests exist under frontend/components/builder/properties/__tests__. |
| Widget definition discovery | Implemented but not fully verified | WidgetDefinitionDiscovery, DatabaseSeeder, widgets/**/Definition.cs and customRenderers registry. Deployment/upsert compatibility needs integration verification. |
| Widget versions | Partially implemented | DefinitionVersion fields/APIs exist; rich migration/history experience is roadmap/unclear. |
| Page data/API bindings | Implemented but not fully verified | PageDataConfig entity/controller/service, DataBindingEditor, ApiConfigDialog, transformations; real external service coverage unknown. |
| Preview/published SSR | Implemented but not fully verified | frontend/app/preview route, PublishedPageRenderer, PageService published lookup, optional widget SSR endpoints. Error/fallback matrix needs verification. |
| Draft/published revisions | Partially implemented | PageRevision entity, PageService.PublishAsync, revision endpoints and dialogs. Draft pointer/autosave/concurrency/transaction semantics incomplete or unverified. |
| Publish permission | Documented/unclear and security-sensitive | PagesController class [Authorize]; no explicit publish permission policy found. Default seeded role mapping lacks a publish key. |
| Rollback | Partially implemented | Publish request can select an existing revision; no distinct rollback audit/UX guarantee. |
| Templates | Partially implemented | Template entity/service/controller supports list/create/update; template versioning/delete/UI instantiation semantics absent or unclear. |
| Media library/upload | Implemented but not fully verified | MediaItemsController, MediaService, media components; DB byte storage, optional WebP; blob mode future. |
| Media brand isolation | Partially implemented | MediaService write checks brand access; confirm list/get/file endpoint policy and ID access independently. |
| Static/dynamic routing | Implemented but not fully verified | DynamicUrlPages.md, PageRepository matching, PageService; route edge cases/tests exist. |
| SEO metadata | Implemented but not fully verified | PageSeo value object, PageSeoPanel, published renderer and sitemap. Verify emitted metadata and canonical behavior. |
| Sitemap | Implemented but not fully verified | BrandsController sitemap route/PageService sitemap; static/noindex behavior documented. |
| robots.txt and structured data | Partially implemented / unclear | robots text in SiteSettings; route serving and editor flow not established. Structured data not found. |
| Redirect management | Implemented but not fully verified | Redirect entity/service/controller/UI, redirect tests. Loop validation exists in application tests; cross-brand authorization still needs proof. |
| Authentication | Implemented and verified (focused) | AuthService, AuthController, Identity/JWT and auth controller tests; optional provider blocked by config. |
| RBAC role/assignment studio | Implemented but not fully verified | RoleDefinition/PermissionDefinition/UserRoleAssignment, RolesController, UsersController, UI, smoke doc and tests. |
| Tenant isolation across all resources | Partially implemented; high risk | Scoped assignments and some explicit media checks; no global query filters and endpoint coverage inconsistent. |
| Audit logs | Partially implemented | AuditLog entity/service/controller/panel; completeness of emitted events is unverified. |
| Approval workflow | Documented as future/proposed | HLD lists workflow approvals as potential enhancement; no workflow state/approval entity found. |
| Concurrent editing/conflict detection | Documented roadmap / missing | No concurrency token or compare-and-swap path found on Page. |
| Template screen | Not documented or unclear | Template API exists, no dedicated App Router path; builder template path needs verification. |
| Full internationalization | Partially implemented | Widget localizedText/site supported language codes and Documentation/I18n.md; admin/route-level i18n not established. |
| CDN/Redis/distributed cache | Documented but missing | HLD lists future/planned; no active Redis integration found. |
| Production provider sign-in | Blocked by configuration/dependencies | Provider code and routes exist; local credentials were blank in prior check; config required. |
| Docker/Compose and Aspire | Implemented but not fully verified | docker-compose.yaml, Dockerfiles, AppHost; AppHost frontend registration commented out. |
| Accessibility conventions | Documented and partial | Documentation/Semantic.md, SkipLinks and labels in UI; no full automated accessibility audit. |

## Verification boundary

Earlier local verification for this workspace (before this documentation-only task) reported successful frontend build and 137/137 frontend tests, API build, and 137/137 API tests. Application test project had 6 failures out of 113, in redirect validation/loop-related tests. Treat this as a prior snapshot, not a fresh run for this blueprint. No production deployment test is claimed. This task adds documentation only and does not change application behavior.
