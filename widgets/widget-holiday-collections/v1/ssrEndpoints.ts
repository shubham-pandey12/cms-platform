/** SSR endpoint mapping for widget-holiday-collections. Used by preview page to fill packages without JS. */
export const endpointSsrMapping = {
  endpointKey: 'apiEndpoint',
  responseKey: 'packages',
  pagination: { page: 1, pageSize: 12 },
} as const;
