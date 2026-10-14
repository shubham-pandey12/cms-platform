import type { PageRevision } from '@/types/cms';

export async function createPageRevision(
  revision: Omit<PageRevision, 'id' | 'createdAt'>
): Promise<PageRevision | null> {
  console.debug('Create page revision:', revision);
  return null;
}

export async function updatePageRevision(
  id: string,
  updates: Partial<PageRevision>
): Promise<PageRevision | null> {
  console.debug('Update page revision:', id, updates);
  return null;
}
