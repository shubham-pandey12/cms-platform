import { describe, expect, it } from 'vitest';
import { deepClone } from './deepClone';

describe('deepClone', () => {
  it('returns primitives as-is', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('x')).toBe('x');
    expect(deepClone(null)).toBe(null);
  });

  it('clones plain object deeply', () => {
    const src = { a: 1, nested: { b: 2 } };
    const copy = deepClone(src);
    expect(copy).toEqual(src);
    expect(copy).not.toBe(src);
    expect(copy.nested).not.toBe(src.nested);
  });

  it('clones arrays', () => {
    const src = [{ x: 1 }];
    const copy = deepClone(src);
    expect(copy).toEqual(src);
    expect(copy).not.toBe(src);
    expect(copy[0]).not.toBe(src[0]);
  });

  it('clones Date', () => {
    const d = new Date('2020-01-02T03:04:05Z');
    const copy = deepClone(d);
    expect(copy.getTime()).toBe(d.getTime());
    expect(copy).not.toBe(d);
  });
});
