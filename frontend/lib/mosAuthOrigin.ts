import { NextRequest } from 'next/server';

/** Whether the public origin was taken from the env var, forwarded headers, or the raw request. */
export type OriginSource = 'env' | 'forwarded-headers' | 'host-header' | 'nexturl';

/** Returns a string label describing how the public origin was resolved. */
export function getMosOAuthOriginSource(request?: NextRequest): OriginSource {
  const configured = (process.env.MOS_AUTH_PUBLIC_ORIGIN ?? '').trim();
  if (configured) return 'env';
  if (!request) return 'nexturl';
  if (firstHeaderValue(request.headers.get('x-forwarded-proto')) &&
      firstHeaderValue(request.headers.get('x-forwarded-host'))) {
    return 'forwarded-headers';
  }
  if (request.headers.get('host')) return 'host-header';
  return 'nexturl';
}

/**
 * Returns the public-facing origin (scheme + host + optional port, no trailing slash)
 * to use when constructing OAuth redirect_uri values and browser redirects.
 *
 * Priority order:
 * 1. MOS_AUTH_PUBLIC_ORIGIN env var — always correct behind ALB; set this in all
 *    proxy/container deployments (e.g. "https://example.com").
 * 2. x-forwarded-proto + x-forwarded-host request headers (set by ALB/reverse proxy).
 * 3. host request header (with https assumed for non-dev environments).
 * 4. request.nextUrl as last resort (may reflect internal address behind ALB).
 */
export function getMosOAuthRedirectOrigin(request: NextRequest): string {
  const configured = (process.env.MOS_AUTH_PUBLIC_ORIGIN ?? '').trim().replace(/\/+$/, '');
  if (configured) {
    if (process.env.NODE_ENV === 'development') {
      try {
        new URL(configured);
      } catch {
        console.warn(
          `[mosAuthOrigin] MOS_AUTH_PUBLIC_ORIGIN "${configured}" is not a valid URL. ` +
            'Falling back to request origin.',
        );
        return deriveOriginFromRequest(request);
      }
    }
    try {
      const u = new URL(configured);
      return u.origin;
    } catch {
      return configured;
    }
  }

  return deriveOriginFromRequest(request);
}

/**
 * Derives the public origin from incoming request headers.
 * Uses forwarded headers set by ALB/proxy before falling back to the raw Host header
 * or Next.js's nextUrl (which may reflect the internal container address).
 */
function deriveOriginFromRequest(request: NextRequest): string {
  const proto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  if (proto && forwardedHost) {
    return `${proto}://${forwardedHost}`;
  }

  const hostHeader = request.headers.get('host');
  if (hostHeader) {
    // Assume https outside of local dev since ALB terminates TLS before forwarding.
    const scheme = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    return `${scheme}://${hostHeader}`;
  }

  // Last resort: nextUrl — may be an internal address when behind ALB without forwarding.
  const u = request.nextUrl;
  const host = u.hostname === '0.0.0.0' ? `localhost:${u.port || '3000'}` : u.host;
  return `${u.protocol}//${host}`;
}

/** Takes the first entry from a potentially comma-separated header value. */
function firstHeaderValue(header: string | null): string {
  if (!header) return '';
  return header.split(',')[0].trim();
}
