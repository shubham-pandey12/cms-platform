/**
 * Derives display initials from a display name.
 * Returns first letter of first two words, or first two letters of a single word.
 * Falls back to '?' when name is absent.
 */
export function getUserInitials(name: string | undefined | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}
