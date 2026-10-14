/** SSR endpoint mapping for widget-gallery. Used by preview page to fill images without JS. */
export const endpointSsrMapping = {
  endpointKey: 'apiEndpoint',
  responseKey: 'images',
} as const;
