import type { User } from '@/types/cms';

/** Permission key aligned with backend PermissionCatalog.RolesManage */
export const ROLES_MANAGE = 'roles.manage';

/** Permission key aligned with backend PermissionCatalog.UsersRead */
export const USERS_READ = 'users.read';

/** Permission key aligned with backend PermissionCatalog.UsersManage */
export const USERS_MANAGE = 'users.manage';

function normalizeRole(role: string | undefined): string {
  return String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

/**
 * True if the user has a permission at organization scope (from auth snapshot) or legacy Admin role.
 */
export function userHasOrganizationPermission(user: User | null, permissionKey: string): boolean {
  if (!user) return false;
  const keys = user.effectivePermissions?.organizationPermissionKeys;
  if (keys?.some((k) => k.toLowerCase() === permissionKey.toLowerCase())) {
    return true;
  }
  if (normalizeRole(user.role) === 'admin') {
    return true;
  }
  return false;
}

export function userCanManageRoles(user: User | null): boolean {
  return userHasOrganizationPermission(user, ROLES_MANAGE);
}
