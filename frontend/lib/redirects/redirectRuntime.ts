export function normalizePathForRedirect(path: string): string {
  if (!path || !path.trim()) return '/';

  let t = path.trim();
  const queryOrFragmentIndex = t.search(/[?#]/);
  if (queryOrFragmentIndex >= 0) {
    t = t.slice(0, queryOrFragmentIndex);
  }

  while (t.includes('//')) {
    t = t.replaceAll('//', '/');
  }

  if (!t.startsWith('/')) t = `/${t}`;
  if (t.length > 1 && t.endsWith('/')) t = t.slice(0, -1);

  return t;
}

export function redirectTargetUrl(origin: string, to: string): URL {
  const t = to.trim();
  if (/^https?:\/\//i.test(t)) return new URL(t);
  if (t.startsWith('/')) return new URL(t, origin);
  return new URL(`/${t}`, origin);
}

export function isSameRedirectTarget(current: URL, target: URL): boolean {
  const currentPath = normalizePathForRedirect(current.pathname);
  const targetPath = normalizePathForRedirect(target.pathname);
  return current.origin === target.origin && currentPath === targetPath && current.search === target.search;
}
