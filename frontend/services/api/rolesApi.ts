import type { RbacPermission, RbacRoleDefinition } from '@/types/cms';
import { apiClient } from '../apiClient';

export async function getRoles(): Promise<RbacRoleDefinition[]> {
  return apiClient.getRoles();
}

export async function getRolePermissionsCatalog(): Promise<RbacPermission[]> {
  return apiClient.getRolePermissionsCatalog();
}

export async function createRole(data: {
  key?: string | null;
  name: string;
  description?: string | null;
  permissionKeys?: string[] | null;
}): Promise<RbacRoleDefinition> {
  return apiClient.createRole(data);
}

export async function updateRoleMetadata(
  roleId: string,
  data: { name: string; description?: string | null }
): Promise<RbacRoleDefinition> {
  return apiClient.updateRoleMetadata(roleId, data);
}

export async function deleteRole(roleId: string): Promise<void> {
  return apiClient.deleteRole(roleId);
}

export async function updateRolePermissions(
  roleId: string,
  permissionKeys: string[]
): Promise<RbacRoleDefinition> {
  return apiClient.updateRolePermissions(roleId, permissionKeys);
}
