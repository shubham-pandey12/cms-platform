import React from 'react';
import { applyElementStyles, mergeStyles } from '@/lib/styleUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import type { WidgetDefinition, WidgetInstance } from '@/types/cms';

export type EmbedTheme = {
  colors: { primary: string; secondary: string; background: string; text: string; accent: string };
  fonts: { heading: string; body: string };
};

export type EmbedRendererProps = {
  config: Record<string, unknown>;
  styles: Record<string, unknown>;
  theme: EmbedTheme;
  lang: string;
};

const paddingMap: Record<string, string> = {
  none: '0',
  sm: '16px',
  md: '32px',
  lg: '48px',
  xl: '64px',
};

const buttonPaddingMap: Record<string, string> = {
  none: '0',
  sm: '12px',
  md: '24px',
  lg: '36px',
  xl: '48px',
};

function variantToButtonColors(
  variant: string | undefined,
  theme: EmbedTheme['colors']
): { backgroundColor: string; color: string; border: string } {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: theme.secondary, color: '#ffffff', border: 'none' };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: theme.primary,
        border: `2px solid ${theme.primary}`,
      };
    default:
      return { backgroundColor: theme.primary, color: '#ffffff', border: 'none' };
  }
}

/** Root wrapper with theme CSS variables for inlined embed HTML. */
export function EmbedThemeRoot({
  theme,
  children,
}: {
  theme: EmbedTheme;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={
        {
          '--theme-primary': theme.colors.primary,
          '--theme-secondary': theme.colors.secondary,
          '--theme-background': theme.colors.background,
          '--theme-text': theme.colors.text,
          '--theme-accent': theme.colors.accent,
          '--theme-font-heading': theme.fonts.heading,
          '--theme-font-body': theme.fonts.body,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function WidgetCtaEmbed({ config, styles, theme, lang }: EmbedRendererProps): React.ReactElement {
  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const textColor = (styles.textColor as string) || '';
  const padding = paddingMap[(styles.padding as string) || 'md'] || '32px';
  const elementStyles = {
    heading: applyElementStyles('heading', config, undefined, theme.colors),
    description: applyElementStyles('description', config, undefined, theme.colors),
    button: applyElementStyles('button', config, undefined, theme.colors),
  };

  const heading =
    getLocalizedValue(config.heading, lang) || 'Ready to get started?';
  const description =
    getLocalizedValue(config.description, lang) || 'Join thousands of satisfied customers today.';
  const buttonText = getLocalizedValue(config.buttonText, lang) || 'Contact Us';
  const ctaUrl = ((config.buttonUrl as string) || (config.ctaUrl as string) || '').trim();
  const safeUrl =
    ctaUrl && (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://') || ctaUrl.startsWith('/'))
      ? ctaUrl
      : undefined;

  const buttonStyle: React.CSSProperties = {
    ...elementStyles.button,
    backgroundColor: elementStyles.button.backgroundColor || '#ffffff',
    color: elementStyles.button.color || theme.colors.primary,
    display: 'inline-block',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontFamily: theme.fonts.body,
  };

  return (
    <section
      className="mcms-embed-widget-cta"
      style={{
        textAlign: 'center',
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.primary,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 16px' }}>
        <h2
          style={{
            ...elementStyles.heading,
            color: elementStyles.heading.color || textColor || '#ffffff',
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 700,
            margin: '0 0 12px 0',
          }}
        >
          {heading}
        </h2>
        <p
          style={{
            ...elementStyles.description,
            color:
              elementStyles.description.color ||
              (textColor ? `${textColor}dd` : 'rgba(255,255,255,0.85)'),
            fontSize: '1.125rem',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
        {safeUrl ? (
          <a href={safeUrl} style={buttonStyle}>
            {buttonText}
          </a>
        ) : (
          <span style={buttonStyle}>{buttonText}</span>
        )}
      </div>
    </section>
  );
}

/** Matches widgets/widget-form/v1 field shape for SSR markup only. */
type FormEmbedField = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: string;
};

const defaultFormFields: FormEmbedField[] = [
  { id: 'field-1', name: 'name', label: 'Your Name', type: 'text', placeholder: 'Enter your name', required: true },
  { id: 'field-2', name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email', required: true },
  { id: 'field-3', name: 'message', label: 'Your Message', type: 'textarea', placeholder: 'Enter your message', required: true },
];

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '1rem',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.15)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

function WidgetFormEmbed({ config, styles, theme, lang }: EmbedRendererProps): React.ReactElement {
  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const textColor = (styles.textColor as string) || theme.colors.text;
  const padding = paddingMap[(styles.padding as string) || 'md'] || '32px';

  const rawFields = (config.fields as FormEmbedField[] | undefined) || defaultFormFields;
  const fields = rawFields.map((field, index) => ({
    ...field,
    id: field.id || `field-${index + 1}`,
  }));

  const action =
    ((config.submitEndpoint as string) || (config.endpoint as string) || '/api/contact').trim() || '/api/contact';
  const method = ((config.method as string) || 'POST').toUpperCase() === 'GET' ? 'get' : 'post';

  const title = getLocalizedValue(config.title, lang) || 'Contact Us';
  const submitText = getLocalizedValue(config.submitText, lang) || 'Send Message';

  const renderField = (field: FormEmbedField) => {
    const labelText = getLocalizedValue(field.label, lang);
    const placeholder = getLocalizedValue(field.placeholder, lang);

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            key={field.id}
            id={field.id}
            name={field.name}
            required={field.required}
            placeholder={placeholder}
            rows={4}
            style={{ ...inputBaseStyle, minHeight: '100px', resize: 'vertical' as const }}
            aria-required={field.required || undefined}
          />
        );
      case 'select': {
        const options = field.options?.split(',').map((o) => o.trim()).filter(Boolean) || [];
        return (
          <select
            key={field.id}
            id={field.id}
            name={field.name}
            required={field.required}
            style={{ ...inputBaseStyle, minHeight: '44px', backgroundColor: theme.colors.background }}
            aria-required={field.required || undefined}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
      case 'checkbox':
        return (
          <div key={field.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minHeight: 44 }}>
            <input
              id={field.id}
              name={field.name}
              type="checkbox"
              value="true"
              required={field.required}
              style={{ width: 20, height: 20, marginTop: 2 }}
              aria-required={field.required || undefined}
            />
            <label htmlFor={field.id} style={{ fontSize: '0.875rem', color: textColor, flex: 1 }}>
              {labelText}
              {field.required ? <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span> : null}
            </label>
          </div>
        );
      default:
        return (
          <input
            key={field.id}
            id={field.id}
            name={field.name}
            type={field.type}
            required={field.required}
            placeholder={placeholder}
            style={{ ...inputBaseStyle, minHeight: 44 }}
            aria-required={field.required || undefined}
          />
        );
    }
  };

  return (
    <section
      className="mcms-embed-widget-form"
      style={{
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
        color: textColor,
      }}
    >
      <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '0 16px' }}>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            fontWeight: 700,
            textAlign: 'center',
            margin: '0 0 24px 0',
            color: textColor,
          }}
        >
          {title}
        </h2>
        <form
          method={method}
          action={action}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          aria-label={title}
        >
          {fields.map((field) => (
            <div key={field.id}>
              {field.type !== 'checkbox' && (
                <label
                  htmlFor={field.id}
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: 8,
                    color: textColor,
                  }}
                >
                  {getLocalizedValue(field.label, lang)}
                  {field.required ? (
                    <span style={{ color: '#ef4444', marginLeft: 4 }} aria-label="Required">
                      *
                    </span>
                  ) : null}
                </label>
              )}
              {renderField(field)}
            </div>
          ))}
          <button
            type="submit"
            style={{
              width: '100%',
              minHeight: 44,
              padding: '12px 16px',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: theme.fonts.body,
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {submitText}
          </button>
        </form>
      </div>
    </section>
  );
}

function WidgetButtonEmbed({ config, styles, theme, lang }: EmbedRendererProps): React.ReactElement {
  const text = getLocalizedValue(config.text, lang) || 'Click Me';
  const url = ((config.url as string) || '').trim();
  const variant = (config.variant as string) || 'primary';
  const baseStyle = variantToButtonColors(variant, theme.colors);
  const elementStyles = {
    button: applyElementStyles('button', config, undefined, theme.colors),
  };
  const padding = buttonPaddingMap[(styles.padding as string) || 'md'] || '24px';

  const merged: React.CSSProperties = {
    ...baseStyle,
    ...elementStyles.button,
    backgroundColor: elementStyles.button.backgroundColor || baseStyle.backgroundColor,
    color: elementStyles.button.color || baseStyle.color,
    border: elementStyles.button.border || baseStyle.border,
    display: 'inline-block',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontFamily: theme.fonts.body,
    minHeight: 44,
  };

  const safeUrl =
    url && url !== '#' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))
      ? url
      : undefined;

  return (
    <div
      className="mcms-embed-widget-button"
      style={{
        textAlign: 'center',
        backgroundColor: (styles.backgroundColor as string) || 'transparent',
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      {safeUrl ? (
        <a href={safeUrl} style={merged}>
          {text}
        </a>
      ) : (
        <span style={merged}>{text}</span>
      )}
    </div>
  );
}

const slugToComponent: Record<string, React.FC<EmbedRendererProps>> = {
  'widget-cta': WidgetCtaEmbed,
  'widget-button': WidgetButtonEmbed,
  'widget-form': WidgetFormEmbed,
};

export function getEmbedRenderer(slug: string): React.FC<EmbedRendererProps> | null {
  return slugToComponent[slug] ?? null;
}

/** Merges definition + instance styles the same way as published preview widgets. */
export function mergeEmbedWidgetStyles(
  widgetDefinition: WidgetDefinition | undefined,
  widgetInstance: WidgetInstance
): Record<string, unknown> {
  return mergeStyles(
    widgetDefinition?.defaultStyles as Record<string, unknown> | undefined,
    widgetInstance.styles as Record<string, unknown> | undefined
  ) as Record<string, unknown>;
}

export { DEFAULT_LANG as EMBED_DEFAULT_LANG };
