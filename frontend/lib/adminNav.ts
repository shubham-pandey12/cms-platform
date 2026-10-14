import {
  ImageIcon,
  Layers,
  Shield,
  Users,
} from 'lucide-react';
import type { User } from '@/types/cms';
import { userHasOrganizationPermission, USERS_MANAGE, userCanManageRoles } from '@/lib/rbacPermissions';

export interface NavItem {
  label: string;
  href: string;
  /** When set, the item is active when href + search matches this param key=value */
  tabParam?: { key: string; value: string };
  icon: React.ElementType;
  /** Returns true when the current user may see this item */
  visible: (user: User | null) => boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Brands',
        href: '/brands',
        icon: Layers,
        visible: () => true,
      },
      {
        label: 'Media',
        href: '/media',
        icon: ImageIcon,
        visible: () => true,
      },
    ],
  },
  {
    label: 'People & access',
    items: [
      {
        label: 'Users',
        href: '/users',
        icon: Users,
        visible: (user) => userHasOrganizationPermission(user, USERS_MANAGE),
      },
      {
        label: 'Roles & permissions',
        href: '/users',
        tabParam: { key: 'tab', value: 'roles' },
        icon: Shield,
        visible: (user) => userHasOrganizationPermission(user, USERS_MANAGE),
      },
      {
        label: 'Role definitions',
        href: '/roles',
        icon: Shield,
        visible: (user) => userCanManageRoles(user),
      },
    ],
  },
];

/**
 * Returns true when the nav item matches the current pathname + search params.
 * For items with a tabParam, the pathname must match AND the tab param must match.
 * For items without tabParam, the pathname must match AND no conflicting tab param must be set.
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  const pathMatches = pathname === item.href;
  if (!pathMatches) return false;

  if (item.tabParam) {
    return searchParams.get(item.tabParam.key) === item.tabParam.value;
  }

  // A plain /users item should not be active when ?tab=roles is set
  const hasAnyTabParam = item.href === '/users' && searchParams.has('tab');
  return !hasAnyTabParam;
}
