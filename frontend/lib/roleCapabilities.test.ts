import { describe, expect, it } from 'vitest';
import {
  getRoleCapabilities,
  getRoleDisplayLabel,
  normalizeRole,
  ROLE_CAPABILITY_DEFINITIONS,
} from './roleCapabilities';

describe('roleCapabilities', () => {
  it('normalizes role values from API and UI variants', () => {
    expect(normalizeRole('ContentTeam')).toBe('contentteam');
    expect(normalizeRole('content_team')).toBe('contentteam');
    expect(normalizeRole(' content-team ')).toBe('contentteam');
  });

  it('returns friendly display labels for known roles', () => {
    expect(getRoleDisplayLabel('Admin')).toBe('Admin');
    expect(getRoleDisplayLabel('ContentTeam')).toBe('Editor');
    expect(getRoleDisplayLabel('Engineer')).toBe('Content creator');
  });

  it('returns expected capability matrix for admin role', () => {
    const capabilities = getRoleCapabilities('Admin');
    expect(capabilities.view).toBe(true);
    expect(capabilities.moderate).toBe(true);
    expect(capabilities.create).toBe(true);
    expect(capabilities.publishApprove).toBe(true);
    expect(capabilities.manageChannelsUsers).toBe(true);
  });

  it('returns disabled capabilities for unknown roles', () => {
    const capabilities = getRoleCapabilities('UnknownRole');
    expect(Object.values(capabilities).every((value) => value === false)).toBe(true);
  });

  it('marks only management capability as org-level', () => {
    const orgLevelKeys = ROLE_CAPABILITY_DEFINITIONS.filter((item) => item.orgLevel).map((item) => item.key);
    expect(orgLevelKeys).toEqual(['manageChannelsUsers']);
  });
});
