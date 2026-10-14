/**
 * Navigation utilities for published page viewer
 * Converts internal page links to preview URLs
 */

/**
 * Check if we're currently in the published page viewer
 */
export const isInPreviewViewer = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.pathname.startsWith('/preview/');
};

/**
 * Extract brandId from current preview URL
 */
export const getPreviewBrandId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const match = window.location.pathname.match(/^\/preview\/([^/]+)/);
  return match ? match[1] : null;
};

/**
 * Convert an internal page URL to a preview URL
 * @param url - The URL to convert (e.g., "/home", "/about")
 * @returns Preview URL (e.g., "/preview/brand-1/home") or original URL if external
 */
export const convertToPreviewUrl = (url: string): string => {
  // If already a preview URL, return as-is
  if (url.startsWith('/preview/')) {
    return url;
  }

  // If external URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }

  // If hash/anchor link, return as-is
  if (url.startsWith('#')) {
    return url;
  }

  // If empty or just '/', return as-is
  if (!url || url === '/') {
    return url;
  }

  // Get current brandId from URL
  const brandId = getPreviewBrandId();
  if (!brandId) {
    // Not in preview viewer, return original URL
    return url;
  }

  // Ensure URL starts with /
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Convert to preview URL
  return `/preview/${brandId}${normalizedUrl}`;
};

/**
 * Handle navigation click - converts internal links to preview URLs
 * Works with Next.js router
 */
export const handlePreviewNavigation = (
  url: string,
  target?: string,
  router?: { push: (path: string) => void }
): void => {
  if (!url || url === '#' || url === '') {
    return;
  }

  // External links
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    if (typeof window !== 'undefined') {
      window.open(url, target || '_blank');
    }
    return;
  }

  // Hash/anchor links
  if (url.startsWith('#')) {
    if (typeof window !== 'undefined') {
      window.location.hash = url;
    }
    return;
  }

  // Internal links - convert to preview URL if in preview viewer
  if (isInPreviewViewer()) {
    const previewUrl = convertToPreviewUrl(url);
    if (router) {
      router.push(previewUrl);
    } else if (typeof window !== 'undefined') {
      window.location.href = previewUrl;
    }
  } else {
    // Not in preview viewer, use normal navigation
    if (router) {
      router.push(url);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }
};
