import type { User } from '@/types/cms';
import type { LoginResponseDto } from '@/types/cms';
import { apiClient } from '../apiClient';

export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const response = (await apiClient.login(email, password)) as LoginResponseDto;
    apiClient.setToken(response.token);
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role as User['role'],
      brandIds: response.user.brandIds,
      createdAt: new Date(),
      effectivePermissions: response.user.effectivePermissions ?? undefined,
    };
    return { user, token: response.token };
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; token: string } | null> {
  try {
    const response = await apiClient.register(email, password, name);
    apiClient.setToken(response.token);
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role as User['role'],
      brandIds: response.user.brandIds,
      createdAt: new Date(),
      effectivePermissions: response.user.effectivePermissions ?? undefined,
    };
    return { user, token: response.token };
  } catch (error) {
    console.error('Registration failed:', error);
    return null;
  }
}

export async function getCurrentUser(options?: { token: string }): Promise<User | null> {
  try {
    const response =
      options?.token !== undefined
        ? await apiClient.getCurrentUser(options.token)
        : await apiClient.getCurrentUser();
    return {
      id: response.id,
      email: response.email,
      name: response.name,
      role: response.role as User['role'],
      brandIds: response.brandIds,
      createdAt: new Date(),
      effectivePermissions: response.effectivePermissions ?? undefined,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export function logout(): void {
  apiClient.setToken(null);
}

export function setAuthToken(token: string | null): void {
  apiClient.setToken(token);
}
