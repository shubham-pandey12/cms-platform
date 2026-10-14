import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { getMosOAuthRedirectOrigin, getMosOAuthOriginSource } from '@/lib/mosAuthOrigin';
import { authCodeFingerprint, logSso } from '@/lib/ssoLog';

const SIGNIN_CALLBACK_PATH = '/signin-callback';

type OauthState = { returnUrl?: string | null };

function deserializeState(stateEncoded: string | null): OauthState | undefined {
  if (!stateEncoded) return undefined;
  try {
    const decoded = JSON.parse(
      Buffer.from(stateEncoded, 'base64').toString('utf8')
    ) as OauthState;
    return {
      ...decoded,
      returnUrl: decoded.returnUrl
        ? decodeURIComponent(decoded.returnUrl)
        : undefined,
    };
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const origin = getMosOAuthRedirectOrigin(request);
  const originSource = getMosOAuthOriginSource(request);
  const redirectUri = `${origin}${SIGNIN_CALLBACK_PATH}`;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');

  logSso('callback_request', {
    host: request.headers.get('host') ?? '',
    xForwardedHost: request.headers.get('x-forwarded-host') ?? '',
    xForwardedProto: request.headers.get('x-forwarded-proto') ?? '',
    originSource,
    derivedPublicOrigin: origin,
    computedRedirectUri: redirectUri,
    code: authCodeFingerprint(code),
    statePresent: Boolean(stateEncoded),
    oauthError: oauthError ?? '',
    oauthErrorDescription: oauthErrorDescription ? '(present)' : '',
  });

  if (oauthError) {
    logSso('callback_oauth_error', {
      error: oauthError,
      errorDescriptionLen: oauthErrorDescription?.length ?? 0,
    });
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'oauth_denied');
    return NextResponse.redirect(loginUrl, 302);
  }

  if (!code) {
    logSso('callback_missing_code', {});
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl, 302);
  }

  const state = deserializeState(stateEncoded);
  const returnUrl =
    state?.returnUrl && state.returnUrl.startsWith('/')
      ? state.returnUrl
      : '/brands';

  const apiBase = getApiBaseUrl();

  logSso('callback_backend_exchange_start', {
    apiBaseHost: (() => {
      try {
        return new URL(apiBase).host;
      } catch {
        return 'invalid_api_base';
      }
    })(),
    redirectUri,
    returnUrl,
  });

  let res: Response;
  try {
    res = await fetch(`${apiBase}/auth/mos-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logSso('callback_backend_fetch_failed', { message });
    console.error('[sso] MOS callback: failed to call backend', err);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl, 302);
  }

  if (!res.ok) {
    const bodyPreview = await res.text();
    const preview =
      bodyPreview.length > 300 ? `${bodyPreview.slice(0, 300)}…` : bodyPreview;
    logSso('callback_backend_exchange_failed', {
      status: res.status,
      statusText: res.statusText,
      bodyPreview: preview.replace(/\s+/g, ' ').trim(),
    });
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl, 302);
  }

  const data = (await res.json()) as {
    token?: string;
    user?: unknown;
  };
  const token = data?.token;
  if (!token) {
    logSso('callback_missing_token_in_response', {});
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl, 302);
  }

  const userEmail =
    data.user &&
    typeof data.user === 'object' &&
    'email' in data.user &&
    typeof (data.user as { email?: string }).email === 'string'
      ? (data.user as { email: string }).email
      : '';

  logSso('callback_success', {
    returnUrl,
    cmsTokenPresent: true,
    userEmailPresent: Boolean(userEmail),
  });

  const redirect = NextResponse.redirect(new URL(returnUrl, origin), 302);
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  redirect.cookies.set('auth_token', token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });
  return redirect;
}
