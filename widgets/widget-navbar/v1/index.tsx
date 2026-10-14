'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomRenderer } from '@/types/renderTemplate';
import { Button } from '@/components/ui/button';
import { Search, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { Input } from '@/components/ui/input';
import { executeAction } from '@/lib/actionHandler';
import { Action } from '@/types/cms';
import { getApiCallById } from '@/services/cmsApiService';
import { handlePreviewNavigation, isInPreviewViewer } from '@/lib/navigationUtils';
import { applyElementStyles } from '@/lib/styleUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

export const NavbarRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG, actions = {}, isPreviewMode = false, pageId }) => {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inPreviewViewer, setInPreviewViewer] = useState(false);
  
  useEffect(() => {
    setInPreviewViewer(isInPreviewViewer());
  }, []);
  
  const getBrandId = (): string | undefined => {
    if (inPreviewViewer && typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/preview\/([^/]+)/);
      return pathMatch ? pathMatch[1] : undefined;
    }
    return undefined;
  };

  const navMenuItems = Array.isArray(config.menuItems) 
    ? (config.menuItems as Array<{ id: string; label: string; url: string; target?: string }>)
    : ((config.menuItems as string) || 'Home, About, Services, Contact').split(',').map((s, i) => ({ 
        id: `menu-${i}`, 
        label: s.trim(), 
        url: '#',
        target: '_self'
      }));

  const handleNavClick = (e: React.MouseEvent, item: { label: string; url: string; target?: string }) => {
    if (!isPreviewMode) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    if (item.url && item.url !== '#') {
      if (inPreviewViewer) {
        handlePreviewNavigation(item.url, item.target || '_self', router);
      } else {
        window.open(item.url, item.target || '_blank');
      }
    } else {
      toast.info(`Navigating to ${item.label}`, { description: copy.builder.renderers.configureUrlInProperties });
    }
  };

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

    const ctaUrl = config.ctaUrl as string;
    if (ctaUrl) {
      window.open(ctaUrl, '_blank');
    } else {
      toast.success(copy.builder.renderers.ctaClicked, { description: copy.builder.renderers.configureUrlInProperties });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPreviewMode) {
      return;
    }
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`, { description: copy.builder.renderers.searchPreview });
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleSearchToggle = (e: React.MouseEvent) => {
    if (!isPreviewMode) {
      e.preventDefault();
      return;
    }
    setShowSearch(!showSearch);
  };

  const handleMobileMenuToggle = (e: React.MouseEvent) => {
    if (!isPreviewMode) {
      e.preventDefault();
      return;
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const elementStyles = React.useMemo(() => {
    return {
      logo: applyElementStyles('logo', config, undefined, theme.colors),
      logoText: applyElementStyles('logoText', config, undefined, theme.colors),
      menuItem: applyElementStyles('menuItem', config, undefined, theme.colors),
      ctaButton: applyElementStyles('ctaButton', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);
  
  return (
    <div 
      className={cn("flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b relative", config.sticky && "sticky top-0 z-50")}
      style={{ 
        backgroundColor: config.transparent ? 'transparent' : theme.colors.background,
        borderColor: 'rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        {(config.logoUrl as string) ? (
          <Image
            src={config.logoUrl as string}
            alt={getLocalizedValue(config.logoText, lang) || 'Logo'}
            width={160}
            height={32}
            className="h-6 md:h-8 w-auto object-contain"
            unoptimized
          />
        ) : (
          <div 
            className="w-6 h-6 md:w-8 md:h-8 rounded-full" 
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}
        <span 
          className="text-sm md:text-base font-semibold"
          style={{ 
            ...elementStyles.logoText,
            color: elementStyles.logoText.color || theme.colors.text, 
            fontFamily: theme.fonts.heading 
          }}
        >
          {getLocalizedValue(config.logoText, lang) || 'Site Name'}
        </span>
      </div>
      
      <nav className="hidden md:flex items-center gap-4 lg:gap-6">
        {navMenuItems.map((item) => {
          const href = inPreviewViewer && item.url && item.url !== '#' 
            ? (item.url.startsWith('/') ? `/preview/${window.location.pathname.split('/')[2]}${item.url}` : item.url)
            : item.url;
          
          return (
            <a 
              key={item.id}
              href={href}
              target={item.target || '_self'}
              className="text-sm transition-opacity hover:opacity-80 min-h-[44px] flex items-center"
              style={{ 
                ...elementStyles.menuItem,
                color: elementStyles.menuItem.color || theme.colors.text,
                cursor: isPreviewMode ? 'pointer' : 'default',
                pointerEvents: isPreviewMode ? 'auto' : 'none',
              }}
              onClick={(e) => handleNavClick(e, item)}
            >
              {getLocalizedValue(item.label, lang) || 'Menu Item'}
            </a>
          );
        })}
        {config.showSearch && (
          <div className="relative">
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-8 w-40"
                  autoFocus
                  disabled={!isPreviewMode}
                  style={{
                    pointerEvents: isPreviewMode ? 'auto' : 'none',
                    cursor: isPreviewMode ? 'text' : 'default',
                  }}
                />
                <X 
                  className="w-4 h-4 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center" 
                  style={{ 
                    color: theme.colors.text,
                    cursor: isPreviewMode ? 'pointer' : 'default',
                    pointerEvents: isPreviewMode ? 'auto' : 'none',
                  }}
                  onClick={handleSearchToggle}
                />
              </form>
            ) : (
              <Search 
                className="w-4 h-4 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" 
                style={{ 
                  color: theme.colors.text,
                  cursor: isPreviewMode ? 'pointer' : 'default',
                  pointerEvents: isPreviewMode ? 'auto' : 'none',
                }}
                onClick={handleSearchToggle}
              />
            )}
          </div>
        )}
        {config.ctaButton && (
          <Button 
            size="sm"
            onClick={handleCtaClick}
            className="min-h-[44px]"
            style={{ 
              ...elementStyles.ctaButton,
              backgroundColor: elementStyles.ctaButton.backgroundColor || theme.colors.primary,
              color: elementStyles.ctaButton.color || '#ffffff',
              pointerEvents: isPreviewMode ? 'auto' : 'none',
              cursor: isPreviewMode ? 'pointer' : 'default',
            }}
          >
            {(config.ctaText as string) || 'Get Started'}
          </Button>
        )}
      </nav>

      <button
        onClick={handleMobileMenuToggle}
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        style={{
          color: theme.colors.text,
          cursor: isPreviewMode ? 'pointer' : 'default',
          pointerEvents: isPreviewMode ? 'auto' : 'none',
        }}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {mobileMenuOpen && (
        <div 
          className="absolute top-full left-0 right-0 md:hidden border-b shadow-lg"
          style={{ 
            backgroundColor: theme.colors.background,
            borderColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <nav className="flex flex-col p-4 gap-2">
            {navMenuItems.map((item) => {
              const href = inPreviewViewer && item.url && item.url !== '#' 
                ? (item.url.startsWith('/') ? `/preview/${window.location.pathname.split('/')[2]}${item.url}` : item.url)
                : item.url;
              
              return (
                <a 
                  key={item.id}
                  href={href}
                  target={item.target || '_self'}
                  className="text-sm py-3 px-4 transition-opacity hover:opacity-80 min-h-[44px] flex items-center rounded-md hover:bg-opacity-10"
                  style={{ 
                    ...elementStyles.menuItem,
                    color: elementStyles.menuItem.color || theme.colors.text,
                    cursor: isPreviewMode ? 'pointer' : 'default',
                    pointerEvents: isPreviewMode ? 'auto' : 'none',
                    backgroundColor: elementStyles.menuItem.backgroundColor || 'rgba(0,0,0,0.02)',
                  }}
                  onClick={(e) => {
                    handleNavClick(e, item);
                    setMobileMenuOpen(false);
                  }}
                >
                  {getLocalizedValue(item.label, lang) || 'Menu Item'}
                </a>
              );
            })}
            {config.showSearch && (
              <div className="pt-2">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="h-10 flex-1"
                    autoFocus
                    disabled={!isPreviewMode}
                    style={{
                      pointerEvents: isPreviewMode ? 'auto' : 'none',
                      cursor: isPreviewMode ? 'text' : 'default',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchToggle}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{
                      color: theme.colors.text,
                      cursor: isPreviewMode ? 'pointer' : 'default',
                      pointerEvents: isPreviewMode ? 'auto' : 'none',
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
            {config.ctaButton && (
              <Button 
                size="sm"
                onClick={(e) => {
                  handleCtaClick(e);
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] mt-2"
                style={{ 
                  ...elementStyles.ctaButton,
                  backgroundColor: elementStyles.ctaButton.backgroundColor || theme.colors.primary,
                  color: elementStyles.ctaButton.color || '#ffffff',
                  pointerEvents: isPreviewMode ? 'auto' : 'none',
                  cursor: isPreviewMode ? 'pointer' : 'default',
                }}
              >
                {(config.ctaText as string) || 'Get Started'}
              </Button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
};

export default NavbarRenderer;
