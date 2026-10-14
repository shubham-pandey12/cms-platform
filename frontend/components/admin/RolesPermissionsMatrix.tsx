'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RbacRoleDefinition } from '@/types/cms';

interface RolesPermissionsMatrixProps {
  selectedRole: string | null;
  onSelectRole: (role: string) => void;
  roles: RbacRoleDefinition[];
}

function MatrixLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
      <Badge variant="outline" className="rounded-md border-[#d2e3fc] bg-[#e8f0fe] text-[#174ea6]">
        Org level
      </Badge>
      <span>Permissions marked as org level apply across all brands.</span>
    </div>
  );
}

function RoleMetaCard({ role }: { role: RbacRoleDefinition | undefined }) {
  if (!role) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-[#5f6368]">
        Select a role in the matrix to view details.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#202124]">{role.name}</h3>
          <p className="mt-1 text-sm text-[#5f6368]">{role.description || 'No description.'}</p>
        </div>
        <Badge variant="secondary" className="rounded-md bg-[#f1f3f4] text-[#3c4043]">
          {role.key}
        </Badge>
      </div>
    </div>
  );
}

export function RolesPermissionsMatrix({ selectedRole, onSelectRole, roles }: RolesPermissionsMatrixProps) {
  const permissionKeys = Array.from(
    new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.key)))
  );
  const permissionByKey = new Map(
    roles
      .flatMap((role) => role.permissions)
      .map((permission) => [permission.key, permission])
  );
  const selected = roles.find((row) => row.key === selectedRole) ?? roles[0];

  return (
    <div className="space-y-4">
      <MatrixLegend />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 z-20 bg-[#f8f9fa] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5f6368]">
                Role
              </th>
              {permissionKeys.map((permissionKey) => {
                const permission = permissionByKey.get(permissionKey);
                if (!permission) return null;
                return (
                <th
                  key={permission.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5f6368]"
                >
                  <div className="flex items-center gap-2">
                    <span>{permission.name}</span>
                    {permission.isOrganizationLevel ? (
                      <Badge variant="outline" className="rounded-md border-[#d2e3fc] bg-[#e8f0fe] text-[#174ea6]">
                        Org
                      </Badge>
                    ) : null}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {roles.map((row) => {
              const isActive = row.key === selected?.key;
              const assignedPermissionKeys = new Set(row.permissions.map((permission) => permission.key));
              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 ${isActive ? 'bg-[#f8fbff]' : 'hover:bg-[#f8f9fa]'}`}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectRole(row.key)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-sm font-medium text-[#202124]">{row.name}</span>
                      <span className="text-xs text-[#5f6368]">{row.key}</span>
                    </button>
                  </td>
                  {permissionKeys.map((permissionKey) => {
                    const permission = permissionByKey.get(permissionKey);
                    if (!permission) return null;
                    const enabled = assignedPermissionKeys.has(permissionKey);
                    return (
                    <td key={permissionKey} className="px-4 py-3">
                      {enabled ? (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f0fe] text-[#174ea6]"
                          aria-label={`${row.name} can ${permission.name}`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400"
                          aria-label={`${row.name} cannot ${permission.name}`}
                        >
                          -
                        </span>
                      )}
                    </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <RoleMetaCard role={selected} />
    </div>
  );
}
