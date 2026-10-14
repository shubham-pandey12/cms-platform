/**
 * Parse a semver string into major, minor, patch numbers.
 * Returns { major: 1, minor: 0, patch: 0 } for invalid or missing input.
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  if (!version || typeof version !== 'string') {
    return { major: 1, minor: 0, patch: 0 };
  }
  const segments = version.trim().split('.');
  const parts = segments.map((p) => parseInt(p, 10));
  const major = segments.length < 1 || Number.isNaN(parts[0]!) ? 1 : Math.max(0, parts[0]!);
  const minor = segments.length < 2 || Number.isNaN(parts[1]!) ? 0 : Math.max(0, parts[1]!);
  const patch = segments.length < 3 || Number.isNaN(parts[2]!) ? 0 : Math.max(0, parts[2]!);
  return { major, minor, patch };
}

export type VersionBump = 'major' | 'minor' | 'patch';

/**
 * Returns the next version (major, minor, patch) for the given bump type.
 */
export function bumpVersion(
  version: string,
  bump: VersionBump
): { major: number; minor: number; patch: number } {
  const { major, minor, patch } = parseVersion(version);
  switch (bump) {
    case 'major':
      return { major: major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major, minor: minor + 1, patch: 0 };
    case 'patch':
      return { major, minor, patch: patch + 1 };
    default:
      return { major, minor, patch };
  }
}

/**
 * Format major.minor.patch to version string.
 */
export function formatVersion(major: number, minor: number, patch: number): string {
  return `${Math.max(0, major)}.${Math.max(0, minor)}.${Math.max(0, patch)}`;
}
