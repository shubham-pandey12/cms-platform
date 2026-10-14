import type { ListUser } from '@/types/cms';
import { apiClient } from '../apiClient';

export async function getUsers(): Promise<ListUser[]> {
  try {
    const response = await apiClient.getUsers();
    return response.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      brandIds: u.brandIds ?? [],
      createdAt: u.createdAt,
    }));
  } catch (error) {
    console.error('Failed to get users:', error);
    throw error;
  }
}

export async function getUser(id: string): Promise<ListUser | undefined> {
  try {
    const response = await apiClient.getUser(id);
    return {
      id: response.id,
      email: response.email,
      name: response.name,
      role: response.role,
      brandIds: response.brandIds ?? [],
      createdAt: response.createdAt,
    };
  } catch (error) {
    console.error('Failed to get user:', error);
    return undefined;
  }
}

export async function updateUser(
  id: string,
  data: { name?: string | null; role: string; brandIds?: string[] | null }
): Promise<ListUser> {
  const response = await apiClient.updateUser(id, data);
  return {
    id: response.id,
    email: response.email,
    name: response.name,
    role: response.role,
    brandIds: response.brandIds ?? [],
    createdAt: response.createdAt,
  };
}

export async function getUserAssignments(userId: string) {
  return apiClient.getUserAssignments(userId);
}

export async function updateUserAssignments(
  userId: string,
  assignments: Array<{
    roleDefinitionId: string;
    scopeType: 'organization' | 'brand';
    scopeId?: string | null;
  }>
) {
  return apiClient.updateUserAssignments(userId, assignments);
}
