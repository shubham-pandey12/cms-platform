// Custom Renderers Registry
// For widgets that are too complex for the declarative template system.
// Registry is built at build time from the repo-level widgets/ folder (sibling to frontend/).
// Versioned paths: widgets/widget-<slug>/v<n>/index.tsx, or optional single brand segment:
// widgets/<brand>/widget-<slug>/v<n>/index.tsx (e.g. example-brand, travel-center).

import type { CustomRenderer } from '@/types/renderTemplate';

type RendererModule = { default: CustomRenderer };

type RequireContext = {
  keys: () => string[];
  (key: string): RendererModule;
};

// @ts-expect-error - require.context is a Webpack API, not on Node's Require type
const context = require.context(
  '../../../../widgets',
  true,
  /^\.\/(?:[^/]+\/)?widget-[^/]+\/v\d+\/index\.(tsx|jsx)$/
) as RequireContext;

const customRenderers: Record<string, CustomRenderer> = {};
const versionedRenderers: Record<string, Record<string, CustomRenderer>> = {};

context.keys().forEach((key) => {
  const match = key.match(/^\.\/(?:[^/]+\/)?(widget-[^/]+)\/v(\d+)\/index\.(tsx|jsx)$/);
  if (match) {
    const slug = match[1];
    const majorVersion = match[2];
    const mod = context(key);
    if (mod?.default) {
      if (!versionedRenderers[slug]) {
        versionedRenderers[slug] = {};
      }
      versionedRenderers[slug][majorVersion] = mod.default;
      const latestVersion = Math.max(
        ...Object.keys(versionedRenderers[slug]).map(Number)
      );
      customRenderers[slug] = versionedRenderers[slug][latestVersion.toString()];
    }
  }
});

export { customRenderers, versionedRenderers };

/**
 * Check if a widget has a custom renderer
 */
export const hasCustomRenderer = (widgetDefinitionId: string): boolean => {
  return widgetDefinitionId in customRenderers;
};

/**
 * Get the custom renderer for a widget (returns latest version)
 */
export const getCustomRenderer = (widgetDefinitionId: string): CustomRenderer | undefined => {
  return customRenderers[widgetDefinitionId];
};

/**
 * Get a version-specific custom renderer for a widget.
 * Falls back to latest version if the specific version is not found.
 */
export const getVersionedCustomRenderer = (
  slug: string,
  version?: string
): CustomRenderer | undefined => {
  if (!version) {
    return customRenderers[slug];
  }

  const majorVersion = version.split('.')[0];
  const versionsForSlug = versionedRenderers[slug];

  if (versionsForSlug && versionsForSlug[majorVersion]) {
    return versionsForSlug[majorVersion];
  }

  return customRenderers[slug];
};
