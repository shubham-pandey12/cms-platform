import { describe, expect, it } from 'vitest';
import {
  isSameRedirectTarget,
  normalizePathForRedirect,
  redirectTargetUrl,
} from '@/lib/redirects/redirectRuntime';

describe('redirectRuntime', () => {
  it('normalizes slash, query, and fragment variants', () => {
    expect(normalizePathForRedirect(' promo///?utm=1#x')).toBe('/promo');
  });

  it('builds absolute redirect target for relative paths', () => {
    const target = redirectTargetUrl('https://brand.example.com', 'offers/summer');
    expect(target.toString()).toBe('https://brand.example.com/offers/summer');
  });

  it('identifies same-origin same-path redirects as no-op', () => {
    const current = new URL('https://brand.example.com/promo/');
    const target = new URL('https://brand.example.com/promo?utm=1');
    expect(isSameRedirectTarget(current, target)).toBe(false);
    const same = new URL('https://brand.example.com/promo');
    expect(isSameRedirectTarget(current, same)).toBe(true);
  });
});
