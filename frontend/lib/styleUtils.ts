// Centralized Style Utilities for Data-Driven Widget Rendering

export const spacingConfig = {
  padding: { none: '0', sm: '16px', md: '32px', lg: '48px', xl: '64px' },
  margin: { none: '0', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  borderRadius: { none: '0', sm: '4px', md: '8px', lg: '16px', xl: '24px' },
  gap: { none: '0', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
};

export const shadowConfig = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

export const getPadding = (size: string | undefined = 'md'): string => {
  if (!size) return spacingConfig.padding.md;
  return spacingConfig.padding[size as keyof typeof spacingConfig.padding] || spacingConfig.padding.md;
};

export const getMargin = (size: string | undefined = 'none'): string => {
  if (!size) return spacingConfig.margin.none;
  return spacingConfig.margin[size as keyof typeof spacingConfig.margin] || spacingConfig.margin.none;
};

export const getShadow = (size: string | undefined = 'none'): string => {
  if (!size) return shadowConfig.none;
  return shadowConfig[size as keyof typeof shadowConfig] || shadowConfig.none;
};

/**
 * Merge default styles with instance styles
 * Ensures consistent style merging pattern across all renderers
 */
export const mergeStyles = <T extends Record<string, unknown>>(
  defaultStyles: Partial<T> | undefined,
  instanceStyles: Partial<T> | undefined
): Partial<T> => {
  return {
    ...(defaultStyles || {}),
    ...(instanceStyles || {}),
  } as Partial<T>;
};

/**
 * Get style value with fallback
 */
export const getStyleValue = <T>(
  value: T | undefined,
  fallback: T
): T => {
  return value !== undefined && value !== null ? value : fallback;
};

// Responsive utilities
import type { ResponsiveSpan, ResponsiveSpacing } from '@/types/cms';

/**
 * Get responsive padding values
 * Supports both old format (string) and new responsive format
 */
export const getResponsivePadding = (
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing | undefined
): { mobile: string; tablet: string; desktop: string } => {
  if (!padding) {
    return {
      mobile: spacingConfig.padding.md,
      tablet: spacingConfig.padding.md,
      desktop: spacingConfig.padding.md,
    };
  }

  // Handle old string format
  if (typeof padding === 'string') {
    const value = spacingConfig.padding[padding] || spacingConfig.padding.md;
    return {
      mobile: value,
      tablet: value,
      desktop: value,
    };
  }

  // Handle responsive format
  return {
    mobile: spacingConfig.padding[padding.mobile || 'md'] || spacingConfig.padding.md,
    tablet: spacingConfig.padding[padding.tablet || padding.mobile || 'md'] || spacingConfig.padding.md,
    desktop: spacingConfig.padding[padding.desktop || padding.tablet || padding.mobile || 'md'] || spacingConfig.padding.md,
  };
};

/**
 * Get responsive margin values
 * Supports both old format (string) and new responsive format
 */
export const getResponsiveMargin = (
  margin: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing | undefined
): { mobile: string; tablet: string; desktop: string } => {
  if (!margin) {
    return {
      mobile: spacingConfig.margin.none,
      tablet: spacingConfig.margin.none,
      desktop: spacingConfig.margin.none,
    };
  }

  // Handle old string format
  if (typeof margin === 'string') {
    const value = spacingConfig.margin[margin] || spacingConfig.margin.none;
    return {
      mobile: value,
      tablet: value,
      desktop: value,
    };
  }

  // Handle responsive format
  return {
    mobile: spacingConfig.margin[margin.mobile || 'none'] || spacingConfig.margin.none,
    tablet: spacingConfig.margin[margin.tablet || margin.mobile || 'none'] || spacingConfig.margin.none,
    desktop: spacingConfig.margin[margin.desktop || margin.tablet || margin.mobile || 'none'] || spacingConfig.margin.none,
  };
};

/**
 * Generate Tailwind classes for responsive column spans
 * Returns classes like: "col-span-12 md:col-span-6 lg:col-span-4"
 */
export const getResponsiveSpanClasses = (span: ResponsiveSpan): string => {
  const mobile = Math.max(1, Math.min(12, span.mobile || 12));
  const tablet = Math.max(1, Math.min(12, span.tablet || span.mobile || 12));
  const desktop = Math.max(1, Math.min(12, span.desktop || span.tablet || span.mobile || 12));

  return `col-span-${mobile} md:col-span-${tablet} lg:col-span-${desktop}`;
};

/**
 * Get inline styles for responsive padding (for CSS-in-JS approach)
 */
export const getResponsivePaddingStyles = (
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing | undefined
): React.CSSProperties => {
  const values = getResponsivePadding(padding);
  return {
    padding: values.mobile,
    '@media (min-width: 768px)': {
      padding: values.tablet,
    },
    '@media (min-width: 1024px)': {
      padding: values.desktop,
    },
  } as React.CSSProperties;
};

/**
 * Get inline styles for responsive margin (for CSS-in-JS approach)
 */
export const getResponsiveMarginStyles = (
  margin: 'none' | 'sm' | 'md' | 'lg' | 'xl' | ResponsiveSpacing | undefined
): React.CSSProperties => {
  const values = getResponsiveMargin(margin);
  return {
    margin: values.mobile,
    '@media (min-width: 768px)': {
      margin: values.tablet,
    },
    '@media (min-width: 1024px)': {
      margin: values.desktop,
    },
  } as React.CSSProperties;
};

/**
 * Apply element-level styles from widget config
 * Merges default styles, config styles, and theme colors
 * 
 * @param elementName - Name of the styleable element (e.g., "title", "primaryButton")
 * @param config - Widget config object that may contain elementStyles
 * @param defaultStyles - Optional default styles for the element
 * @param themeColors - Optional theme colors to use as fallbacks
 * @returns React.CSSProperties object with merged styles
 */
export const applyElementStyles = (
  elementName: string,
  config: Record<string, unknown>,
  defaultStyles?: Record<string, string>,
  themeColors?: { primary?: string; secondary?: string; accent?: string; text?: string }
): React.CSSProperties => {
  const elementStyles = (config.elementStyles as Record<string, Record<string, string>> | undefined)?.[elementName];
  
  // Start with default styles
  const merged: Record<string, string> = { ...(defaultStyles || {}) };
  
  // Apply config styles (overrides defaults)
  if (elementStyles) {
    Object.assign(merged, elementStyles);
  }
  
  // Convert to React.CSSProperties, handling common CSS properties
  const cssProperties: React.CSSProperties = {};
  
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    
    // Convert camelCase to kebab-case for CSS properties
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Validate and sanitize CSS values
    // Basic validation: ensure no script injection
    if (typeof value === 'string' && !value.includes('javascript:') && !value.includes('expression(')) {
      // Handle common CSS properties
      switch (key) {
        case 'color':
          cssProperties.color = value;
          break;
        case 'backgroundColor':
          cssProperties.backgroundColor = value;
          break;
        case 'borderColor':
          cssProperties.borderColor = value;
          break;
        case 'fontSize':
          // Ensure fontSize has units if it's a number
          cssProperties.fontSize = /^\d+$/.test(value) ? `${value}px` : value;
          break;
        case 'fontWeight':
          cssProperties.fontWeight = value as React.CSSProperties['fontWeight'];
          break;
        case 'padding':
          cssProperties.padding = value;
          break;
        case 'margin':
          cssProperties.margin = value;
          break;
        case 'borderRadius':
          cssProperties.borderRadius = /^\d+$/.test(value) ? `${value}px` : (value as React.CSSProperties['borderRadius']);
          break;
        case 'borderWidth':
          cssProperties.borderWidth = /^\d+$/.test(value) ? `${value}px` : value;
          break;
        case 'opacity':
          const opacityNum = parseFloat(value);
          if (!isNaN(opacityNum) && opacityNum >= 0 && opacityNum <= 1) {
            cssProperties.opacity = opacityNum;
          }
          break;
        default:
          // For other properties, use the camelCase key directly
          (cssProperties as Record<string, string>)[key] = value;
      }
    }
  }
  
  return cssProperties;
};
