# User roles and permissions

## Implemented role model

The seeder defines three system roles: Admin, Content team, and Engineer. Permissions are catalog keys, not fixed C# role branches alone. Role assignments may be organization-scoped or brand-scoped (UserRoleAssignment); ApplicationUser also has BrandIds. System role defaults are seeded in backend/src/Cms.Persistence/Seeding/DatabaseSeeder.cs. Actual authorization uses JWT plus permission policies; frontend navigation visibility is not a security boundary.

| Role | Seeded permissions | Product interpretation | Limits |
|---|---|---|---|
| Admin | users.read/manage; brands.manage; redirects.manage; themes.read/manage/delete; media.read/manage; roles.read/manage | Platform/organization administrator | “Admin” is a role name, not proof all endpoints check it; page publishing and brand scoping need auditing. |
| Content team | users.read; themes.read; media.read/manage | Intended page author/editor and publisher in HLD | Seeded map omits pages/templates/publish permissions because those endpoints mainly require authentication; effective abilities may exceed this list. |
| Engineer | users.read; themes.read/manage; media.read/manage | Widget engineer and theme/media maintainer | Widget authoring is source-code workflow; no dedicated widget API write policy was found. |

The Role Studio can create custom roles and edit permission mappings (see backend/src/Cms.Api/Controllers/RolesController.cs and frontend/app/(admin)/roles/). “Reviewer” is not a seeded role. Publishing is not modeled as a distinct permission in the inspected permission catalog.

## Permission catalog

| Key family | Scope intent in seed | Typical API/UI areas |
|---|---|---|
| users.read, users.manage | Organization-level | User list/details, assignments |
| brands.manage | Organization-level | Brand CRUD/domains |
| redirects.manage | Brand-level | Brand redirect management |
| themes.read | Brand-level | Read themes |
| themes.manage, themes.delete | Seed marks organization-level | Theme create/delete |
| media.read, media.manage | Brand-level | List/read/upload/update/delete media |
| roles.read, roles.manage | Organization-level | Role definitions and permissions |

The authoritative keys and handlers are in backend/src/Cms.Application/Common/Security/PermissionCatalog.cs and PolicyCatalog.cs, plus backend/src/Cms.Api/Authorization/PermissionAuthorizationHandler.cs. A role/permission assignment grants capability, but brand object scope still needs to be checked against requested resource ID.

## Role versus capability matrix

Legend: **Seed** means present in default role mapping; **Auth** means endpoint is authenticated but no dedicated permission was identified; **Policy** means explicit permission policy; **Unclear** means inspect controller/service path before allowing as a role guarantee.

| Capability | Admin | Content team | Engineer |
|---|---|---|---|
| Manage users/assignments | Seed | Read only seed | Read only seed |
| Manage brands/domains | Seed | Unclear | Unclear |
| Edit pages | Auth; scope unclear | Auth; scope unclear | Auth; scope unclear |
| Publish pages | Auth; no publish policy identified | Auth; no publish policy identified | Auth; no publish policy identified |
| Manage templates | Auth; API permissions need tightening | Auth; API permissions need tightening | Auth; API permissions need tightening |
| Read themes | Seed | Seed | Seed |
| Create/delete themes | Seed | Not seeded | Seeded manage; delete permission absent |
| Read/manage media | Seed | Seed | Seed |
| Manage redirects | Seed | Not seeded | Not seeded |
| Read/manage roles | Seed | Not seeded | Not seeded |
| Develop widget code | Repository/deployment access, outside RBAC | No | Intended user; source/deploy access required |
| Read audit logs | Unclear: endpoint is authenticated | Unclear | Unclear |

This table describes current observed policy shape, not a recommended least-privilege final matrix.

## Tenant isolation

Brand is the tenant key. User brand assignments and scoped role assignments exist, and MediaService explicitly checks allowed brand IDs on writes. However, repository-wide global query filters are absent in CmsDbContext. Several routes take brand IDs or object IDs; do not assume they enforce assignment scope. The multi-tenant security requirement is that all reads and writes resolve the target resource’s brand on the server and compare it with organization-wide or brand-scoped permission before returning data or mutating state. URL hiding, frontend filtering, and user-supplied brandId are insufficient.

Security-sensitive checks to add/verify:

- Cross-brand object ID access for pages, page revisions, templates, themes, layouts, settings, redirects, and media metadata.
- Whether role grants are combined correctly with brand assignment scopes by PermissionAuthorizationHandler/IPermissionResolver.
- Anonymous file endpoints: ensure uploaded content is meant for public delivery and URL exposure is intentional.
- Anonymous register/bootstrap endpoints: ensure production disables or protects first-admin creation and open registration.
- Publish permission and role UI gating must match the API.

## Proposed least-privilege baseline

- Platform administrator: organization-wide user, brand, role, and platform configuration operations.
- Brand administrator: manage one or more assigned brands, members, themes/settings/layouts; publish only if explicitly granted.
- Content editor: edit drafts and view preview for assigned brands; no user/role administration.
- Publisher/reviewer: approve/publish for assigned brands, if an approval workflow is adopted. This role is a proposal, not current behavior.
- Widget engineer: author widgets via reviewed repository/deployment workflow; editor/API access should be separately assigned.

Every proposed role remains subject to server-side object-scope enforcement and audit logging.
