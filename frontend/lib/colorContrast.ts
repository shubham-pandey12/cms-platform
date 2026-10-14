/**
 * Color contrast utilities for WCAG 2.1 AA compliance
 * Ensures minimum contrast ratios for text and UI components
 */

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance according to WCAG
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    return 1; // Invalid colors, return minimum contrast
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 * - UI components: 3:1
 */
export const meetsWCAGAA = (
  foreground: string,
  background: string,
  type: 'normal-text' | 'large-text' | 'ui-component' = 'normal-text'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  switch (type) {
    case 'normal-text':
      return ratio >= 4.5;
    case 'large-text':
    case 'ui-component':
      return ratio >= 3;
    default:
      return false;
  }
};

/**
 * Check if contrast ratio meets WCAG AAA standards
 * - Normal text: 7:1
 * - Large text: 4.5:1
 */
export const meetsWCAGAAA = (
  foreground: string,
  background: string,
  type: 'normal-text' | 'large-text' = 'normal-text'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  switch (type) {
    case 'normal-text':
      return ratio >= 7;
    case 'large-text':
      return ratio >= 4.5;
    default:
      return false;
  }
};

/**
 * Find a color that meets contrast requirements
 * Adjusts brightness to achieve target contrast
 */
export const adjustForContrast = (
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string => {
  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;
  
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return foreground;
  
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Calculate target luminance
  const targetLum = bgLum > 0.5 
    ? (bgLum + 0.05) / targetRatio - 0.05  // Darker foreground
    : (bgLum + 0.05) * targetRatio - 0.05; // Lighter foreground
  
  // Clamp target luminance
  const clampedLum = Math.max(0, Math.min(1, targetLum));
  
  // Simple adjustment: make darker or lighter
  const isDark = bgLum > 0.5;
  const factor = isDark ? 0.3 : 0.7; // Darken or lighten
  
  const adjustedR = Math.round(rgb.r * factor);
  const adjustedG = Math.round(rgb.g * factor);
  const adjustedB = Math.round(rgb.b * factor);
  
  return `#${[adjustedR, adjustedG, adjustedB]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')}`;
};

/**
 * Validate color combination and return suggestions if invalid
 */
export const validateColorContrast = (
  foreground: string,
  background: string,
  type: 'normal-text' | 'large-text' | 'ui-component' = 'normal-text'
): {
  valid: boolean;
  ratio: number;
  required: number;
  suggestion?: string;
} => {
  const ratio = getContrastRatio(foreground, background);
  const required = type === 'normal-text' ? 4.5 : 3;
  const valid = ratio >= required;
  
  return {
    valid,
    ratio: Math.round(ratio * 100) / 100,
    required,
    suggestion: valid ? undefined : adjustForContrast(foreground, background, required),
  };
};
