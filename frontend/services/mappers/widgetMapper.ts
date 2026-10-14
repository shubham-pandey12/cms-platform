import type {
  WidgetConfigSchema,
  WidgetDefinition,
  WidgetDefinitionVersion,
  WidgetDto,
  WidgetStyles,
  WidgetVersionDto,
} from '@/types/cms';
import { parseJson } from './utils';

export function mapWidgetDtoToWidgetDefinition(dto: WidgetDto): WidgetDefinition {
  let configSchema = parseJson<WidgetConfigSchema>(dto.configSchema) ?? { fields: [] };
  let defaultConfig = parseJson<Record<string, unknown>>(dto.defaultConfig) ?? {};

  const categoryMap: Record<number, WidgetDefinition['category']> = {
    0: 'layout',
    1: 'content',
    2: 'media',
    3: 'interactive',
    4: 'navigation',
  };

  const categoryFromString = (value: string): WidgetDefinition['category'] | undefined => {
    const key = value.trim().toLowerCase();
    const byName: Record<string, WidgetDefinition['category']> = {
      layout: 'layout',
      content: 'content',
      media: 'media',
      interactive: 'interactive',
      navigation: 'navigation',
    };
    return byName[key];
  };

  const normalizeCategory = (): WidgetDefinition['category'] => {
    const raw = dto.category;
    if (typeof raw === 'number') {
      return categoryMap[raw] ?? 'content';
    }
    const asString = categoryFromString(String(raw));
    if (asString) return asString;
    const asNum = Number(raw);
    if (!Number.isNaN(asNum)) {
      return categoryMap[asNum] ?? 'content';
    }
    return 'content';
  };

  if (configSchema.fields && Array.isArray(configSchema.fields)) {
    configSchema.fields.forEach((field) => {
      if (field.type === 'array' && !field.arrayItemSchema) {
        const arrayData = defaultConfig[field.name];
        if (Array.isArray(arrayData) && arrayData.length > 0) {
          const firstItem = arrayData[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            (field as { arrayItemSchema?: unknown }).arrayItemSchema = Object.keys(firstItem).map((key) => {
              const value = (firstItem as Record<string, unknown>)[key];
              let fieldType: string = 'text';
              if (typeof value === 'boolean') fieldType = 'toggle';
              else if (typeof value === 'number') fieldType = 'number';
              else if (typeof value === 'string')
                fieldType = (value as string).length > 100 ? 'textarea' : 'text';
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
              return { name: key, label, type: fieldType, required: false };
            });
          }
        }
      }
    });
  }

  let defaultStyles: WidgetStyles | undefined;
  if (dto.defaultStyles) {
    const raw =
      typeof dto.defaultStyles === 'string' ? parseJson<Record<string, unknown>>(dto.defaultStyles) : dto.defaultStyles;
    const normalizeSpacing = (value: unknown): WidgetStyles['padding'] =>
      value === 'none' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl' ? value : undefined;
    if (raw) {
      defaultStyles = {
        ...raw,
        padding: normalizeSpacing(raw.padding),
        margin: normalizeSpacing(raw.margin),
      } as WidgetStyles;
    }
  }

  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    category: normalizeCategory(),
    description: dto.description,
    icon: dto.icon,
    version: dto.version,
    thumbnail: dto.thumbnail,
    configSchema: configSchema as WidgetConfigSchema,
    defaultConfig,
    defaultStyles,
    isAdvanced: dto.isAdvanced,
    supportsHtmlEmbed: dto.supportsHtmlEmbed ?? false,
    brandIds: dto.brandIds,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export function mapWidgetVersionDtoToWidgetDefinitionVersion(dto: WidgetVersionDto): WidgetDefinitionVersion {
  let configSchema = parseJson<WidgetConfigSchema>(dto.configSchema) ?? { fields: [] };
  let defaultConfig = parseJson<Record<string, unknown>>(dto.defaultConfig) ?? {};

  if (configSchema.fields && Array.isArray(configSchema.fields)) {
    configSchema.fields.forEach((field) => {
      if (field.type === 'array' && !field.arrayItemSchema) {
        const arrayData = defaultConfig[field.name];
        if (Array.isArray(arrayData) && arrayData.length > 0) {
          const firstItem = arrayData[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            (field as { arrayItemSchema?: unknown }).arrayItemSchema = Object.keys(firstItem).map((key) => {
              const value = (firstItem as Record<string, unknown>)[key];
              let fieldType: string = 'text';
              if (typeof value === 'boolean') fieldType = 'toggle';
              else if (typeof value === 'number') fieldType = 'number';
              else if (typeof value === 'string')
                fieldType = (value as string).length > 100 ? 'textarea' : 'text';
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
              return { name: key, label, type: fieldType, required: false };
            });
          }
        }
      }
    });
  }

  let defaultStyles: WidgetStyles | undefined;
  if (dto.defaultStyles) {
    const raw =
      typeof dto.defaultStyles === 'string' ? parseJson<Record<string, unknown>>(dto.defaultStyles) : dto.defaultStyles;
    const normalizeSpacing = (value: unknown): WidgetStyles['padding'] =>
      value === 'none' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl' ? value : undefined;
    if (raw) {
      defaultStyles = {
        ...raw,
        padding: normalizeSpacing(raw.padding),
        margin: normalizeSpacing(raw.margin),
      } as WidgetStyles;
    }
  }

  return {
    id: dto.id,
    slug: dto.slug,
    version: dto.version,
    name: dto.name,
    description: dto.description,
    configSchema: configSchema as WidgetConfigSchema,
    defaultConfig,
    defaultStyles,
    changeLog: dto.changeLog,
    isLatest: dto.isLatest,
    isDeprecated: dto.isDeprecated,
    createdAt: new Date(dto.createdAt),
  };
}
