// Render Template Types for Data-Driven Widget Rendering

export interface RenderTemplate {
  type: 'container' | 'section' | 'list' | 'custom';
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
  style?: Record<string, string | number>;
  children?: RenderNode[];
  customRenderer?: string; // Reference to custom renderer for complex widgets
}

export interface RenderNode {
  type: 'text' | 'heading' | 'paragraph' | 'image' | 'button' | 'container' | 'div' | 'list' | 'link' | 'input' | 'icon' | 'badge' | 'grid' | 'flex' | 'video';
  // Template bindings using {{config.fieldName}} or {{theme.colors.primary}}
  content?: string;         // For text: "{{config.title}}"
  src?: string;             // For image: "{{config.backgroundImage}}"
  href?: string;            // For link/button
  alt?: string;             // For image alt text
  style?: Record<string, string | number>;
  className?: string;
  condition?: string;       // Show/hide: "{{config.showCta}}"
  repeat?: string;          // For lists: "{{config.menuItems}}"
  repeatAs?: string;        // Variable name for each item: "item"
  children?: RenderNode[];
  // Heading specific
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  // Grid specific
  columns?: number | string;
  gap?: string;
  // Icon specific
  iconName?: string;
  iconSize?: number;
  // Button specific
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// Context passed to the renderer
export interface RenderContext {
  config: Record<string, unknown>;
  styles: Record<string, unknown>;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  };
  /** Current language for resolving localized config (e.g. 'en-GB', 'fr-FR'). */
  lang: string;
  // For repeat iterations
  item?: unknown;
  index?: number;
}

// Type for custom renderer functions
export type CustomRenderer = React.FC<{
  config: Record<string, unknown>;
  styles: Record<string, unknown>;
  theme: RenderContext['theme'];
  widgetId: string;
  /** Current language for resolving localized config (e.g. 'en-GB', 'fr-FR'). */
  lang?: string;
  actions?: Record<string, import('@/types/cms').Action>;
  isPreviewMode?: boolean;
  pageId?: string;
  /**
   * Route params extracted from the current dynamic URL pattern
   * (e.g. { SUMMER: 'summer' } for a page with URI /holidays/<SUMMER>).
   * Widgets that have `autoPassRouteParams: true` in their config use this
   * to append matching query params to `apiEndpoint` fetches automatically.
   */
  routeParams?: Record<string, string>;
}>;
