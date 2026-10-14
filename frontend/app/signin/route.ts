import { NextRequest, NextResponse } from 'next/server';
import { getMosOAuthRedirectOrigin, getMosOAuthOriginSource } from '@/lib/mosAuthOrigin';
import { logSso } from '@/lib/ssoLog';

const MOS_GATEWAY_URL = (process.env.NEXT_PUBLIC_MOS_GATEWAY_URL ?? '').replace(/\/+$/, '');
const MOS_CLIENT_ID = process.env.NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID ?? '';
const SIGNIN_CALLBACK_PATH = '/signin-callback';

type OauthState = { returnUrl?: string | null };

function serializeState(state: OauthState): string {
  const encoded = {
    ...state,
    returnUrl: state.returnUrl ? encodeURIComponent(state.returnUrl) : undefined,
  };
  return Buffer.from(JSON.stringify(encoded)).toString('base64');
}

export function GET(request: NextRequest) {
  const originSource = getMosOAuthOriginSource();
  const derivedOrigin = getMosOAuthRedirectOrigin(request);

  let mosGatewayHost = '';
  if (MOS_GATEWAY_URL) {
    try {
      mosGatewayHost = new URL(MOS_GATEWAY_URL).host;
    } catch {
      mosGatewayHost = 'parse_error';
    }
  }

  logSso('signin_request', {
    host: request.headers.get('host') ?? '',
    xForwardedHost: request.headers.get('x-forwarded-host') ?? '',
    xForwardedProto: request.headers.get('x-forwarded-proto') ?? '',
    xForwardedFor: request.headers.get('x-forwarded-for') ?? '',
    nextUrlOrigin: request.nextUrl.origin,
    originSource,
    derivedPublicOrigin: derivedOrigin,
    mosGatewayConfigured: Boolean(MOS_GATEWAY_URL && MOS_CLIENT_ID),
    mosGatewayHost,
    mosClientIdSet: Boolean(MOS_CLIENT_ID),
  });

  if (!MOS_GATEWAY_URL || !MOS_CLIENT_ID) {
    logSso('signin_config_missing', { detail: 'NEXT_PUBLIC_MOS_GATEWAY_URL or CLIENT_ID unset' });
    return NextResponse.json(
      { error: 'MOS Gateway is not configured' },
      { status: 503 }
    );
  }

  const returnUrl =
    typeof request.nextUrl.searchParams.get('returnUrl') === 'string'
      ? request.nextUrl.searchParams.get('returnUrl')
      : null;
  const state: OauthState = { returnUrl };
  const stateEncoded = serializeState(state);

  const redirectUri = `${derivedOrigin}${SIGNIN_CALLBACK_PATH}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: MOS_CLIENT_ID,
    scope: 'openid offline_access profile email',
    redirect_uri: redirectUri,
    state: stateEncoded,
  });
  const authorizeUrl = `${MOS_GATEWAY_URL}/oauth/authorize?${params.toString()}`;

  logSso('signin_redirect_gateway', {
    redirectUri,
    returnUrl: returnUrl ?? '',
    authorizePath: '/oauth/authorize',
  });

  return NextResponse.redirect(authorizeUrl, 307);
}
