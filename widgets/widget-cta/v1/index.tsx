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

export const CtaRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG, actions = {}, isPreviewMode = false }) => {
  const router = useRouter();
  const handleCtaClick = (e: React.MouseEvent) => {
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

    const ctaUrl = (config.buttonUrl as string) || (config.ctaUrl as string);
    if (ctaUrl) {
      window.open(ctaUrl, '_blank');
    } else {
      toast.success(copy.builder.renderers.ctaClicked, { description: copy.builder.renderers.configureUrlInProperties });
    }
  };

  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const textColor = (styles.textColor as string) || '';
  const padding = {
    none: '0',
    sm: '16px',
    md: '32px',
    lg: '48px',
    xl: '64px',
  }[(styles.padding as string) || 'md'] || '32px';

  const elementStyles = React.useMemo(() => {
    return {
      heading: applyElementStyles('heading', config, undefined, theme.colors),
      description: applyElementStyles('description', config, undefined, theme.colors),
      button: applyElementStyles('button', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);
  
  return (
    <div 
      className="text-center"
      style={{ 
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.primary,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      <div className="w-full max-w-full md:max-w-2xl md:mx-auto px-4 md:px-6">
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4"
          style={{ 
            ...elementStyles.heading,
            color: elementStyles.heading.color || textColor || '#ffffff', 
            fontFamily: theme.fonts.heading 
          }}
        >
          {getLocalizedValue(config.heading, lang) || 'Ready to get started?'}
        </h2>
        <p 
          className="text-base md:text-lg mb-6 md:mb-8" 
          style={{ 
            ...elementStyles.description,
            color: elementStyles.description.color || (textColor ? `${textColor}dd` : 'rgba(255,255,255,0.85)') 
          }}
        >
          {getLocalizedValue(config.description, lang) || 'Join thousands of satisfied customers today.'}
        </p>
        <Button 
          size="lg" 
          onClick={handleCtaClick}
          className="min-h-[44px] text-sm md:text-base px-6 md:px-8"
          style={{ 
            ...elementStyles.button,
            backgroundColor: elementStyles.button.backgroundColor || '#ffffff',
            color: elementStyles.button.color || theme.colors.primary,
            pointerEvents: isPreviewMode ? 'auto' : 'none',
            cursor: isPreviewMode ? 'pointer' : 'default',
          }}
        >
          {getLocalizedValue(config.buttonText, lang) || 'Contact Us'}
        </Button>
      </div>
    </div>
  );
};

export default CtaRenderer;
