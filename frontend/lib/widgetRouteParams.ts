/**
 * Helpers for automatically appending dynamic page route params to widget API endpoint URLs.
 *
 * When `autoPassRouteParams` is enabled on a widget instance, route params extracted from
 * the current URL (e.g. SUMMER=summer from /holidays/<SUMMER>) are appended as query params
 * before the widget fetches its apiEndpoint.
 */

/** Reserved query param keys that the vertical widget appends for pagination. */
const RESERVED_KEYS = new Set(['page', 'pageSize']);

/**
 * Append dynamic page route params to an endpoint URL.
 *
 * Rules:
 * - If `enabled` is false/undefined or `routeParams` is empty, returns `endpoint` unchanged.
 * - Existing query keys on the endpoint are NOT overwritten.
 * - Reserved pagination keys (`page`, `pageSize`) are skipped.
 * - Optional `map` renames a route param key before appending (e.g. SUMMER -> season).
 * - Empty / whitespace values are skipped.
 * - Keys/values are URL-encoded.
 */
export function applyRouteParamsToEndpoint(
  endpoint: string,
  routeParams: Record<string, string> | undefined,
  opts: { enabled?: boolean; map?: Record<string, string> } = {}
): string {
  if (!opts.enabled) return endpoint;
  if (!routeParams || Object.keys(routeParams).length === 0) return endpoint;

  let url: URL;
  try {
    // Use a dummy base so we can parse relative and absolute URLs the same way
    const isAbsolute = /^https?:\/\//i.test(endpoint) || endpoint.startsWith('//');
    url = isAbsolute ? new URL(endpoint) : new URL(endpoint, 'http://localhost');
  } catch {
    // Unparseable endpoint — return unchanged rather than crashing
    return endpoint;
  }

  const existingKeys = new Set(url.searchParams.keys());

  for (const [routeKey, routeValue] of Object.entries(routeParams)) {
    const queryKey = opts.map?.[routeKey] ?? routeKey;

    if (RESERVED_KEYS.has(queryKey)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn(
          `[autoPassRouteParams] Skipping route param "${routeKey}" mapped to reserved key "${queryKey}".`
        );
      }
      continue;
    }

    if (existingKeys.has(queryKey)) continue;
    if (!routeValue?.trim()) continue;

    url.searchParams.append(queryKey, routeValue);
  }

  // For relative endpoints, strip the dummy base back off
  const isAbsolute = /^https?:\/\//i.test(endpoint) || endpoint.startsWith('//');
  if (isAbsolute) {
    return url.toString();
  }
  // Reconstruct: pathname + search + hash
  return `${url.pathname}${url.search}${url.hash}`;
}
