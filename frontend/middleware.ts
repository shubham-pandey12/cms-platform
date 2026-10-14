import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiConfig';
import {
  isSameRedirectTarget,
  normalizePathForRedirect,
  redirectTargetUrl,
} from '@/lib/redirects/redirectRuntime';

const ADMIN_OR_PUBLIC_PREFIXES = ['/login', '/brands', '/builder', '/users', '/roles', '/media', '/signin', '/signin-callback', '/preview'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Host-based site resolution: for "/" or paths not under admin/preview, resolve brand by host and rewrite to /preview/[brandId]/[...]
  const isAdminOrPreview = ADMIN_OR_PUBLIC_PREFIXES.some(route => pathname === route || pathname.startsWith(route + '/'));
  if (!isAdminOrPreview) {
    const hostHeader = request.headers.get('x-forwarded-host') ?? request.nextUrl.host;
    const hostWithoutPort = hostHeader.split(':')[0]?.trim().toLowerCase() ?? '';
    if (hostWithoutPort) {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/brands/by-host?host=${encodeURIComponent(hostWithoutPort)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const brand = (await res.json()) as { id: string };
          if (brand?.id) {
            const pathForRule = normalizePathForRedirect(pathname);
            try {
              const resolveRes = await fetch(
                `${apiBase}/brands/${brand.id}/redirects/resolve?path=${encodeURIComponent(pathForRule)}`,
                {
                  cache: 'no-store',
                  headers: { Accept: 'application/json' },
                }
              );
              if (resolveRes.ok) {
                const rule = (await resolveRes.json()) as { to: string; status: number };
                if (rule?.to) {
                  const target = redirectTargetUrl(request.nextUrl.origin, rule.to);
                  if (isSameRedirectTarget(request.nextUrl, target)) {
                    // Skip no-op redirects and continue to normal preview rewrite.
                    const rewritePath = pathname === '/' ? `/preview/${brand.id}` : `/preview/${brand.id}${pathname}`;
                    const rewriteUrl = new URL(rewritePath, request.url);
                    return NextResponse.rewrite(rewriteUrl);
                  }
                  const code = rule.status === 302 ? 302 : 301;
                  return NextResponse.redirect(target, code);
                }
              }
            } catch {
              // Fall through to preview rewrite
            }

            const rewritePath = pathname === '/' ? `/preview/${brand.id}` : `/preview/${brand.id}${pathname}`;
            const rewriteUrl = new URL(rewritePath, request.url);
            return NextResponse.rewrite(rewriteUrl);
          }
        }
      } catch {
        // Fall through to normal handling
      }
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/preview', '/signin', '/signin-callback'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check for auth token in cookies or headers
  const token = request.cookies.get('auth_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If accessing admin routes without token, redirect to login
  if (!isPublicRoute && !token && pathname.startsWith('/')) {
    if (pathname === '/') {
      return NextResponse.next();
    }
    if (
      pathname.startsWith('/builder') ||
      pathname.startsWith('/brands') ||
      pathname.startsWith('/users') ||
      pathname.startsWith('/roles') ||
      pathname.startsWith('/media')
    ) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

