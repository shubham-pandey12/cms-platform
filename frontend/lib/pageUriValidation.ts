/**
 * Validation helpers for CMS page URIs, covering both static and dynamic patterns.
 *
 * Dynamic URLs use angle-bracket placeholders accepted by the CMS builder, e.g.
 * /packages/<PACKAGE_SLUG>. Variable names must be SCREAMING_SNAKE_CASE ([A-Z_]+).
 * The backend MatchPattern method understands this syntax.
 */

/** Extracts variable names (without brackets) from a dynamic URI pattern. */
export function extractUriVariables(uri: string): string[] {
  const matches = uri.match(/<([A-Z_]+)>/g);
  return matches ? matches.map(m => m.slice(1, -1)) : [];
}

/**
 * Lowercases literal path characters while preserving case inside `<...>` placeholders
 * (SCREAMING_SNAKE_CASE variable names). Used by the create-page URL field.
 */
export function normalizePageUriInput(value: string): string {
  let out = '';
  let insidePlaceholder = false;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '<') {
      insidePlaceholder = true;
      out += c;
    } else if (c === '>') {
      insidePlaceholder = false;
      out += c;
    } else if (insidePlaceholder) {
      out += c;
    } else {
      out += c.toLowerCase();
    }
  }
  return out;
}

/**
 * Returns the variable names that appear more than once in the URI.
 * e.g. /a/<X>/b/<X> => ['X']
 */
function findDuplicateVariables(variables: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const v of variables) {
    if (seen.has(v)) duplicates.add(v);
    seen.add(v);
  }
  return [...duplicates];
}

/**
 * Checks whether a URI segment looks like an angle-bracket variable but is malformed,
 * e.g. a segment that has '<' or '>' but is not a complete <VAR> placeholder.
 */
function hasMalformedVariable(uri: string): boolean {
  // Each segment that contains '<' or '>' must be exactly <[A-Z_]+>
  const segments = uri.split('/').filter(Boolean);
  for (const seg of segments) {
    if (seg.includes('<') || seg.includes('>')) {
      if (!/^<[A-Z_]+>$/.test(seg)) {
        return true;
      }
    }
  }
  return false;
}

export interface UriPage {
  uri: string;
  isDynamic: boolean;
  name: string;
  id?: string;
}

export interface UriValidationResult {
  /** null when valid */
  error: string | null;
}

/**
 * Validates a page URI for both static and dynamic patterns.
 *
 * @param uri           The candidate URI, e.g. "/packages/<PACKAGE_SLUG>"
 * @param existingPages Pages for the same brand (to detect collisions)
 * @param currentPageId When editing, the id of the current page so it is excluded from collision checks
 */
export function validatePageUri(
  uri: string,
  existingPages: UriPage[],
  currentPageId?: string
): UriValidationResult {
  const trimmed = uri.trim();

  if (!trimmed) {
    return { error: 'URI is required' };
  }

  if (!trimmed.startsWith('/')) {
    return { error: 'URI must start with /' };
  }

  if (hasMalformedVariable(trimmed)) {
    return {
      error:
        'Variable placeholders must be uppercase and contain only letters and underscores, e.g. <PACKAGE_SLUG>',
    };
  }

  const variables = extractUriVariables(trimmed);
  const isDynamic = variables.length > 0;

  // Detect mixed case variables that typed as <slug> (lowercase won't be extracted)
  const lowerAngleBrackets = trimmed.match(/<[a-z][^>]*>/g);
  if (lowerAngleBrackets) {
    return {
      error: `Variable names must be uppercase, e.g. use <${lowerAngleBrackets[0].slice(1, -1).toUpperCase()}> instead of ${lowerAngleBrackets[0]}`,
    };
  }

  if (isDynamic) {
    const dupes = findDuplicateVariables(variables);
    if (dupes.length > 0) {
      return { error: `Duplicate variable name(s) in URI: ${dupes.map(d => `<${d}>`).join(', ')}` };
    }
  }

  const normalizedNew = trimmed.toLowerCase().replace(/\/+$/, '') || '/';

  // Collision detection against existing pages (excluding the page being edited)
  const others = existingPages.filter(p => !currentPageId || p.id !== currentPageId);

  if (!isDynamic) {
    // Static: must not duplicate another static URI
    const duplicate = others.find(p => {
      if (p.isDynamic) return false;
      const existingNorm = p.uri.toLowerCase().replace(/\/+$/, '') || '/';
      return existingNorm === normalizedNew;
    });
    if (duplicate) {
      return { error: `URI "${trimmed}" already exists for page "${duplicate.name}"` };
    }
  } else {
    // Dynamic: must not duplicate another dynamic pattern with the same literal structure
    // Two dynamic patterns collide when their segment count is the same and all literal
    // segments match (param/wildcard slots do not count as discriminators).
    const segments = normalizedNew.split('/').filter(Boolean);
    const duplicate = others.find(p => {
      if (!p.isDynamic) return false;
      const otherNorm = p.uri.toLowerCase().replace(/\/+$/, '') || '/';
      const otherSegs = otherNorm.split('/').filter(Boolean);
      if (otherSegs.length !== segments.length) return false;
      // Check that literal segments match; treat param/wildcard as match-anything
      const isParam = (s: string) =>
        (s.startsWith('<') && s.endsWith('>')) || s.startsWith(':') || s === '*';
      return segments.every((seg, i) => {
        if (isParam(seg) || isParam(otherSegs[i])) return true;
        return seg === otherSegs[i];
      });
    });
    if (duplicate) {
      return {
        error: `This dynamic pattern conflicts with existing page "${duplicate.name}" (${duplicate.uri})`,
      };
    }
  }

  return { error: null };
}
