import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/lib/widgetSchema/evaluateCondition';

const config = {
  mode: 'api',
  count: 5,
  slug: 'acme-hero',
  enabled: true,
  empty: '',
  nullField: null,
  tags: ['a', 'b', 'c'],
};

describe('evaluateCondition — leaf operators', () => {
  it('returns true for undefined condition', () => {
    expect(evaluateCondition(undefined, config)).toBe(true);
  });

  it('truthy: true when field has a non-empty value', () => {
    expect(evaluateCondition({ field: 'mode', op: 'truthy' }, config)).toBe(true);
  });

  it('truthy: false when field is empty string', () => {
    expect(evaluateCondition({ field: 'empty', op: 'truthy' }, config)).toBe(false);
  });

  it('truthy: false when field is null', () => {
    expect(evaluateCondition({ field: 'nullField', op: 'truthy' }, config)).toBe(false);
  });

  it('falsy: true when field is empty string', () => {
    expect(evaluateCondition({ field: 'empty', op: 'falsy' }, config)).toBe(true);
  });

  it('falsy: false when field has value', () => {
    expect(evaluateCondition({ field: 'mode', op: 'falsy' }, config)).toBe(false);
  });

  it('eq: true for matching value', () => {
    expect(evaluateCondition({ field: 'mode', op: 'eq', value: 'api' }, config)).toBe(true);
  });

  it('eq: false for non-matching value', () => {
    expect(evaluateCondition({ field: 'mode', op: 'eq', value: 'manual' }, config)).toBe(false);
  });

  it('neq: true for different value', () => {
    expect(evaluateCondition({ field: 'mode', op: 'neq', value: 'manual' }, config)).toBe(true);
  });

  it('in: true when value is in array', () => {
    expect(evaluateCondition({ field: 'mode', op: 'in', value: ['api', 'manual'] }, config)).toBe(true);
  });

  it('in: false when value is not in array', () => {
    expect(evaluateCondition({ field: 'mode', op: 'in', value: ['manual', 'static'] }, config)).toBe(false);
  });

  it('nin: true when value is not in array', () => {
    expect(evaluateCondition({ field: 'mode', op: 'nin', value: ['manual', 'static'] }, config)).toBe(true);
  });

  it('gt: true when count > threshold', () => {
    expect(evaluateCondition({ field: 'count', op: 'gt', value: 3 }, config)).toBe(true);
  });

  it('gt: false when count <= threshold', () => {
    expect(evaluateCondition({ field: 'count', op: 'gt', value: 5 }, config)).toBe(false);
  });

  it('lt: true when count < threshold', () => {
    expect(evaluateCondition({ field: 'count', op: 'lt', value: 10 }, config)).toBe(true);
  });

  it('regex: true when field matches pattern', () => {
    expect(evaluateCondition({ field: 'slug', op: 'regex', value: '^acme-' }, config)).toBe(true);
  });

  it('regex: false when field does not match pattern', () => {
    expect(evaluateCondition({ field: 'slug', op: 'regex', value: '^other-' }, config)).toBe(false);
  });
});

describe('evaluateCondition — compound conditions', () => {
  it('all: true when all conditions are satisfied', () => {
    expect(
      evaluateCondition(
        { all: [{ field: 'mode', op: 'eq', value: 'api' }, { field: 'enabled', op: 'truthy' }] },
        config
      )
    ).toBe(true);
  });

  it('all: false when one condition fails', () => {
    expect(
      evaluateCondition(
        { all: [{ field: 'mode', op: 'eq', value: 'api' }, { field: 'empty', op: 'truthy' }] },
        config
      )
    ).toBe(false);
  });

  it('any: true when at least one condition is satisfied', () => {
    expect(
      evaluateCondition(
        { any: [{ field: 'mode', op: 'eq', value: 'manual' }, { field: 'enabled', op: 'truthy' }] },
        config
      )
    ).toBe(true);
  });

  it('any: false when all conditions fail', () => {
    expect(
      evaluateCondition(
        { any: [{ field: 'mode', op: 'eq', value: 'manual' }, { field: 'empty', op: 'truthy' }] },
        config
      )
    ).toBe(false);
  });

  it('nested all inside any', () => {
    expect(
      evaluateCondition(
        {
          any: [
            { all: [{ field: 'mode', op: 'eq', value: 'wrong' }, { field: 'enabled', op: 'truthy' }] },
            { field: 'count', op: 'gt', value: 3 },
          ],
        },
        config
      )
    ).toBe(true);
  });
});
