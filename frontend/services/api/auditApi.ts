import type { AuditLog } from '@/types/cms';
import { apiClient } from '../apiClient';

export async function addAuditLog(
  userId: string,
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: Record<string, unknown>
): Promise<void> {
  console.debug('Audit log:', { userId, action, entityType, entityId, details });
}

export async function getAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  userId?: string;
}): Promise<AuditLog[]> {
  try {
    const response = await apiClient.getAuditLogs(filters);
    return (response || []).map((log) => ({
      ...log,
      entityType: log.entityType as AuditLog['entityType'],
      createdAt: new Date(log.createdAt),
    }));
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

export async function getUserById(_id: string): Promise<{ name?: string } | undefined> {
  return undefined;
}
