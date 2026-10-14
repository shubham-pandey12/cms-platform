import type { ApiCall } from '@/types/cms';

let apiCallsCache: ApiCall[] = [];

export function setApiCallsCache(apiCalls: ApiCall[]): void {
  apiCallsCache = apiCalls;
}

export function getApiCallById(id: string): ApiCall | undefined {
  return apiCallsCache.find((api) => api.id === id);
}

export function getApiCalls(): ApiCall[] {
  return apiCallsCache;
}
