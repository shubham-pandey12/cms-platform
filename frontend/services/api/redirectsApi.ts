import type { Redirect } from '@/types/cms';
import { apiClient } from '../apiClient';

function mapRedirectDto(r: {
  id: string;
  from: string;
  to: string;
  brandId: string;
  status: number;
  createdAt: string;
  updatedAt?: string | null;
}): Redirect {
  return {
    id: r.id,
    from: r.from,
    to: r.to,
    brandId: r.brandId,
    status: r.status === 302 ? 302 : 301,
    createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
  };
}

export async function getRedirects(brandId: string): Promise<Redirect[]> {
  const rows = await apiClient.getRedirects(brandId);
  return rows.map(mapRedirectDto);
}

export async function createRedirect(
  brandId: string,
  data: { from: string; to: string; status: 301 | 302 }
): Promise<Redirect> {
  const r = await apiClient.createRedirect(brandId, {
    from: data.from,
    to: data.to,
    status: data.status,
  });
  return mapRedirectDto(r);
}

export async function updateRedirect(
  brandId: string,
  id: string,
  data: { from?: string; to?: string; status?: 301 | 302 }
): Promise<Redirect> {
  const r = await apiClient.updateRedirect(brandId, id, {
    from: data.from,
    to: data.to,
    status: data.status ?? undefined,
  });
  return mapRedirectDto(r);
}

export async function deleteRedirect(brandId: string, id: string): Promise<void> {
  await apiClient.deleteRedirect(brandId, id);
}
