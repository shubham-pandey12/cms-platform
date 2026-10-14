'use client';

import React, { useState, useEffect } from 'react';
import { CustomRenderer } from '@/types/renderTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { getPadding, applyElementStyles } from '@/lib/styleUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

export const NewsletterPopupRenderer: CustomRenderer = ({ 
  config, 
  styles, 
  theme, 
  lang = DEFAULT_LANG,
  actions = {}, 
  isPreviewMode = false,
  widgetId = 'newsletter-popup'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = getLocalizedValue(config.title, lang) || 'Subscribe to Our Newsletter';
  const description = getLocalizedValue(config.description, lang) || 'Get the latest updates and exclusive offers delivered to your inbox';
  const placeholder = getLocalizedValue(config.placeholder, lang) || 'Enter your email';
  const namePlaceholder = getLocalizedValue(config.namePlaceholder, lang) || 'Enter your name';
  const buttonText = getLocalizedValue(config.buttonText, lang) || 'Subscribe';
  const closeText = getLocalizedValue(config.closeText, lang) || 'No thanks';
  const triggerDelay = (config.triggerDelay as number) || 5;
  const showOnce = (config.showOnce as boolean) ?? true;
  const enableCloseButton = (config.enableCloseButton as boolean) ?? true;
  const collectName = (config.collectName as boolean) ?? false;
  const successMessage = getLocalizedValue(config.successMessage, lang) || 'Thanks for subscribing!';
  const errorMessage = getLocalizedValue(config.errorMessage, lang) || 'Something went wrong. Please try again.';
  const submittingText = getLocalizedValue(config.submittingText, lang) || 'Subscribing...';

  useEffect(() => {
    if (!isPreviewMode) return;
    
    const storageKey = `newsletter-popup-${widgetId}-shown`;
    const alreadyShown = sessionStorage.getItem(storageKey);
    
    if (showOnce && alreadyShown) return;
    
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (showOnce) {
        sessionStorage.setItem(storageKey, 'true');
      }
    }, triggerDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [isPreviewMode, triggerDelay, showOnce, widgetId]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPreviewMode) return;

    if (!email || !validateEmail(email)) {
      toast.error(copy.builder.renderers.invalidEmail, {
        description: copy.builder.renderers.invalidEmailDescription,
      });
      return;
    }

    if (collectName && !name) {
      toast.error(copy.builder.renderers.nameRequired, {
        description: copy.builder.renderers.nameRequiredDescription,
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        console.log('Newsletter subscription:', { 
          email, 
          name: collectName ? name : undefined,
          endpoint: config.endpoint 
        });

        toast.success(successMessage, {
          description: formatCopy(copy.builder.renderers.updatesAtEmail, { email }),
        });

        setEmail('');
        setName('');
        setIsOpen(false);
      } catch (error) {
        toast.error(errorMessage, {
          description: copy.builder.renderers.tryAgainLater,
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleClose = () => {
    if (enableCloseButton || !isPreviewMode) {
      setIsOpen(false);
    }
  };

  const bgColor = (styles.backgroundColor as string) || theme.colors.background;
  const textColor = (styles.textColor as string) || theme.colors.text;
  const borderRadius = (styles.borderRadius as number) || 8;
  const opacity = ((styles.opacity as number) ?? 100) / 100;

  const elementStyles = React.useMemo(() => {
    return {
      title: applyElementStyles('title', config, undefined, theme.colors),
      description: applyElementStyles('description', config, undefined, theme.colors),
      subscribeButton: applyElementStyles('subscribeButton', config, undefined, theme.colors),
      closeButton: applyElementStyles('closeButton', config, undefined, theme.colors),
      input: applyElementStyles('input', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);

  if (!isPreviewMode) {
    return (
      <div 
        className="p-8 border-2 border-dashed rounded-lg text-center"
        style={{
          backgroundColor: `${theme.colors.primary}10`,
          borderColor: theme.colors.primary,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">📧</div>
          <h3 className="font-semibold" style={{ color: theme.colors.text }}>
            Newsletter Popup Widget
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This popup will appear after {triggerDelay} seconds in preview mode.
            Configure settings in the properties panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`sm:max-w-[500px] ${!enableCloseButton ? '[&>button[data-radix-dialog-close]]:hidden' : ''}`}
        style={{
          backgroundColor: bgColor,
          borderRadius: `${borderRadius}px`,
          opacity,
        }}
      >

        <DialogHeader>
          <DialogTitle 
            className="text-xl md:text-2xl font-bold"
            style={{ 
              ...elementStyles.title,
              color: elementStyles.title.color || textColor,
              fontFamily: theme.fonts.heading,
            }}
          >
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription 
              className="text-sm md:text-base"
              style={{ 
                ...elementStyles.description,
                color: elementStyles.description.color || `${textColor}dd`,
                fontFamily: theme.fonts.body,
              }}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 py-2 md:py-4">
          {collectName && (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={collectName}
                disabled={isSubmitting}
                className="min-h-[44px] text-sm md:text-base"
                style={{ 
                  ...elementStyles.input,
                  borderColor: elementStyles.input.borderColor || 'rgba(0,0,0,0.15)',
                  color: elementStyles.input.color || textColor,
                }}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="min-h-[44px] text-sm md:text-base"
              style={{ 
                ...elementStyles.input,
                borderColor: elementStyles.input.borderColor || 'rgba(0,0,0,0.15)',
                color: elementStyles.input.color || textColor,
              }}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {enableCloseButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] text-sm md:text-base"
                style={{
                  ...elementStyles.closeButton,
                  color: elementStyles.closeButton.color || textColor,
                  borderColor: elementStyles.closeButton.borderColor || `${textColor}30`,
                  backgroundColor: elementStyles.closeButton.backgroundColor || 'transparent',
                }}
              >
                {closeText}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] text-sm md:text-base"
              style={{
                ...elementStyles.subscribeButton,
                backgroundColor: elementStyles.subscribeButton.backgroundColor || theme.colors.primary,
                color: elementStyles.subscribeButton.color || '#ffffff',
              }}
            >
              {isSubmitting ? submittingText : buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterPopupRenderer;
