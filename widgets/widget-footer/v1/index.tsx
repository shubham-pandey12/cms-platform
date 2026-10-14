'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomRenderer } from '@/types/renderTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { handlePreviewNavigation, isInPreviewViewer } from '@/lib/navigationUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

export const FooterRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG, isPreviewMode = false }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inPreviewViewer, setInPreviewViewer] = useState(false);
  
  useEffect(() => {
    setInPreviewViewer(isInPreviewViewer());
  }, []);

  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const padding = {
    none: '0',
    sm: '16px',
    md: '32px',
    lg: '48px',
    xl: '64px',
  }[(styles.padding as string) || 'md'] || '32px';
  
  const footerLinks = Array.isArray(config.footerLinks) 
    ? (config.footerLinks as Array<{ id: string; title: string; links: string }>)
    : [];
  
  const socialLinks = Array.isArray(config.socialLinks)
    ? (config.socialLinks as Array<{ id: string; platform: string; url: string }>)
    : [];

  const parseFooterLinks = (linksStr: string) => {
    return linksStr.split(',').map(link => {
      const [label, url] = link.split(':');
      return { label: label?.trim() || '', url: url?.trim() || '#' };
    }).filter(l => l.label);
  };

  return (
    <div style={{ 
      backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.secondary,
      padding,
      borderRadius: `${styles.borderRadius || 0}px`,
      opacity: ((styles.opacity as number) ?? 100) / 100,
    }}>
      <div className="w-full max-w-full md:max-w-5xl md:mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm">
          <div>
            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: theme.fonts.heading }}>
              {getLocalizedValue(config.brandName ?? config.companyName, lang) || 'Company'}
            </h4>
            <p className="text-white/60 text-sm">
              {getLocalizedValue(config.companyDescription, lang) || 'Your trusted partner.'}
            </p>
          </div>

          {footerLinks.map((col) => (
            <div key={col.id}>
              <h4 className="font-semibold text-white mb-4" style={{ fontFamily: theme.fonts.heading }}>
                {getLocalizedValue(col.title, lang) || 'Links'}
              </h4>
              <div className="space-y-2 text-white/60">
                {parseFooterLinks(col.links || '').map((link, i) => (
                  <a 
                    key={i}
                    href={link.url}
                    className={cn("block transition-colors min-h-[44px] flex items-center", isPreviewMode && "hover:text-white cursor-pointer")}
                    style={{
                      pointerEvents: isPreviewMode ? 'auto' : 'none',
                      cursor: isPreviewMode ? 'pointer' : 'default',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isPreviewMode) {
                        return;
                      }
                      if (link.url && link.url !== '#') {
                        if (inPreviewViewer) {
                          handlePreviewNavigation(link.url, '_self', router);
                        } else {
                          window.open(link.url, '_blank');
                        }
                      } else {
                        toast.info(`Navigating to ${link.label}`);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
          {config.showSocial && socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.id}
                  href={social.url}
                  className={cn("text-white/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", isPreviewMode && "hover:text-white cursor-pointer")}
                  style={{
                    pointerEvents: isPreviewMode ? 'auto' : 'none',
                    cursor: isPreviewMode ? 'pointer' : 'default',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isPreviewMode) {
                      return;
                    }
                    if (social.url && social.url !== '#') {
                      window.open(social.url, '_blank');
                    } else {
                      toast.info(`Opening ${social.platform}`, { description: copy.builder.renderers.configureUrlInProperties });
                    }
                  }}
                >
                  {social.platform === 'facebook' && '𝕗'}
                  {social.platform === 'twitter' && '𝕏'}
                  {social.platform === 'instagram' && '📷'}
                  {social.platform === 'linkedin' && 'in'}
                  {social.platform === 'youtube' && '▶'}
                </a>
              ))}
            </div>
          )}

          {config.showNewsletter && (
            <form 
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isPreviewMode) {
                  return;
                }
                if (email.trim()) {
                  toast.success(copy.builder.renderers.subscribed, {
                    description: formatCopy(copy.builder.renderers.emailAddedToNewsletter, { email }),
                  });
                  setEmail('');
                } else {
                  toast.error(copy.builder.renderers.pleaseEnterEmail);
                }
              }}
            >
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getLocalizedValue(config.newsletterPlaceholder, lang) || 'Enter your email'}
                className="h-9 w-48 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                disabled={!isPreviewMode}
              />
              <Button
                type="submit"
                size="sm"
                className="min-h-[44px]"
                disabled={!isPreviewMode}
                style={{ 
                  backgroundColor: theme.colors.primary,
                  pointerEvents: isPreviewMode ? 'auto' : 'none',
                  cursor: isPreviewMode ? 'pointer' : 'default',
                }}
              >
                {getLocalizedValue(config.newsletterButtonText, lang) || 'Subscribe'}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-white/50 text-sm">
          {getLocalizedValue(config.copyrightText, lang) || '© 2024 Your Company. All rights reserved.'}
        </div>
      </div>
    </div>
  );
};

export default FooterRenderer;
