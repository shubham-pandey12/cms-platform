import type { SystemStyleConfig, SystemConfigDto, WidgetCategoryDefinition, WidgetStyles } from '@/types/cms';
import { getApiBaseUrl } from '../apiClient';

const defaultSystemStyleConfig: SystemStyleConfig = {
  spacing: {
    padding: { none: '0', sm: '16px', md: '32px', lg: '48px', xl: '64px' },
    margin: { none: '0', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    borderRadius: { none: '0', sm: '4px', md: '8px', lg: '16px', xl: '24px' },
    gap: { none: '0', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
};

const defaultWidgetCategories: WidgetCategoryDefinition[] = [
  { id: 'layout', name: 'Layout', icon: 'layout-grid', description: 'Structure and layout components', order: 1 },
  { id: 'content', name: 'Content', icon: 'type', description: 'Text and content blocks', order: 2 },
  { id: 'media', name: 'Media', icon: 'image', description: 'Images, videos, and galleries', order: 3 },
  {
    id: 'interactive',
    name: 'Interactive',
    icon: 'mouse-pointer-click',
    description: 'Forms, buttons, and actions',
    order: 4,
  },
  { id: 'navigation', name: 'Navigation', icon: 'menu', description: 'Menus and navigation elements', order: 5 },
];

export async function getSystemStyleConfig(): Promise<SystemStyleConfig> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/system/config`);
    if (response.ok) {
      const data: SystemConfigDto = await response.json();
      return { spacing: data.spacing, shadows: data.shadows };
    }
    return defaultSystemStyleConfig;
  } catch (error) {
    console.error('Failed to get system config, using defaults:', error);
    return defaultSystemStyleConfig;
  }
}

export async function getWidgetCategories(): Promise<WidgetCategoryDefinition[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/system/config`);
    if (response.ok) {
      const data: SystemConfigDto = await response.json();
      return data.widgetCategories || defaultWidgetCategories;
    }
    return defaultWidgetCategories;
  } catch (error) {
    console.error('Failed to get widget categories, using defaults:', error);
    return defaultWidgetCategories;
  }
}

export const defaultWidgetStyles: WidgetStyles = {
  backgroundColor: 'transparent',
  textColor: '',
  padding: 'md',
  margin: 'none',
  borderRadius: 0,
  borderWidth: 0,
  borderColor: 'transparent',
  shadow: 'none',
  opacity: 100,
};
