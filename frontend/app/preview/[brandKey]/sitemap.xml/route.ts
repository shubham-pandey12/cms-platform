import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface RouteContext {
  params: Promise<{ brandKey: string }>;
}

/**
 * Proxies to the API sitemap so custom domains (middleware rewrite) and /preview/{brandId}/sitemap.xml serve per-brand XML.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { brandKey } = await context.params;
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/brands/${encodeURIComponent(brandKey)}/sitemap.xml`;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');

  const headers = new Headers();
  headers.set('Accept', 'application/xml');
  // Do not send X-Forwarded-* to the API from this server-side hop: Program.cs uses ForwardedHeaders +
  // UseHttpsRedirection; X-Forwarded-Proto: http + HTTPS connection causes an HTTPS redirect loop in fetch.
  // Custom headers are only read by GetSitemapXml for <loc> base URLs (not processed as forwarded headers).
  const publicHost = forwardedHost ?? host;
  if (publicHost) {
    headers.set('X-Sitemap-Public-Host', publicHost);
  }
  const publicProto =
    forwardedProto?.trim() ||
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(':', '') : 'http');
  if (publicProto) {
    headers.set('X-Sitemap-Public-Proto', publicProto);
  }

  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers,
  });

  if (res.status === 404) {
    return new NextResponse(null, { status: 404 });
  }

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
