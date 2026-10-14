/**
 * Helpers for resolving localized widget config values.
 * Widget config may store text as a string (legacy) or as Record<lang, string>.
 */

/** Default language when none is set (e.g. viewer without URL-based lang). 5-char locale (e.g. en-GB). */
export const DEFAULT_LANG = 'en-GB';

/**
 * Returns whether the value is a localized object (lang-keyed strings).
 */
export function isLocalizedValue(value: unknown): value is Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value as object);
  return keys.length === 0 || keys.every((k) => typeof (value as Record<string, unknown>)[k] === 'string');
}

/**
 * Resolves a config value to a string for the given lang.
 * - If value is a string, returns it (legacy single-lang).
 * - If value is a plain object (lang keys -> string), returns value[lang] ?? value[languagePart] ?? value['en'] ?? first value ?? ''.
 *   Language part (e.g. 'en' from 'en-GB') supports configs that still use 2-letter keys.
 * - Otherwise returns ''.
 */
export function getLocalizedValue(value: unknown, lang: string): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, string>;
    const languagePart = lang.includes('-') ? lang.slice(0, lang.indexOf('-')) : lang;
    const byLang = map[lang] ?? map[languagePart] ?? map['en'];
    if (byLang != null && byLang !== '') {
      return byLang;
    }
    const first = Object.values(map).find((v) => v != null && v !== '');
    return typeof first === 'string' ? first : '';
  }
  return '';
}
