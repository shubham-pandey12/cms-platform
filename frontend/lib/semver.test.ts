import { describe, expect, it } from 'vitest';
import { bumpVersion, formatVersion, parseVersion } from './semver';

describe('parseVersion', () => {
  it('returns default for empty input', () => {
    expect(parseVersion('')).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it('parses full semver', () => {
    expect(parseVersion('2.3.4')).toEqual({ major: 2, minor: 3, patch: 4 });
  });

  it('uses defaults for missing parts', () => {
    expect(parseVersion('5')).toEqual({ major: 5, minor: 0, patch: 0 });
    expect(parseVersion('5.x')).toEqual({ major: 5, minor: 0, patch: 0 });
  });
});

describe('bumpVersion', () => {
  it('bumps major', () => {
    expect(bumpVersion('1.2.3', 'major')).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('bumps minor', () => {
    expect(bumpVersion('1.2.3', 'minor')).toEqual({ major: 1, minor: 3, patch: 0 });
  });

  it('bumps patch', () => {
    expect(bumpVersion('1.2.3', 'patch')).toEqual({ major: 1, minor: 2, patch: 4 });
  });
});

describe('formatVersion', () => {
  it('joins components', () => {
    expect(formatVersion(1, 0, 2)).toBe('1.0.2');
  });

  it('clamps negatives to zero', () => {
    expect(formatVersion(-1, -2, -3)).toBe('0.0.0');
  });
});
