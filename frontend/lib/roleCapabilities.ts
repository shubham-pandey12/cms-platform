export type RoleCapabilityKey =
  | 'view'
  | 'moderate'
  | 'create'
  | 'publishApprove'
  | 'manageChannelsUsers';

export interface RoleCapabilityDefinition {
  key: RoleCapabilityKey;
  label: string;
  orgLevel?: boolean;
}

export interface RoleCapabilityRow {
  role: string;
  displayName: string;
  description: string;
  capabilities: Record<RoleCapabilityKey, boolean>;
}

export const ROLE_CAPABILITY_DEFINITIONS: RoleCapabilityDefinition[] = [
  { key: 'view', label: 'View-only' },
  { key: 'moderate', label: 'Moderate engagement' },
  { key: 'create', label: 'Create content' },
  { key: 'publishApprove', label: 'Publish and approve content' },
  { key: 'manageChannelsUsers', label: 'Manage channels and users', orgLevel: true },
];

export const ROLE_CAPABILITY_ROWS: RoleCapabilityRow[] = [
  {
    role: 'Admin',
    displayName: 'Admin',
    description: 'Full access across users, channels, and content.',
    capabilities: {
      view: true,
      moderate: true,
      create: true,
      publishApprove: true,
      manageChannelsUsers: true,
    },
  },
  {
    role: 'ContentTeam',
    displayName: 'Editor',
    description: 'Creates and publishes content but cannot manage users.',
    capabilities: {
      view: true,
      moderate: true,
      create: true,
      publishApprove: true,
      manageChannelsUsers: false,
    },
  },
  {
    role: 'Engineer',
    displayName: 'Content creator',
    description: 'Creates and moderates content with no publish approvals.',
    capabilities: {
      view: true,
      moderate: true,
      create: true,
      publishApprove: false,
      manageChannelsUsers: false,
    },
  },
];

const LABEL_MAP: Record<string, string> = {
  admin: 'Admin',
  contentteam: 'Editor',
  engineer: 'Content creator',
};

export function normalizeRole(role: string | null | undefined): string {
  return String(role ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');
}

export function getRoleDisplayLabel(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  if (!normalized) return 'Unknown';
  return LABEL_MAP[normalized] ?? role ?? 'Unknown';
}

export function getRoleCapabilities(role: string | null | undefined): Record<RoleCapabilityKey, boolean> {
  const normalized = normalizeRole(role);
  const match = ROLE_CAPABILITY_ROWS.find((row) => normalizeRole(row.role) === normalized);
  if (!match) {
    return {
      view: false,
      moderate: false,
      create: false,
      publishApprove: false,
      manageChannelsUsers: false,
    };
  }
  return match.capabilities;
}
