import type React from 'react';
import type { WidgetFieldRendererProps } from '@/components/builder/properties/types';
import type { Condition } from '@/types/cms';

type FieldRendererComponent = React.FC<WidgetFieldRendererProps>;
type ConditionOperatorFn = (lhs: unknown, rhs: unknown, ctx: Record<string, unknown>) => boolean;

/**
 * Central registry for custom field renderers and condition operators.
 *
 * Widget packages can call `widgetPropertyRegistry.registerFieldRenderer` in their
 * `properties.ts` entry file to add fully custom editors without touching core CMS code.
 *
 * Example:
 * ```ts
 * // widgets/acme/widget-fancy-card/v1/properties.ts
 * import { widgetPropertyRegistry } from '@/lib/widgetPropertyRegistry';
 * import { FancyColorField } from './FancyColorField';
 *
 * widgetPropertyRegistry.registerFieldRenderer('acme.fancyColor', FancyColorField);
 * ```
 *
 * Then in the widget's configSchema:
 * ```json
 * { "name": "accentColor", "label": "Accent", "type": "color", "component": "acme.fancyColor" }
 * ```
 */
class WidgetPropertyRegistry {
  private readonly renderers = new Map<string, FieldRendererComponent>();
  private readonly operators = new Map<string, ConditionOperatorFn>();

  registerFieldRenderer(key: string, renderer: FieldRendererComponent): void {
    this.renderers.set(key, renderer);
  }

  getFieldRenderer(key: string): FieldRendererComponent | undefined {
    return this.renderers.get(key);
  }

  /**
   * Register a custom condition operator for use in `visibleWhen` / `disabledWhen`.
   * The key must not clash with built-in operators: eq, neq, in, nin, truthy, falsy, regex, gt, lt.
   */
  registerConditionOperator(op: string, fn: ConditionOperatorFn): void {
    this.operators.set(op, fn);
  }

  getConditionOperator(op: string): ConditionOperatorFn | undefined {
    return this.operators.get(op);
  }

  /** Returns all registered field renderer keys (useful for debugging). */
  listRenderers(): string[] {
    return Array.from(this.renderers.keys());
  }
}

export const widgetPropertyRegistry = new WidgetPropertyRegistry();

// Re-export Condition so widget properties.ts files can type their schemas
export type { Condition };
