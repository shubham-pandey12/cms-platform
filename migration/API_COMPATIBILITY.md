# API compatibility inventory

## Counting and conventions

There are 79 action methods across 19 ASP.NET API controllers. The route table below enumerates each controller action. Controller-token routes are written in lowercase canonical form because ASP.NET routing is case-insensitive and the current frontend API client uses lowercase paths. Preserve methods, query/body shapes, JSON response schemas, status/error behavior and auth requirements. Constraints such as `{id:guid}` are simplified to `{id}` in the table.

The application JSON serializer uses camelCase property names, case-insensitive request binding, omits null response properties, and serializes enums as camelCase strings. DateTimes are UTC values serialized using System.Text.Json’s ISO format. See backend/src/Cms.Api/Program.cs. DTO names below refer to backend/src/Cms.Application/DTOs. Success status is typical controller behavior; capture actual HTTP responses in Phase 1 because CreatedAtAction, NoContent, content types and middleware errors vary.

`Authenticated` means valid JWT, not a named permission. Policies are mapped through the current permission catalog. Tenant scope is only observed where the route key `brandId` reaches the permission handler; underlying resource ownership checks must still be verified. `Public` indicates `[AllowAnonymous]` or controller with no auth attribute.

## Endpoint mapping

| Method and path | Current auth | Tenant/resource condition | Request | Response / current behavior | Frontend consumer |
|---|---|---|---|---|---|
| GET /api/audit-logs | Authenticated | Query entityId/entityType; user scope not evident in controller | Query entityId?, entityType?, limit=50, offset=0 | List<AuditLogDto> | getAuditLogs; AuditLogPanel |
| POST /api/auth/login | Public | None | LoginRequest {email,password} | AuthResponse; success 200 | login; AuthContext |
| POST /api/auth/register | Public | Registration policy/config must be reviewed | RegisterRequest {email,password,name} | AuthResponse; success 200 | register client method; registration UI is not a confirmed route |
| POST /api/auth/{external-provider-callback} | Public | Provider config and callback validation | Provider authorization code + redirect URI DTO; legacy path name deliberately not reproduced in this generic blueprint | AuthResponse; frontend callback consumes provider flow; preserve actual path until coordinated deprecation | frontend/app/signin-callback/route.ts; callback API method |
| GET /api/auth/me | Authenticated | Current caller | Bearer token | UserDto | getCurrentUser; AuthContext/serverSession |
| GET /api/auth/ping-external | Public | External provider availability/config | None | object/provider ping result | No standard UI caller found |
| GET /api/brands | brands.manage | Organization-level | None | List<BrandDto> | getBrands; brand directory/user dialogs |
| GET /api/brands/check-availability | brands.manage | Organization-level | Query domain?, subdomain?, excludeBrandId? | BrandAvailabilityResponse | checkBrandAvailability; brand form |
| GET /api/brands/by-host | Public | host query/forwarded request host | Query host? | BrandDto or not-found | getBrandByHost; published rendering |
| GET /api/brands/{brandIdOrSlug}/sitemap.xml | Public | Brand selected by ID/slug | Path brandIdOrSlug | XML sitemap | Next sitemap route |
| GET /api/brands/{idOrSlug} | Public | Brand selected by ID/slug | Path idOrSlug | BrandDto | getBrandById/getBrandBySlug; preview |
| POST /api/brands | brands.manage | Organization-level | CreateBrandRequest: name/domain, subdomain/logo/colors/CSS/fonts, optional theme/site defaults | BrandDto; CreatedAtAction | createBrand; brand form |
| PUT /api/brands/{id} | brands.manage | Brand ID from route; org-level policy | UpdateBrandRequest with optional name/domain/subdomain/logo/colors/CSS/fonts | BrandDto | updateBrand; brand form |
| DELETE /api/brands/{id} | brands.manage | Brand ID from route; org-level policy | Path id | NoContent | deleteBrand |
| GET /api/brands/{id}/domains | brands.manage | Brand ID from route; org-level policy | Path id | List<string> | getBrandDomains |
| POST /api/brands/{id}/domains | brands.manage | Brand ID from route; org-level policy | AddBrandDomainRequest {domain} | IActionResult (inspect exact status) | addBrandDomain |
| DELETE /api/brands/{id}/domains/{domain} | brands.manage | Brand ID from route; org-level policy | Path id/domain | IActionResult (inspect exact status) | removeBrandDomain |
| GET /api/brands/{brandId}/redirects/resolve | Public | Route brandId and query path? | Query path? | RedirectResolveDto or not-found | redirectRuntime / published-site route handling |
| GET /api/brands/{brandId}/redirects | redirects.manage | Brand scope via route value | Path brandId | IReadOnlyList<RedirectDto> | getRedirects; redirects screen |
| POST /api/brands/{brandId}/redirects | redirects.manage | Brand scope via route value | CreateRedirectRequest {from,to,status} | RedirectDto | createRedirect |
| GET /api/brands/{brandId}/redirects/{id} | redirects.manage | Route brand + redirect ID; ownership must match | Path IDs | RedirectDto or not-found | getRedirect |
| PUT /api/brands/{brandId}/redirects/{id} | redirects.manage | Route brand + redirect ID; ownership must match | UpdateRedirectRequest {from?,to?,status?} | RedirectDto | updateRedirect |
| DELETE /api/brands/{brandId}/redirects/{id} | redirects.manage | Route brand + redirect ID; ownership must match | Path IDs | NoContent | deleteRedirect |
| GET /api/media | media.read | Query brandId?; current handler may see no route brandId | Query brandId? | List<MediaItemDto> | getMediaItems; MediaLibraryPanel |
| GET /api/media/{id}/file | Public | File ID; intended public visibility needs explicit review | Path id | File bytes/content type or not-found | media URL rendered by page/widgets |
| GET /api/media/{id} | media.read | Item’s actual BrandId must match caller | Path id | MediaItemDto or not-found | getMediaItem |
| POST /api/media | media.manage | Body BrandId validated in MediaService | Multipart File, BrandId, Folder?, Alt?, OutputFormat? | MediaItemDto; upload | uploadMedia; MediaUploadDialog |
| PATCH /api/media/{id} | media.manage | Item’s actual BrandId checked by service | UpdateMediaItemRequest fields (metadata) | MediaItemDto | updateMediaItem; MediaDetailsPanel |
| DELETE /api/media/{id} | media.manage | Item’s actual BrandId checked by service | Path id | NoContent | deleteMediaItem |
| GET /api/gallery/featured | Public | Generic mock data; no brand scope | Query limit=12, offset=0 | GalleryResponse {images,total,hasMore} | widgetApi / SSR widget calls |
| GET /api/destinations/featured | Public | Generic mock data; no brand scope | Query limit=8, offset=0 | DestinationsResponse | widgetApi / SSR widget calls |
| GET /api/destinations | Public | Generic mock data; no brand scope | Query featured=false, limit=10 | object/destination result | widgetApi |
| GET /api/faq/general | Public | Generic mock data; no brand scope | None | FaqResponse | widgetApi / FAQ widget |
| GET /api/packages/featured | Public | Generic mock data; no brand scope | Query limit=6 | PackagesResponse | widgetApi / package widget |
| GET /api/packages | Public | Generic mock data; no brand scope | Query limit=12 | PackagesResponse | widgetApi |
| GET /api/page-data/{pageId} | Public | Page ID; verify data config should be publicly exposed | Path pageId | PageDataResponse (variables and API calls) | getPageData; published SSR/rendering |
| GET /api/pages | Authenticated | Query brandId? is not a permission scope; enforce target access | Query brandId? | List<PageDto> | getPages; builder Pages tab |
| GET /api/pages/{id} | Authenticated | Resolve page BrandId before returning | Path id | PageDto | getPage; builder |
| GET /api/pages/{id}/revisions | Authenticated | Resolve page BrandId before returning | Path id | List<PageRevisionDto> | getPageRevisions; version history UI |
| GET /api/pages/{pageId}/revisions/{revisionId} | Authenticated | Revision must belong to page and caller’s brand | Path IDs | PageRevisionDetailDto or 404 | getPageRevision; restore/version dialog |
| GET /api/pages/by-uri | Public | Query brandIdOrSlug + uri, published content only | Query brandIdOrSlug, uri | PageDto or 404; dynamic RouteParams may be included | getPageByUri; published preview route |
| POST /api/pages | Authenticated | CreatePageRequest.BrandId must be authorized | CreatePageRequest: brandId,name,uri,isDynamic,dynamicVariables?,SEO?,layoutId,bodyContent?,themeId? | PageDto; CreatedAtAction | createPage; builder |
| PUT /api/pages/{id} | Authenticated | Page ownership must be checked | UpdatePageRequest optional name/URI/dynamic vars/SEO/body/theme/layout JSON/CSS | PageDto | updatePage; builder Save |
| POST /api/pages/{id}/publish | Authenticated | Page ownership and dedicated publish grant required; current policy missing | PublishPageRequest {version,revisionId?} | PageDto; invalid version 400 | publishPage; PublishDialog |
| DELETE /api/pages/{id} | Authenticated | Page ownership must be checked | Path id | NoContent | deletePage |
| POST /api/proxy/execute | Authenticated | Configured host/base URL allow-list; SSRF risk | ProxyRequestDto | ProxyResponseDto using upstream status | proxyExecute; API/data binding tools |
| GET /api/proxy/config | Authenticated | May reveal allowed host names/credential keys; never secrets | None | allowedHosts/baseUrls/credentialKeys object | getProxyConfig; API config dialog |
| POST /api/dev/rbac/bootstrap-admin | Public | Development-only or explicit one-time protection required | Query email | IActionResult; exact status depends on result | No normal frontend consumer |
| GET /api/roles | roles.read | Organization scope | None | List<RoleDefinitionDto> | getRoles; Role Studio/user dialogs |
| GET /api/roles/permissions | roles.read | Organization scope | None | List<PermissionDefinitionDto> | getRolePermissionsCatalog |
| POST /api/roles | roles.manage | Organization scope | CreateRoleRequest {key?,name,description?,permissionKeys?} | RoleDefinitionDto | createRole |
| PUT /api/roles/{roleId} | roles.manage | Organization scope | UpdateRoleRequest {name,description?} | RoleDefinitionDto | updateRoleMetadata |
| DELETE /api/roles/{roleId} | roles.manage | Organization scope | Path roleId | NoContent or conflict | deleteRole |
| PUT /api/roles/{roleId}/permissions | roles.manage | Organization scope | UpdateRolePermissionsRequest {permissionKeys} | RoleDefinitionDto | updateRolePermissions |
| GET /api/site-layouts | Public | Query brandId?; public fields only; tenant filter | Query brandId? | List<SiteLayoutDto> | getSiteLayouts; layout manager/published SSR |
| GET /api/site-layouts/{id} | Public | Resolve layout brand; no authenticated tenant scope currently | Path id | SiteLayoutDto | getSiteLayout |
| POST /api/site-layouts | Authenticated | Request BrandId must be authorized | CreateSiteLayoutRequest {brandId,name,header,footer,sidebar?,isDefault?} | SiteLayoutDto | createSiteLayout; LayoutManager |
| PUT /api/site-layouts/{id} | Authenticated | Resolve layout BrandId before update | UpdateSiteLayoutRequest optional fields | SiteLayoutDto | updateSiteLayout |
| DELETE /api/site-layouts/{id} | Authenticated | Resolve layout BrandId before delete | Path id | NoContent | deleteSiteLayout |
| GET /api/site-settings | Public | Query brandIdOrSlug | Query brandIdOrSlug | SiteSettingsDto | getSiteSettings; site rendering |
| PUT /api/site-settings/{id} | Authenticated | Resolve settings BrandId before update | UpdateSiteSettingsRequest; nullable site, SEO, robots, scripts and locale fields | SiteSettingsDto | updateSiteSettings; SiteSettingsDialog |
| GET /api/system/config | Public | Avoid secret-bearing config | None | SystemConfigResponse | getSystemConfig; app boot |
| GET /api/templates | Public | Query brandId?; global/brand filter | Query brandId? | List<TemplateDto> | getTemplates; builder if enabled |
| POST /api/templates | Authenticated | BrandId ownership check required | CreateTemplateRequest {name,description,brandId?,bodyContent,thumbnail?,category?} | TemplateDto | createTemplate |
| PUT /api/templates/{id} | Authenticated | Template BrandId check required | UpdateTemplateRequest optional name/description/body/thumbnail/category | TemplateDto | updateTemplate |
| GET /api/themes | Public | Query brandId?; expose intentional theme data only | Query brandId? | List<ThemeDto> | getThemes; builder Themes tab/rendering |
| GET /api/themes/{id} | Public | Resolve BrandId; public only if approved | Path id | ThemeDto | getTheme |
| POST /api/themes | themes.manage | Permission handler uses route brand only; body BrandId scope needs validation | CreateThemeRequest {name,colors,fonts,font configs?,brandId?} | ThemeDto | createTheme |
| DELETE /api/themes/{id} | themes.delete | Resource brand and permission need validation | Path id | NoContent | deleteTheme |
| GET /api/users/{userId}/assignments | users.read | Organization-level policy | Path userId | UserAssignmentsResponseDto | getUserAssignments; EditUserDialog |
| PUT /api/users/{userId}/assignments | users.manage | Request validates target scopes; brand grants must match | UpdateUserAssignmentsRequest {assignments:[roleDefinitionId,scopeType,scopeId?]} | UserAssignmentsResponseDto | updateUserAssignments |
| GET /api/users | users.read | Organization scope | None | List<ListUserDto> | getUsers; Users screen |
| GET /api/users/{id} | users.read | Organization scope | Path id | ListUserDto | getUser |
| PUT /api/users/{id} | users.manage | Organization scope | UpdateUserRequest | ListUserDto | updateUser; EditUserDialog |
| GET /api/widgets | Public | Query brandId?; enforce allowed widget availability | Query brandId? | List<WidgetDefinitionDto> | getWidgets; widget library |
| GET /api/widgets/{id} | Public | Widget visibility/brand availability | Path id | WidgetDefinitionDto | getWidgetDefinitionById |
| GET /api/widgets/{slug}/versions | Public | Slug | Path slug | List<WidgetVersionListItemDto> | getWidgetVersions; version picker |
| GET /api/widgets/{slug}/versions/{version} | Public | Slug/version | Path values | WidgetVersionDto | getWidgetVersion |
| GET /api/widgets/{slug}/versions/all | Public | Slug | Path slug | List<WidgetVersionDto> | getAllWidgetVersions |

## Non-controller HTTP routes

| Method/path | Availability | Behavior |
|---|---|---|
| GET /health | Development or HealthChecks:EnablePublicEndpoints | Readiness, includes DB check when connection configured. |
| GET /alive | Development or enabled | Liveness-only self check. |
| GET /dev/health | Development only | ASP.NET health checks. |
| GET / | Development only | Redirects to Swagger. |
| GET /api/embed/widget | Next.js frontend server route | SSR HTML fragment for supported widget; see Documentation/widget-html-embed.md. |
| GET /preview/{brandKey}/sitemap.xml | Next.js route | Fetches API sitemap and forwards XML. |

## DTO schema families

Request/response field definitions live in backend/src/Cms.Application/DTOs. DTOs needing explicit JSON contract fixtures include AuthResponse/UserDto; BrandDto and create/update requests; PageDto/PageSeoDto/PageRevision* plus CreatePageRequest/UpdatePageRequest/PublishPageRequest; WidgetDefinitionDto/WidgetVersion*; ThemeDto and nested color/font DTOs; SiteLayoutDto and create/update; SiteSettingsDto/UpdateSiteSettingsRequest; TemplateDto/create/update; MediaItemDto and multipart UploadMediaRequest; RedirectDto/create/update/resolve; RoleDefinitionDto/PermissionDefinitionDto and requests; UserAssignmentsResponseDto/UpdateUserAssignmentsRequest; PageDataResponse; AuditLogDto; and ProxyRequestDto/ProxyResponseDto.

Nested JSON stored as string properties may be serialized by the frontend as JSON text or object depending on DTO field; preserve observed frontend mapper behavior. Validate against captured traffic before implementing Jackson types.

## Contract risks

- ASP.NET action route strings are mixed-case through `[controller]`; current client uses lowercase. Keep canonical lowercase path and add case-insensitive route tests.
- Optional/null update fields have distinct semantics. C# serializer omits null response properties; request binding may represent omitted and explicit null similarly for nullable DTO properties. Capture concrete behavior.
- Enums are camelCase strings globally; Java enum names must map explicitly.
- Some controller actions return anonymous objects or raw upstream status/body, not stable named DTOs.
- API controller class-level authentication without permission policy is not equivalent to “authorized for this resource.” Preserve current contract but separately remediate with reviewed changes.
- Exact external-provider callback segment is intentionally not copied into this generic blueprint; the current client and AuthController are the source of truth and must be captured in the compatibility harness before routing changes.
