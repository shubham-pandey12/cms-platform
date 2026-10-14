/** SSR endpoint mapping for widget-faq. Used by preview page to fill questions without JS. */
export const endpointSsrMapping = {
  endpointKey: 'apiEndpoint',
  responseKey: 'questions',
} as const;
