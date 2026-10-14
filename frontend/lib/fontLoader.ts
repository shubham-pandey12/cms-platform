// Font Loading Utilities for Data-Driven Theme System
// Generates Google Fonts URLs from theme configuration

import type { FontConfig, ThemeDefinition } from '@/types/cms';

/**
 * Generate Google Fonts URL for a theme
 */
export const generateGoogleFontsUrl = (theme: ThemeDefinition): string => {
  const fonts = new Set<string>();
  
  // Add fonts from theme
  if (theme.fonts.heading) fonts.add(theme.fonts.heading);
  if (theme.fonts.body) fonts.add(theme.fonts.body);
  
  // Add fonts from fontConfig if available
  if (theme.fontConfig) {
    fonts.add(theme.fontConfig.heading.family);
    fonts.add(theme.fontConfig.body.family);
  }
  
  if (fonts.size === 0) return '';
  
  // Build Google Fonts URL
  const fontFamilies = Array.from(fonts).map(font => {
    // Get weights for this font from fontConfig or default
    const weights = theme.fontConfig?.heading.family === font 
      ? theme.fontConfig.heading.weights 
      : theme.fontConfig?.body.family === font 
        ? theme.fontConfig.body.weights 
        : [400, 500, 600, 700];
    
    return `family=${font.replace(/ /g, '+')}:wght@${weights.join(';')}`;
  });
  
  return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
};

/**
 * Generate CSS font-family string with fallbacks
 */
export const getFontFamily = (fontName: string, fallbacks: string[] = []): string => {
  const defaultFallbacks = ['system-ui', '-apple-system', 'sans-serif'];
  const allFallbacks = [...fallbacks, ...defaultFallbacks];
  return `"${fontName}", ${allFallbacks.join(', ')}`;
};

/**
 * Generate font CSS variables for a theme
 */
export const generateFontCssVariables = (theme: ThemeDefinition): Record<string, string> => {
  const headingFallbacks = theme.fontConfig?.heading.fallbacks || [];
  const bodyFallbacks = theme.fontConfig?.body.fallbacks || [];
  
  return {
    '--font-heading': getFontFamily(theme.fonts.heading, headingFallbacks),
    '--font-body': getFontFamily(theme.fonts.body, bodyFallbacks),
  };
};

/**
 * Preload font links for performance
 */
export const generateFontPreloadLinks = (theme: ThemeDefinition): { href: string; as: string; type: string; crossorigin: string }[] => {
  // This would be used by the backend to add preload links
  return [
    {
      href: generateGoogleFontsUrl(theme),
      as: 'style',
      type: 'text/css',
      crossorigin: 'anonymous',
    },
  ];
};
