'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brand, ThemeDefinition } from '@/types/cms';
import { createBrand, getThemes, checkBrandAvailability } from '@/services/cmsApiService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Palette, Settings, Info } from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandCreated?: (brand: Brand) => void;
}

export const CreateBrandDialog: React.FC<CreateBrandDialogProps> = ({
  open,
  onOpenChange,
  onBrandCreated,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0891b2');
  const [secondaryColor, setSecondaryColor] = useState('#164e63');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [favicon, setFavicon] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [showNavigation, setShowNavigation] = useState(true);
  const [navigationPosition, setNavigationPosition] = useState('top');
  const [navigationStyle, setNavigationStyle] = useState('standard');
  const [showLogo, setShowLogo] = useState(true);
  const [enableSearch, setEnableSearch] = useState(true);
  const [customDomain, setCustomDomain] = useState('');
  
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const availabilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      resetForm();
      loadThemes();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (availabilityDebounceRef.current) clearTimeout(availabilityDebounceRef.current);
    const d = domain.trim();
    const s = subdomain.trim();
    if (!d && !s) {
      setDomainAvailable(null);
      setSubdomainAvailable(null);
      return;
    }
    availabilityDebounceRef.current = setTimeout(() => {
      availabilityDebounceRef.current = null;
      setIsCheckingAvailability(true);
      checkBrandAvailability({ domain: d || null, subdomain: s || null })
        .then((r) => {
          setDomainAvailable(d ? r.domainAvailable : null);
          setSubdomainAvailable(s ? r.subdomainAvailable : null);
        })
        .finally(() => setIsCheckingAvailability(false));
    }, 500);
    return () => {
      if (availabilityDebounceRef.current) clearTimeout(availabilityDebounceRef.current);
    };
  }, [open, domain, subdomain]);

  const loadThemes = async () => {
    setIsLoadingThemes(true);
    try {
      const availableThemes = await getThemes();
      setThemes(availableThemes);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setIsLoadingThemes(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDomain('');
    setSubdomain('');
    setPrimaryColor('#0891b2');
    setSecondaryColor('#164e63');
    setSelectedThemeId('');
    setSiteName('');
    setSiteDescription('');
    setFavicon('');
    setLogoUrl('');
    setShowNavigation(true);
    setNavigationPosition('top');
    setNavigationStyle('standard');
    setShowLogo(true);
    setEnableSearch(true);
    setCustomDomain('');
    setError(null);
    setDomainAvailable(null);
    setSubdomainAvailable(null);
    setActiveTab('basic');
  };

  const validate = (): string | null => {
    if (!name.trim()) return copy.builder.createBrand.validation.nameRequired;
    if (!domain.trim()) return copy.builder.createBrand.validation.domainRequired;
    if (!subdomain.trim()) return copy.builder.createBrand.validation.subdomainRequired;
    if (domainAvailable === false) return copy.builder.createBrand.validation.domainTaken;
    if (subdomainAvailable === false) return copy.builder.createBrand.validation.subdomainTaken;
    if (!primaryColor.trim()) return copy.builder.createBrand.validation.primaryColorRequired;
    if (!HEX_REGEX.test(primaryColor)) return copy.builder.createBrand.validation.primaryColorInvalid;
    if (!secondaryColor.trim()) return copy.builder.createBrand.validation.secondaryColorRequired;
    if (!HEX_REGEX.test(secondaryColor)) return copy.builder.createBrand.validation.secondaryColorInvalid;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      toast.error(validationErr);
      setActiveTab('basic');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const brand = await createBrand({
        name: name.trim(),
        domain: domain.trim(),
        subdomain: subdomain.trim() || null,
        logo: logoUrl.trim() || null,
        primaryColor: primaryColor.trim(),
        secondaryColor: secondaryColor.trim(),
        globalCss: null,
        customFontUrls: [],
        themeId: selectedThemeId || null,
        siteName: siteName.trim() || null,
        siteDescription: siteDescription.trim() || null,
        favicon: favicon.trim() || null,
        logoUrl: logoUrl.trim() || null,
        showNavigation: showNavigation,
        navigationPosition: navigationPosition,
        navigationStyle: navigationStyle,
        showLogo: showLogo,
        enableSearch: enableSearch,
        customDomain: customDomain.trim() || null,
      });

      toast.success(copy.builder.createBrand.toast.success, {
        description: formatCopy(copy.builder.createBrand.toast.successDescription, { name: brand.name }),
      });
      onBrandCreated?.(brand);
      onOpenChange(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.builder.createBrand.toast.createFailed;
      setError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-brand-description">
        <DialogHeader>
          <DialogTitle>{copy.builder.createBrand.title}</DialogTitle>
          <DialogDescription id="create-brand-description">
            {copy.builder.createBrand.description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {copy.builder.createBrand.basicInfo}
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {copy.builder.createBrand.theme}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {copy.builder.createBrand.siteSettings}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand-name">{copy.builder.createBrand.nameLabel}</Label>
                  <Input
                    id="brand-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder={copy.builder.createBrand.namePlaceholder}
                    maxLength={200}
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                  <span className="text-xs text-muted-foreground">{copy.builder.createBrand.nameMaxHint}</span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand-domain">{copy.builder.createBrand.domainLabel}</Label>
                  <Input
                    id="brand-domain"
                    value={domain}
                    onChange={(e) => { setDomain(e.target.value); setError(null); }}
                    placeholder={copy.builder.createBrand.domainPlaceholder}
                    maxLength={500}
                    aria-required="true"
                    aria-invalid={!!error || domainAvailable === false}
                  />
                  <span className="text-xs text-muted-foreground">{copy.builder.createBrand.domainHint}</span>
                  {isCheckingAvailability && domain.trim() && (
                    <span className="text-xs text-muted-foreground">Checking availability…</span>
                  )}
                  {!isCheckingAvailability && domain.trim() && domainAvailable === false && (
                    <span className="text-xs text-destructive" role="alert">{copy.builder.createBrand.validation.domainTaken}</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand-subdomain">{copy.builder.createBrand.subdomainLabel}</Label>
                  <Input
                    id="brand-subdomain"
                    value={subdomain}
                    onChange={(e) => { setSubdomain(e.target.value); setError(null); }}
                    placeholder={copy.builder.createBrand.subdomainPlaceholder}
                    maxLength={200}
                    aria-required="true"
                    aria-invalid={!!error || subdomainAvailable === false}
                  />
                  {!isCheckingAvailability && subdomain.trim() && subdomainAvailable === false && (
                    <span className="text-xs text-destructive" role="alert">{copy.builder.createBrand.validation.subdomainTaken}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand-primary-color">{copy.builder.createBrand.primaryColorLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand-primary-color"
                        type="text"
                        value={primaryColor}
                        onChange={(e) => { setPrimaryColor(e.target.value); setError(null); }}
                        placeholder={copy.builder.createBrand.primaryColorPlaceholder}
                        aria-required="true"
                        className="flex-1"
                      />
                      <div
                        className="w-10 h-10 rounded border border-border"
                        style={{ backgroundColor: primaryColor }}
                        title={primaryColor}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="brand-secondary-color">{copy.builder.createBrand.secondaryColorLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand-secondary-color"
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => { setSecondaryColor(e.target.value); setError(null); }}
                        placeholder={copy.builder.createBrand.secondaryColorPlaceholder}
                        aria-required="true"
                        className="flex-1"
                      />
                      <div
                        className="w-10 h-10 rounded border border-border"
                        style={{ backgroundColor: secondaryColor }}
                        title={secondaryColor}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="theme-select">{copy.builder.createBrand.themeSelectLabel}</Label>
                  {isLoadingThemes ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {copy.builder.createBrand.loadingThemes}
                    </div>
                  ) : (
                    <Select 
                      value={selectedThemeId || undefined} 
                      onValueChange={(value) => setSelectedThemeId(value || '')}
                    >
                      <SelectTrigger id="theme-select">
                        <SelectValue placeholder={copy.builder.createBrand.themeSelectPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {copy.builder.createBrand.themeHint}
                    </span>
                    {selectedThemeId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedThemeId('')}
                        className="h-6 text-xs"
                      >
                        {copy.common.clear}
                      </Button>
                    )}
                  </div>
                </div>
                {selectedThemeId && (
                  <div className="p-4 rounded-lg bg-muted">
                    {(() => {
                      const theme = themes.find(t => t.id === selectedThemeId);
                      if (!theme) return null;
                      return (
                        <div className="space-y-2">
                          <div className="font-medium">{theme.name}</div>
                          <div className="flex gap-2">
                            <div
                              className="w-8 h-8 rounded border border-border"
                              style={{ backgroundColor: theme.colors.primary }}
                              title={`Primary: ${theme.colors.primary}`}
                            />
                            <div
                              className="w-8 h-8 rounded border border-border"
                              style={{ backgroundColor: theme.colors.secondary }}
                              title={`Secondary: ${theme.colors.secondary}`}
                            />
                            <div
                              className="w-8 h-8 rounded border border-border"
                              style={{ backgroundColor: theme.colors.background }}
                              title={`Background: ${theme.colors.background}`}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="site-name">{copy.builder.createBrand.siteNameLabel}</Label>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder={copy.builder.createBrand.siteNamePlaceholder}
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="site-description">{copy.builder.createBrand.siteDescriptionLabel}</Label>
                  <Input
                    id="site-description"
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder={copy.builder.createBrand.siteDescriptionPlaceholder}
                    maxLength={1000}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="favicon">{copy.builder.createBrand.faviconLabel}</Label>
                  <Input
                    id="favicon"
                    value={favicon}
                    onChange={(e) => setFavicon(e.target.value)}
                    placeholder={copy.builder.createBrand.faviconPlaceholder}
                    maxLength={1000}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo-url">{copy.builder.createBrand.logoUrlLabel}</Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={copy.builder.createBrand.logoUrlPlaceholder}
                    maxLength={1000}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custom-domain">{copy.builder.createBrand.customDomainLabel}</Label>
                  <Input
                    id="custom-domain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder={copy.builder.createBrand.customDomainPlaceholder}
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nav-position">{copy.builder.createBrand.navPositionLabel}</Label>
                    <Select value={navigationPosition} onValueChange={setNavigationPosition}>
                      <SelectTrigger id="nav-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="side">Side</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <div className="grid gap-2">
                  <Label htmlFor="nav-style">{copy.builder.createBrand.navStyleLabel}</Label>
                    <Select value={navigationStyle} onValueChange={setNavigationStyle}>
                      <SelectTrigger id="nav-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-sm text-destructive mt-4" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {copy.common.cancel}
            </Button>
            <Button type="submit" disabled={isCreating} aria-busy={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {copy.builder.createBrand.creating}
                </>
              ) : (
                copy.builder.createBrand.createButton
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
