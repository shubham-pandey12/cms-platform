import type { ThemeConfig } from '@/contexts/PageBuilderContext';
import type { ApiCall, StyleableElement, WidgetConfigField, WidgetDefinition } from '@/types/cms';

export type WidgetConfigRecord = Record<string, unknown>;

/** How localized text fields are displayed in the properties panel. Persisted in localStorage. */
export type LocalizedTextViewMode = 'tabbed' | 'stacked' | 'dropdown';

export const LOCALIZED_TEXT_VIEW_STORAGE_KEY = 'cms.localizedTextView';
export type SiteLayoutSection = 'header' | 'footer' | null;

export interface PaddingOption {
  value: string;
  label: string;
  px: string;
}

export interface PropertiesHeaderProps {
  isSiteLayoutWidget: boolean;
  widgetSection: SiteLayoutSection;
  widgetSlug: string;
  widgetName: string;
  widgetVersion: string;
  onBack: () => void;
  onDuplicate: () => void;
  onVersionChange?: (newVersion: string) => void;
}

export interface PropertiesFooterProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export interface WidgetFieldRendererProps {
  field: WidgetConfigField;
  value: unknown;
  onConfigChange: (fieldName: string, value: unknown) => void;
  onOpenMediaLibrary: (fieldName: string) => void;
  /** Language codes for localizedText fields (from Site Settings). Fallback: field.langs ?? supportedLangs ?? default locale (e.g. en-GB). */
  supportedLangs?: string[];
  /** How to display localizedText fields: tabbed, stacked, or dropdown. */
  localizedTextView?: LocalizedTextViewMode;
  /** Page API calls — used by data-binding field to build dynamic source list. */
  apiCalls?: ApiCall[];
}

export interface PropertiesContentTabProps {
  widgetDef: WidgetDefinition;
  config: WidgetConfigRecord;
  onConfigChange: (fieldName: string, value: unknown) => void;
  onOpenMediaLibrary: (fieldName: string) => void;
  /** Language codes for localizedText fields (from Site Settings). */
  supportedLangs?: string[];
  /** Dynamic variable names for the current page (e.g. ['SUMMER']). Used to show auto-pass UI. */
  dynamicVariables?: string[];
  /** Filter string for field search. Fields whose label/name/helpText don't match are hidden. */
  fieldSearch?: string;
  /** Widget's default config — used to show dirty/reset per field. */
  defaultConfig?: Record<string, unknown>;
  /** Page API calls — forwarded to data-binding fields. */
  apiCalls?: ApiCall[];
}

export interface ElementStylesEditorProps {
  styleableElements: StyleableElement[];
  config: WidgetConfigRecord;
  activeTheme: ThemeConfig;
  onConfigChange: (fieldName: string, value: unknown) => void;
}

export interface PropertiesStyleTabProps {
  config: WidgetConfigRecord;
  styles: WidgetConfigRecord;
  activeTheme: ThemeConfig;
  styleableElements?: StyleableElement[];
  onConfigChange: (fieldName: string, value: unknown) => void;
  onStyleChange: (styleName: string, value: unknown) => void;
  paddingOptions: PaddingOption[];
  /** Brand-level saved colour swatches to show in the background palette. */
  savedColors?: string[];
}
