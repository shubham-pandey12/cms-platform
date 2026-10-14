import type { WidgetCategory } from '@/types/cms';

export type TabType = 'insert' | 'pages' | 'themes';

/** Insert sidebar: CMS categories plus brand-scoped vs universal splits (Wix-style grouping). */
export type InsertNavId = 'all' | 'advanced' | WidgetCategory | 'brand' | 'universal';
