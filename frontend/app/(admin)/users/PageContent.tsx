'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userHasOrganizationPermission, USERS_MANAGE } from '@/lib/rbacPermissions';
import { getUsers, getBrands, getRoles as getRbacRoles } from '@/services/cmsApiService';
import type { ListUser } from '@/types/cms';
import type { Brand, RbacRoleDefinition } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RolesPermissionsMatrix } from '@/components/admin/RolesPermissionsMatrix';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { getRoleDisplayLabel, normalizeRole } from '@/lib/roleCapabilities';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';

function formatRole(role: string): string {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return copy.users.roleAdmin;
  if (normalized === 'contentteam') return copy.users.roleContentTeam;
  if (normalized === 'engineer') return copy.users.roleEngineer;
  return getRoleDisplayLabel(role);
}

function formatDate(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return createdAt;
  }
}

function UserCapabilityMatrix({
  role,
  roles,
}: {
  role: string;
  roles: RbacRoleDefinition[];
}) {
  const permissionKeys = Array.from(
    new Set(roles.flatMap((candidate) => candidate.permissions.map((p) => p.key)))
  );
  const roleDefinition = roles.find(
    (candidate) => normalizeRole(candidate.name) === normalizeRole(role)
  );
  const enabledPermissions = new Set(
    roleDefinition?.permissions.map((permission) => permission.key) ?? []
  );
  const permissionLabelByKey = new Map(
    roles.flatMap((candidate) =>
      candidate.permissions.map((permission) => [permission.key, permission.name] as const)
    )
  );

  return (
    <div className="flex items-center gap-1.5" aria-label={`Permission matrix for ${formatRole(role)}`}>
      {permissionKeys.map((permissionKey) => {
        const enabled = enabledPermissions.has(permissionKey);
        const label = permissionLabelByKey.get(permissionKey) ?? permissionKey;
        return (
          <span
            key={permissionKey}
            title={label}
            aria-label={`${label}: ${enabled ? 'allowed' : 'not allowed'}`}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
              enabled ? 'bg-[#e8f0fe] text-[#174ea6]' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {enabled ? '✓' : '–'}
          </span>
        );
      })}
    </div>
  );
}

function UsersPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<ListUser[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [rbacRoles, setRbacRoles] = useState<RbacRoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ListUser | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'contentteam' | 'engineer'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('Admin');

  const isAdmin = userHasOrganizationPermission(user, USERS_MANAGE);

  // Determine active tab from URL search params
  const activeTab = searchParams.get('tab') === 'roles' ? 'roles' : 'directory';

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      router.replace('/brands');
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [userList, brandList, roleList] = await Promise.all([
          getUsers(),
          getBrands(),
          getRbacRoles(),
        ]);
        setUsers(userList);
        setBrands(brandList);
        setRbacRoles(roleList.map((r) => ({ ...r, isSystem: r.isSystem ?? false })));
        if (roleList.length > 0) {
          setSelectedRole(roleList[0].key);
        }
      } catch (error) {
        console.error('Failed to load users or brands:', error);
        toast.error(copy.users.toast.loadFailed);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, isAdmin]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 220);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const handleEditClick = (u: ListUser) => {
    setUserToEdit(u);
    setEditDialogOpen(true);
  };

  const handleUserUpdated = (updated: ListUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setUserToEdit(updated);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((candidate) => {
      const roleMatches = roleFilter === 'all' || normalizeRole(candidate.role) === roleFilter;
      if (!roleMatches) return false;
      if (!searchQuery) return true;
      const haystack =
        `${candidate.email} ${candidate.name ?? ''} ${formatRole(candidate.role)}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [users, roleFilter, searchQuery]);

  const pageTitle = activeTab === 'roles' ? copy.users.rolesPermissionsTab : copy.users.title;
  const pageDescription =
    activeTab === 'roles'
      ? 'This matrix is sourced from RBAC APIs and reflects live role-permission mappings.'
      : copy.users.description;

  return (
    <AdminShell requirePermission={(u) => userHasOrganizationPermission(u, USERS_MANAGE)}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
          </div>
        ) : activeTab === 'directory' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6368]" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search users by name, email, or role"
                    className="h-10 border-gray-200 bg-white pl-10"
                    aria-label="Search users"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as 'all' | 'admin' | 'contentteam' | 'engineer')
                  }
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-[#202124]"
                  aria-label="Filter by role"
                >
                  <option value="all">All roles</option>
                  <option value="admin">{copy.users.roleAdmin}</option>
                  <option value="contentteam">{copy.users.roleContentTeam}</option>
                  <option value="engineer">{copy.users.roleEngineer}</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#f8f9fa]">
                  <TableRow className="border-gray-200 hover:bg-transparent">
                    <TableHead className="font-medium text-[#5f6368]">{copy.users.email}</TableHead>
                    <TableHead className="font-medium text-[#5f6368]">{copy.users.name}</TableHead>
                    <TableHead className="font-medium text-[#5f6368]">{copy.users.role}</TableHead>
                    <TableHead className="font-medium text-[#5f6368]">Permission matrix</TableHead>
                    <TableHead className="font-medium text-[#5f6368]">{copy.users.brandAccess}</TableHead>
                    <TableHead className="font-medium text-[#5f6368]">{copy.users.createdAt}</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-[#5f6368]">
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-gray-200 hover:bg-[#f8f9fa]">
                      <TableCell className="font-medium text-[#202124]">{u.email}</TableCell>
                      <TableCell className="text-[#202124]">{u.name || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-md bg-[#eef3fd] text-[#174ea6]"
                        >
                          {formatRole(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#202124]">
                        <UserCapabilityMatrix role={u.role} roles={rbacRoles} />
                      </TableCell>
                      <TableCell className="text-[#202124]">
                        {u.brandIds?.length ? (
                          <Badge variant="outline" className="rounded-md border-gray-300">
                            {formatCopy(copy.users.brandCount, { count: u.brandIds.length })}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-[#5f6368]">{formatDate(u.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#5f6368] hover:bg-gray-100 hover:text-[#202124]"
                          onClick={() => handleEditClick(u)}
                          aria-label={formatCopy('Edit {{name}}', { name: u.email })}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <RolesPermissionsMatrix
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              roles={rbacRoles}
            />
          </div>
        )}
      </div>

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={userToEdit}
        brands={brands}
        roles={rbacRoles}
        onUserUpdated={handleUserUpdated}
      />
    </AdminShell>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
