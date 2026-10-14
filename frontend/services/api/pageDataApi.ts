import type { ApiCall, PageData, PageVariable } from '@/types/cms';
import { apiClient, publicApiClient } from '../apiClient';
import { getStoredRouteParams } from '../mappers/pageMapper';

export async function getPageData(
  pageId: string,
  extraVariables: PageVariable[] = [],
  usePublicClient = false
): Promise<PageData> {
  try {
    const client = usePublicClient ? publicApiClient : apiClient;
    const response = await client.getPageData(pageId);

    const variables = (response.variables || []).map((v) => ({
      name: v.name,
      value: v.value,
      source: v.source as PageVariable['source'],
    }));

    // Only merge localStorage-persisted route params in the builder (authenticated client).
    // Public/preview clients must never read localStorage values written by a builder session,
    // as that could inject stale or cross-session data into a visitor's page.
    const storedRouteVars =
      !usePublicClient && extraVariables.length === 0 ? getStoredRouteParams(pageId) : [];
    const mergedVariables = [
      ...variables.filter((v) => !storedRouteVars.some((s) => s.name === v.name)),
      ...storedRouteVars,
      ...extraVariables,
    ];

    const apiCalls: ApiCall[] = (response.apiCalls || []).map((ac: Record<string, unknown>) => {
      const headers = (ac.headers as Record<string, string>) || undefined;
      const params =
        (ac.queryParams as Record<string, string | number | boolean>) ||
        (ac.params as Record<string, string | number | boolean>) ||
        undefined;
      const body =
        typeof ac.body === 'string'
          ? ac.body
          : ac.body !== undefined
            ? JSON.stringify(ac.body)
            : undefined;

      return {
        id: String(ac.id ?? ''),
        name: String(ac.name ?? ''),
        endpoint: String(ac.endpoint ?? ''),
        method: (ac.method as ApiCall['method']) ?? 'GET',
        headers,
        params: params as Record<string, string>,
        body,
        timeout: ac.timeout as number | undefined,
        cacheEnabled: ac.cacheEnabled as boolean | undefined,
        cacheDuration: ac.cacheDuration as number | undefined,
      };
    });

    return { variables: mergedVariables, apiCalls };
  } catch (error) {
    console.error('Failed to load page data:', error);
    return { variables: [], apiCalls: [] };
  }
}
