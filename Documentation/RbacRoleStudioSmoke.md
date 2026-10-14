# RBAC Role Studio and assignments — smoke checklist

Use after deploying RBAC migrations and seed data. Policies align with `PolicyCatalog` / `PermissionCatalog` in the backend.

## Policy requirements

- **Role Studio** (`/roles`): caller needs organization-level `roles.manage` (policy `RolesManage`), or legacy Identity **Admin** for UI gating.
- **List / read roles**: `roles.read` (or equivalent policy used on `GET /api/roles`).
- **Assignments** (`GET`/`PUT /api/users/{id}/assignments`): `users.read` / `users.manage` respectively.
- **Caller scope on assignment writes**: organization rows require org-level `users.manage`; each brand-scoped row requires `users.manage` for that brand (or org-wide grant per `IPermissionResolver`).

## Manual smoke

1. **Role catalog**: `GET /api/roles/permissions` returns permission keys; Role Studio loads without errors.
2. **Create custom role**: create a role with a unique key; confirm it appears with a **custom** (non-system) badge and `DELETE` is available.
3. **Edit system admin permissions**: attempt to remove `users.manage` or `roles.manage` from the **admin** role; API should reject with a clear error; UI shows failure toast.
4. **Delete custom role with assignments**: assign the custom role to a user (Access tab), then delete the role; expect **409** (or documented conflict) from API.
5. **Delete custom role without assignments**: delete succeeds.
6. **User Access tab**: open **Edit user** → **Access**; load rows; add brand-scoped row, pick brand and role; **Save access**; reload dialog and confirm rows persist.
7. **Assignment 403**: sign in as a user who has `users.manage` only on brand A; attempt to assign a role scoped to brand B; expect **403** with detail message.
8. **Profile vs Access**: from **Profile**, save a primary role change; confirm server replaces org assignment (hint shown in UI). Re-open **Access** and confirm rows match expectations.

## Automated checks (local)

- `dotnet test Cms.slnx -c Release` from repository root.
- `npm run test` and `npm run build` in `frontend/`.
