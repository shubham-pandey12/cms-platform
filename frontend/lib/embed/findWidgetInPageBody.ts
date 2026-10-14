import type { Page, WidgetInstance } from '@/types/cms';

/**
 * Finds a widget instance in published page body (sections → columns → widgets).
 * Does not search site layout header/footer.
 */
export function findWidgetInPageBody(page: Page, widgetInstanceId: string): WidgetInstance | undefined {
  for (const section of page.bodyContent ?? []) {
    for (const column of section.columns ?? []) {
      for (const widget of column.widgets ?? []) {
        if (widget?.id === widgetInstanceId) {
          return widget;
        }
      }
    }
  }
  return undefined;
}
