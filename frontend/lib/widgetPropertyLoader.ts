/**
 * Discovers and executes all `properties.ts` side-effect files from widget packages.
 *
 * Each widget may optionally export a `properties.ts` alongside its `index.tsx`:
 *   widgets/<slug>/v<n>/properties.ts
 *   widgets/<brand>/<slug>/v<n>/properties.ts
 *
 * These files are expected to call `widgetPropertyRegistry.registerFieldRenderer(...)` at
 * module evaluation time, registering any custom field renderers into the global registry.
 *
 * This module is imported once at application startup (e.g. in `app/providers.tsx`)
 * to ensure all custom renderers are available before the builder renders.
 */

type RequireContext = {
  keys: () => string[];
  (key: string): unknown;
};

// @ts-expect-error - require.context is a Webpack/Next.js API
const propertiesContext = require.context(
  '../../../widgets',
  true,
  /^\.\/(?:[^/]+\/)?widget-[^/]+\/v\d+\/properties\.(ts|tsx)$/
) as RequireContext;

// Side-effect: importing each file triggers registerFieldRenderer calls
propertiesContext.keys().forEach((key) => {
  try {
    propertiesContext(key);
  } catch (e) {
    console.warn(`[widgetPropertyLoader] Failed to load ${key}:`, e);
  }
});
