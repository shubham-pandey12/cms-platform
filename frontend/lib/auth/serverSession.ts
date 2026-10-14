import 'server-only';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/services/cmsApiService';
import type { User } from '@/types/cms';

export type ServerSession = { user: User | null; token: string | null };

export async function getServerSession(): Promise<ServerSession> {
  const token = (await cookies()).get('auth_token')?.value ?? null;
  if (!token) return { user: null, token: null };
  try {
    const user = await getCurrentUser({ token });
    if (!user) return { user: null, token: null };
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}
