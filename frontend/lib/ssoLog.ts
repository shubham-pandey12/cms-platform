/**
 * Structured SSO (MOS OAuth) diagnostics for all environments.
 * Never logs secrets: no authorization codes, tokens, or client secrets.
 */

export type SsoLogPayload = Record<string, string | number | boolean | null | undefined>;

export function logSso(phase: string, data: SsoLogPayload = {}): void {
  const entry = {
    phase,
    ts: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    ...data,
  };
  console.log('[sso]', JSON.stringify(entry));
}

/** Safe length-only hint for OAuth authorization codes (never log the value). */
export function authCodeFingerprint(code: string | null): string {
  if (!code) return 'absent';
  return `present,len=${code.length}`;
}
