import { createElement, lazy, Suspense, type ComponentPropsWithoutRef } from 'react';
import {
  BarChart,
  Box,
  Columns,
  Edit,
  Grid,
  HelpCircle,
  Home,
  PieChart,
  Rows,
  SortAsc,
  SortDesc,
  Train,
  Trees,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

type DynamicIconLoader = () => Promise<{ default: LucideIcon }>;
type IconProps = ComponentPropsWithoutRef<'svg'> & {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
};

const dynamicIconLoaders = dynamicIconImports as unknown as Record<string, DynamicIconLoader>;

/**
 * Lucide renamed a handful of legacy glyph keys. Keep these aliases so existing
 * widget definitions continue to render without requiring data migrations.
 */
const legacyIconRegistry: Record<string, LucideIcon> = {
  grid: Grid,
  columns: Columns,
  rows: Rows,
  'help-circle': HelpCircle,
  edit: Edit,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  home: Home,
  unlock: Unlock,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  tree: Trees,
  train: Train,
};

const defaultIcon: LucideIcon = Box;
const dynamicIconCache = new Map<string, LucideIcon>();

const normalizeIconName = (iconName: string): string => iconName.trim().toLowerCase();

const resolveDynamicIcon = (iconName: string): LucideIcon | undefined => {
  const cachedIcon = dynamicIconCache.get(iconName);
  if (cachedIcon) {
    return cachedIcon;
  }

  const loader = dynamicIconLoaders[iconName];
  if (!loader) {
    return undefined;
  }

  const LazyIcon = lazy(loader);
  const DynamicIcon = ((props: IconProps) => {
    const FallbackIcon = defaultIcon;

    return createElement(
      Suspense,
      { fallback: createElement(FallbackIcon, props) },
      createElement(LazyIcon, props)
    );
  }) as LucideIcon;

  DynamicIcon.displayName = `DynamicLucideIcon(${iconName})`;
  dynamicIconCache.set(iconName, DynamicIcon);

  return DynamicIcon;
};

export const getIcon = (iconName: string): LucideIcon => {
  const normalizedIconName = normalizeIconName(iconName);
  if (!normalizedIconName) {
    return defaultIcon;
  }

  return (
    legacyIconRegistry[normalizedIconName] ??
    resolveDynamicIcon(normalizedIconName) ??
    defaultIcon
  );
};

export const hasIcon = (iconName: string): boolean => {
  const normalizedIconName = normalizeIconName(iconName);
  if (!normalizedIconName) {
    return false;
  }

  return Boolean(legacyIconRegistry[normalizedIconName] ?? dynamicIconLoaders[normalizedIconName]);
};

export const getAvailableIcons = (): string[] => {
  const uniqueIcons = new Set([
    ...Object.keys(dynamicIconLoaders),
    ...Object.keys(legacyIconRegistry),
  ]);

  return Array.from(uniqueIcons).sort((first, second) => first.localeCompare(second));
};

export const iconRegistry = legacyIconRegistry;
export { defaultIcon };
