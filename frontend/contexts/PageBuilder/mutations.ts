/**
 * Pure page-mutation helpers: (page, ...args) => Page.
 * No setState, no API calls. Used by PageBuilder hooks to compute next page state.
 */
import type {
  Page,
  PageSection,
  WidgetInstance,
  WidgetStyles,
  PageLayoutConfig,
  DataBinding,
  Action,
  ResponsiveSpan,
  VisibilityRule,
} from '@/types/cms';
import { normalizeWidgetOrders } from './constants';

function cloneBodyContent(sections: PageSection[]): PageSection[] {
  return sections.map(s => ({
    ...s,
    columns: s.columns.map(c => ({
      ...c,
      widgets: c.widgets.map(w => ({ ...w })),
    })),
  }));
}

/** Add widget to page. If sectionId/columnId omitted, appends to first column of last section (or creates section). */
export function addWidgetToPage(
  page: Page,
  newWidget: WidgetInstance,
  sectionId?: string,
  columnId?: string
): Page {
  const bodyContent = cloneBodyContent(page.bodyContent || []);

  if (sectionId && columnId) {
    const section = bodyContent.find(s => s.id === sectionId);
    const column = section?.columns.find(c => c.id === columnId);
    if (section && column) {
      const w = { ...newWidget, order: column.widgets.length };
      column.widgets.push(w);
      column.widgets = normalizeWidgetOrders(column.widgets);
      return { ...page, bodyContent };
    }
  }
  if (sectionId) {
    const section = bodyContent.find(s => s.id === sectionId);
    const column = section?.columns[0];
    if (section && column) {
      const w = { ...newWidget, order: column.widgets.length };
      column.widgets.push(w);
      column.widgets = normalizeWidgetOrders(column.widgets);
      return { ...page, bodyContent };
    }
  }
  if (bodyContent.length === 0) {
    bodyContent.push({
      id: crypto.randomUUID(),
      type: 'section',
      layout: '1-col',
      styles: {},
      columns: [{
        id: crypto.randomUUID(),
        span: { mobile: 12, tablet: 12, desktop: 12 },
        widgets: [{ ...newWidget, order: 0 }],
      }],
    });
    return { ...page, bodyContent };
  }
  const lastSection = bodyContent[bodyContent.length - 1];
  const column = lastSection.columns[0];
  if (column) {
    const w = { ...newWidget, order: column.widgets.length };
    column.widgets.push(w);
    column.widgets = normalizeWidgetOrders(column.widgets);
  }
  return { ...page, bodyContent };
}

/** Remove widget and drop empty columns/sections. */
export function removeWidgetFromPage(page: Page, widgetInstanceId: string): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const idx = column.widgets.findIndex(w => w.id === widgetInstanceId);
      if (idx !== -1) {
        column.widgets.splice(idx, 1);
        column.widgets = normalizeWidgetOrders(column.widgets);
        const noEmptyColumns = bodyContent.map(s => ({
          ...s,
          columns: s.columns.filter(c => c.widgets.length > 0),
        }));
        const cleaned = noEmptyColumns.filter(s => s.columns.length > 0);
        return { ...page, bodyContent: cleaned };
      }
    }
  }
  return null;
}

/** Update widget config. */
export function updateWidgetConfigInPage(
  page: Page,
  widgetInstanceId: string,
  config: Record<string, unknown>
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetInstanceId);
      if (w) {
        w.config = { ...w.config, ...config };
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Update widget styles. */
export function updateWidgetStylesInPage(
  page: Page,
  widgetInstanceId: string,
  styles: Partial<WidgetStyles>
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetInstanceId);
      if (w) {
        w.styles = { ...w.styles, ...styles };
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Update widget version and optionally its config/styles based on new version defaults. */
export function updateWidgetVersionInPage(
  page: Page,
  widgetInstanceId: string,
  newVersion: string,
  newConfig?: Record<string, unknown>,
  newStyles?: Partial<WidgetStyles>
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetInstanceId);
      if (w) {
        w.widgetVersion = newVersion;
        if (newConfig) {
          w.config = { ...newConfig, ...w.config };
        }
        if (newStyles) {
          w.styles = { ...newStyles, ...w.styles };
        }
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Set widget visibility rules. */
export function updateWidgetVisibilityRulesInPage(
  page: Page,
  widgetInstanceId: string,
  rules: VisibilityRule[]
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetInstanceId);
      if (w) {
        w.visibilityRules = rules;
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Toggle widget isVisible. */
export function toggleWidgetVisibilityInPage(page: Page, widgetInstanceId: string): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetInstanceId);
      if (w) {
        w.isVisible = !w.isVisible;
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Duplicate widget in same column (caller provides new widget with new id). */
export function duplicateWidgetInPage(
  page: Page,
  widgetInstanceId: string,
  newWidget: WidgetInstance
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const idx = column.widgets.findIndex(w => w.id === widgetInstanceId);
      if (idx !== -1) {
        newWidget.order = column.widgets.length;
        column.widgets.push(newWidget);
        column.widgets = normalizeWidgetOrders(column.widgets);
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

/** Move widget up in column. */
export function moveWidgetUpInPage(
  page: Page,
  widgetInstanceId: string,
  sectionId: string,
  columnId: string
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  const section = bodyContent.find(s => s.id === sectionId);
  const column = section?.columns.find(c => c.id === columnId);
  if (!section || !column) return null;
  const widgets = [...column.widgets].sort((a, b) => a.order - b.order);
  const i = widgets.findIndex(w => w.id === widgetInstanceId);
  if (i <= 0) return null;
  [widgets[i - 1], widgets[i]] = [widgets[i], widgets[i - 1]];
  column.widgets = normalizeWidgetOrders(widgets);
  return { ...page, bodyContent };
}

/** Move widget down in column. */
export function moveWidgetDownInPage(
  page: Page,
  widgetInstanceId: string,
  sectionId: string,
  columnId: string
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  const section = bodyContent.find(s => s.id === sectionId);
  const column = section?.columns.find(c => c.id === columnId);
  if (!section || !column) return null;
  const widgets = [...column.widgets].sort((a, b) => a.order - b.order);
  const i = widgets.findIndex(w => w.id === widgetInstanceId);
  if (i < 0 || i >= widgets.length - 1) return null;
  [widgets[i], widgets[i + 1]] = [widgets[i + 1], widgets[i]];
  column.widgets = normalizeWidgetOrders(widgets);
  return { ...page, bodyContent };
}

/** Reorder widgets in column; activeId/overId may have "widget-" prefix. */
export function reorderWidgetsInColumnInPage(
  page: Page,
  sectionId: string,
  columnId: string,
  activeId: string,
  overId: string
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  const section = bodyContent.find(s => s.id === sectionId);
  const column = section?.columns.find(c => c.id === columnId);
  if (!section || !column) return null;
  const aid = String(activeId).replace('widget-', '');
  const oid = String(overId).replace('widget-', '');
  const widgets = [...column.widgets].sort((a, b) => a.order - b.order);
  const ai = widgets.findIndex(w => w.id === aid);
  const oi = widgets.findIndex(w => w.id === oid);
  if (ai === -1 || oi === -1 || ai === oi) return null;
  const [removed] = widgets.splice(ai, 1);
  widgets.splice(oi, 0, removed);
  // Reassign order by current index; do not sort by order (would undo the reorder).
  column.widgets = widgets.map((w, i) => ({ ...w, order: i }));
  return { ...page, bodyContent };
}

/** Move widget to another column (caller must remove from source first or we do both). */
export function moveWidgetToColumnInPage(
  page: Page,
  widgetId: string,
  targetSectionId: string,
  targetColumnId: string,
  targetPosition?: number
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  let widget: WidgetInstance | undefined;
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const idx = column.widgets.findIndex(w => w.id === widgetId);
      if (idx !== -1) {
        widget = column.widgets[idx];
        column.widgets.splice(idx, 1);
        column.widgets = normalizeWidgetOrders(column.widgets);
        break;
      }
    }
    if (widget) break;
  }
  if (!widget) return null;
  for (const section of bodyContent) {
    if (section.id === targetSectionId) {
      for (const column of section.columns) {
        if (column.id === targetColumnId) {
          const sorted = [...column.widgets].sort((a, b) => a.order - b.order);
          if (targetPosition !== undefined && targetPosition >= 0 && targetPosition <= sorted.length) {
            sorted.splice(targetPosition, 0, widget);
          } else {
            sorted.push(widget);
          }
          column.widgets = normalizeWidgetOrders(sorted);
          return { ...page, bodyContent };
        }
      }
      break;
    }
  }
  return null;
}

// --- Sections ---

/** Add section (caller provides newSection with ids). */
export function addSectionToPage(
  page: Page,
  newSection: PageSection,
  afterSectionId?: string
): Page {
  const bodyContent = [...(page.bodyContent || [])];
  if (afterSectionId) {
    const idx = bodyContent.findIndex(s => s.id === afterSectionId);
    if (idx !== -1) bodyContent.splice(idx + 1, 0, newSection);
    else bodyContent.push(newSection);
  } else {
    bodyContent.push(newSection);
  }
  return { ...page, bodyContent };
}

/** Remove section. */
export function removeSectionFromPage(page: Page, sectionId: string): Page {
  const bodyContent = (page.bodyContent || []).filter(s => s.id !== sectionId);
  return { ...page, bodyContent };
}

/** Update section layout. */
export function updateSectionLayoutInPage(
  page: Page,
  sectionId: string,
  layout: PageSection['layout']
): Page {
  const bodyContent = (page.bodyContent || []).map(s =>
    s.id === sectionId ? { ...s, layout } : s
  );
  return { ...page, bodyContent };
}

/** Update section styles. */
export function updateSectionStylesInPage(
  page: Page,
  sectionId: string,
  styles: Partial<PageSection['styles']>
): Page {
  const bodyContent = (page.bodyContent || []).map(s =>
    s.id === sectionId ? { ...s, styles: { ...s.styles, ...styles } } : s
  );
  return { ...page, bodyContent };
}

/** Move section to targetIndex. */
export function moveSectionInPage(page: Page, sectionId: string, targetIndex: number): Page | null {
  const bodyContent = [...(page.bodyContent || [])];
  const idx = bodyContent.findIndex(s => s.id === sectionId);
  if (idx === -1) return null;
  const [section] = bodyContent.splice(idx, 1);
  bodyContent.splice(targetIndex, 0, section);
  return { ...page, bodyContent };
}

// --- Columns ---

/** Add column to section (caller provides newColumn with id). */
export function addColumnToPage(
  page: Page,
  sectionId: string,
  newColumn: { id: string; span: ResponsiveSpan; widgets: WidgetInstance[] }
): Page {
  const bodyContent = (page.bodyContent || []).map(section => {
    if (section.id !== sectionId) return section;
    const validColumns = (section.columns || []).map(col => ({
      ...col,
      span: {
        mobile: Math.max(1, Math.min(12, col.span.mobile || 12)),
        tablet: Math.max(1, Math.min(12, col.span.tablet ?? col.span.mobile ?? 12)),
        desktop: Math.max(1, Math.min(12, col.span.desktop ?? col.span.tablet ?? col.span.mobile ?? 12)),
      },
    }));
    const totalSpan = validColumns.reduce((sum, col) => sum + col.span.desktop, 0);
    const remaining = Math.max(0, 12 - totalSpan);
    if (remaining <= 0) return section;
    const adjustedSpan: ResponsiveSpan = {
      mobile: newColumn.span.mobile,
      tablet: newColumn.span.tablet,
      desktop: Math.max(1, Math.min(newColumn.span.desktop, remaining, 12)),
    };
    return {
      ...section,
      columns: [...validColumns, { ...newColumn, span: adjustedSpan }],
    };
  });
  return { ...page, bodyContent };
}

/** Remove column. */
export function removeColumnFromPage(page: Page, sectionId: string, columnId: string): Page {
  const bodyContent = (page.bodyContent || []).map(section =>
    section.id === sectionId
      ? { ...section, columns: section.columns.filter(c => c.id !== columnId) }
      : section
  );
  return { ...page, bodyContent };
}

/** Update column span (only if total desktop span stays <= 12). */
export function updateColumnSpanInPage(
  page: Page,
  sectionId: string,
  columnId: string,
  span: ResponsiveSpan
): Page {
  const validSpan: ResponsiveSpan = {
    mobile: Math.max(1, Math.min(12, span.mobile)),
    tablet: Math.max(1, Math.min(12, span.tablet)),
    desktop: Math.max(1, Math.min(12, span.desktop)),
  };
  const bodyContent = (page.bodyContent || []).map(section => {
    if (section.id !== sectionId) return section;
    const currentTotal = (section.columns || []).reduce((sum, col) => {
      if (col.id === columnId) return sum + validSpan.desktop;
      return sum + (col.span?.desktop ?? 0);
    }, 0);
    if (currentTotal > 12) return section;
    return {
      ...section,
      columns: (section.columns || []).map(col =>
        col.id === columnId ? { ...col, span: validSpan } : col
      ),
    };
  });
  return { ...page, bodyContent };
}

// --- Data bindings ---

export function addDataBindingToPage(page: Page, widgetId: string, binding: DataBinding): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w) {
        w.dataBindings = [...(w.dataBindings || []), binding];
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

export function removeDataBindingFromPage(page: Page, widgetId: string, bindingId: string): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w?.dataBindings) {
        w.dataBindings = w.dataBindings.filter(b => b.id !== bindingId);
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

export function updateDataBindingInPage(
  page: Page,
  widgetId: string,
  bindingId: string,
  updates: Partial<DataBinding>
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w?.dataBindings) {
        const i = w.dataBindings.findIndex(b => b.id === bindingId);
        if (i !== -1) {
          w.dataBindings[i] = { ...w.dataBindings[i], ...updates };
          return { ...page, bodyContent };
        }
      }
    }
  }
  return null;
}

// --- Actions ---

export function addActionToPage(
  page: Page,
  widgetId: string,
  actionName: string,
  action: Action
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w) {
        w.actions = { ...(w.actions || {}), [actionName]: action };
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

export function removeActionFromPage(page: Page, widgetId: string, actionName: string): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w?.actions) {
        const { [actionName]: _, ...rest } = w.actions;
        w.actions = rest;
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

export function updateActionInPage(
  page: Page,
  widgetId: string,
  actionName: string,
  updates: Partial<Action>
): Page | null {
  const bodyContent = cloneBodyContent(page.bodyContent || []);
  for (const section of bodyContent) {
    for (const column of section.columns) {
      const w = column.widgets.find(w => w.id === widgetId);
      if (w?.actions?.[actionName]) {
        w.actions[actionName] = { ...w.actions[actionName], ...updates };
        return { ...page, bodyContent };
      }
    }
  }
  return null;
}

// --- Page-level ---

export function updatePageLayoutConfigInPage(page: Page, layoutConfig: PageLayoutConfig): Page {
  return { ...page, layoutConfig };
}

export function updatePageCssInPage(page: Page, customCss: string): Page {
  return { ...page, customCss };
}

export function updatePageSeoInPage(page: Page, seoUpdates: Partial<Page['seo']>): Page {
  return { ...page, seo: { ...page.seo, ...seoUpdates } };
}

export function updatePageNameInPage(page: Page, name: string): Page {
  return { ...page, name };
}

export function updatePageUriInPage(page: Page, uri: string): Page {
  const matches = uri.match(/<([A-Z_]+)>/g);
  const dynamicVariables = matches ? matches.map(m => m.replace(/<|>/g, '')) : [];
  const isDynamic = dynamicVariables.length > 0;
  return { ...page, uri, isDynamic, dynamicVariables };
}

export function updatePageStatusInPage(page: Page, status: Page['status']): Page {
  return { ...page, status };
}

export function updatePageDynamicVariablesInPage(page: Page, variables: string[]): Page {
  return { ...page, dynamicVariables: variables, isDynamic: variables.length > 0 };
}
