import type { ThemeDefinition, WidgetInstance } from '@/types/cms';
import type { ThemeConfig } from './types';

/** Convert ThemeDefinition (API) to ThemeConfig (context). */
export function themeToConfig(theme: ThemeDefinition): ThemeConfig {
  return {
    id: theme.id,
    name: theme.name,
    colors: theme.colors,
    fonts: theme.fonts,
  };
}

/** Default theme fallback when no theme is loaded. */
export const defaultThemeConfig: ThemeConfig = {
  id: 'theme-default',
  name: 'Default',
  colors: {
    primary: '#0891b2',
    secondary: '#164e63',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#f59e0b',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
};

/** Normalize widget order values: sort by order then reassign 0, 1, 2, ... */
export function normalizeWidgetOrders(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets
    .sort((a, b) => a.order - b.order)
    .map((widget, index) => ({ ...widget, order: index }));
}
