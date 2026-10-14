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

const variantToStyle = (
  variant: string | undefined,
  theme: { colors: { primary: string; secondary: string; background: string } }
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
    default:
      return {
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        border: 'none',
      };
  }
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

  const baseStyle = variantToStyle(variant, theme);

  const elementStyles = React.useMemo(() => {
    return {
      button: applyElementStyles('button', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);

  const style = {
    ...baseStyle,
    ...elementStyles.button,
    backgroundColor: elementStyles.button.backgroundColor || baseStyle.backgroundColor,
    color: elementStyles.button.color || baseStyle.color,
    border: elementStyles.button.border || baseStyle.border,
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
      window.open(url, '_blank');
    } else {
      toast.success(copy.builder.renderers.buttonClicked, { description: copy.builder.renderers.configureUrlInProperties });
    }
  };

  return (
    <div
      className="text-center"
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
        className="min-h-[44px] px-6"
        style={{
          ...style,
          pointerEvents: isPreviewMode ? 'auto' : 'none',
          cursor: isPreviewMode ? 'pointer' : 'default',
        }}
      >
        {text}
      </Button>
    </div>
  );
};

export default ButtonRenderer;
