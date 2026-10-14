import { describe, expect, it } from 'vitest';
import { applyRouteParamsToEndpoint } from './widgetRouteParams';

describe('applyRouteParamsToEndpoint', () => {
  it('returns endpoint unchanged when enabled is false', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: 'summer' },
      { enabled: false }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('returns endpoint unchanged when enabled is undefined', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: 'summer' }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('returns endpoint unchanged when routeParams is empty', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      {},
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('returns endpoint unchanged when routeParams is undefined', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      undefined,
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('appends route params as query params (absolute URL)', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: 'summer' },
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays?SUMMER=summer');
  });

  it('appends route params as query params (relative URL)', () => {
    const result = applyRouteParamsToEndpoint(
      '/api/public/holidays',
      { SUMMER: 'summer' },
      { enabled: true }
    );
    expect(result).toBe('/api/public/holidays?SUMMER=summer');
  });

  it('appends to existing query params without overwriting them', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays?type=beach',
      { SUMMER: 'summer' },
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays?type=beach&SUMMER=summer');
  });

  it('does not overwrite an existing query key of the same name', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays?SUMMER=winter',
      { SUMMER: 'summer' },
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays?SUMMER=winter');
  });

  it('applies key rename from map', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: 'summer' },
      { enabled: true, map: { SUMMER: 'season' } }
    );
    expect(result).toBe('http://api.example.com/holidays?season=summer');
  });

  it('skips reserved keys: page', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { PAGE: '1' },
      { enabled: true, map: { PAGE: 'page' } }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('skips reserved keys: pageSize', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { PAGESIZE: '3' },
      { enabled: true, map: { PAGESIZE: 'pageSize' } }
    );
    expect(result).toBe('http://api.example.com/holidays');
  });

  it('skips params with empty or whitespace-only values', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: '   ', COUNTRY: 'uk' },
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays?COUNTRY=uk');
  });

  it('URL-encodes special characters in values', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SLUG: 'new york & paris' },
      { enabled: true }
    );
    expect(result).toBe('http://api.example.com/holidays?SLUG=new+york+%26+paris');
  });

  it('handles multiple route params', () => {
    const result = applyRouteParamsToEndpoint(
      'http://api.example.com/holidays',
      { SUMMER: 'summer', COUNTRY: 'uk' },
      { enabled: true }
    );
    const url = new URL(result);
    expect(url.searchParams.get('SUMMER')).toBe('summer');
    expect(url.searchParams.get('COUNTRY')).toBe('uk');
  });

  it('handles truly unparseable absolute endpoint gracefully (does not throw)', () => {
    // http://[invalid] is an invalid URL that throws in the URL constructor
    expect(() =>
      applyRouteParamsToEndpoint('http://[invalid]/', { SUMMER: 'summer' }, { enabled: true })
    ).not.toThrow();
  });
});
