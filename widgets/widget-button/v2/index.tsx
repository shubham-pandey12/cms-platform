'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CustomRenderer } from '@/types/renderTemplate';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { executeAction } from '@/lib/actionHandler';
import { Action } from '@/types/cms';
import { getApiCallById } from '@/services/cmsApiService';
import { applyElementStyles } from '@/lib/styleUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import * as LucideIcons from 'lucide-react';
import { Loader2 } from 'lucide-react';

type IconName = keyof typeof LucideIcons;

const variantToStyle = (
  variant: string | undefined,
  theme: { colors: { primary: string; secondary: string; background: string; text: string } }
) => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: theme.colors.secondary,
        color: '#ffffff',
        border: 'none',
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: theme.colors.primary,
        border: `2px solid ${theme.colors.primary}`,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: theme.colors.primary,
        border: 'none',
      };
    case 'destructive':
      return {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
      };
    default:
      return {
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        border: 'none',
      };
  }
};

const sizeStyles: Record<string, { height: string; padding: string; fontSize: string }> = {
  sm: { height: '36px', padding: '0 12px', fontSize: '14px' },
  md: { height: '44px', padding: '0 20px', fontSize: '16px' },
  lg: { height: '52px', padding: '0 28px', fontSize: '18px' },
};

const getIcon = (iconName: string | undefined): React.ComponentType<{ className?: string }> | null => {
  if (!iconName) return null;
  const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];
  return Icon || null;
};

export const ButtonRenderer: CustomRenderer = ({
  config,
  styles,
  theme,
  lang = DEFAULT_LANG,
  actions = {} as Record<string, Action>,
  isPreviewMode = false,
}) => {
  const router = useRouter();
  const text = getLocalizedValue(config.text, lang) || 'Click Me';
  const url = (config.url as string) || '#';
  const variant = (config.variant as string) || 'primary';
  const size = (config.size as string) || 'md';
  const iconName = config.icon as string | undefined;
  const iconPosition = (config.iconPosition as string) || 'left';
  const isLoading = config.isLoading as boolean;
  const openInNewTab = config.openInNewTab as boolean;
  const fullWidth = config.fullWidth as boolean;

  const baseStyle = variantToStyle(variant, theme);
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const Icon = getIcon(iconName);

  const elementStyles = React.useMemo(() => {
    return {
      button: applyElementStyles('button', config, undefined, theme.colors),
      icon: applyElementStyles('icon', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);

  const style = {
    ...baseStyle,
    ...sizeStyle,
    ...elementStyles.button,
    backgroundColor: elementStyles.button.backgroundColor || baseStyle.backgroundColor,
    color: elementStyles.button.color || baseStyle.color,
    border: elementStyles.button.border || baseStyle.border,
    width: fullWidth ? '100%' : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreviewMode) {
      e.preventDefault();
      return;
    }

    if (actions?.onClick) {
      const action = actions.onClick as Action;
      const apiCall = action.type === 'trigger_api' && action.payload.apiCallId
        ? getApiCallById(action.payload.apiCallId)
        : undefined;
      executeAction(action, apiCall, [], router);
      return;
    }

    if (url && url !== '#') {
      if (openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else {
      toast.success(copy.builder.renderers.buttonClicked, { description: copy.builder.renderers.configureUrlInProperties });
    }
  };

  const iconClassName = 'w-5 h-5';

  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className={`${iconClassName} animate-spin`} style={elementStyles.icon} />;
    }
    if (Icon) {
      return <Icon className={iconClassName} style={elementStyles.icon} />;
    }
    return null;
  };

  return (
    <div
      className={fullWidth ? 'w-full' : 'text-center'}
      style={{
        backgroundColor: (styles.backgroundColor as string) || 'transparent',
        padding: {
          none: '0',
          sm: '12px',
          md: '24px',
          lg: '36px',
          xl: '48px',
        }[(styles.padding as string) || 'md'] || '24px',
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      <Button
        onClick={handleClick}
        disabled={isLoading && isPreviewMode}
        className="inline-flex items-center justify-center gap-2"
        style={{
          ...style,
          pointerEvents: isPreviewMode ? 'auto' : 'none',
          cursor: isPreviewMode ? (isLoading ? 'wait' : 'pointer') : 'default',
        }}
      >
        {iconPosition === 'left' && renderIcon()}
        {text}
        {iconPosition === 'right' && renderIcon()}
      </Button>
    </div>
  );
};

export default ButtonRenderer;
