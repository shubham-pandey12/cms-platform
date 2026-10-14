'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Brand, ScriptConfig, SiteSettings } from '@/types/cms';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { getSiteSettings, updateSiteSettings, getBrandById, updateBrand, updateBrandGlobalCss, updateBrandCustomFontUrls, addSiteScript, removeSiteScript, updateSiteScript } from '@/services/cmsApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { copy } from '@/lib/copy';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import {
  Globe,
  Image as ImageIcon,
  Navigation,
  Search,
  Share2,
  BarChart3,
  FileText,
  Link2,
  Upload,
  Code,
  Plus,
  Trash2,
  Palette,
  Type,
  Languages,
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand;
}

const defaultSettings: Omit<SiteSettings, 'id' | 'brandId' | 'updatedAt'> = {
  siteName: 'Untitled site',
  siteDescription: '',
  favicon: '',
  ogImage: '',
  showNavigation: true,
  navigationPosition: 'top',
  navigationStyle: 'standard',
  showLogo: true,
  logoUrl: '',
  enableSearch: false,
  googleAnalyticsId: '',
  customHeadCode: '',
  enableSocialSharing: true,
  twitterHandle: '',
  customDomain: '',
  robotsTxt: 'User-agent: *\nAllow: /',
  canonicalUrl: '',
  globalCss: '',
  headScripts: [],
  bodyScripts: [],
  supportedLangs: undefined,
};

export const SiteSettingsDialog: React.FC<SiteSettingsDialogProps> = ({
  open,
  onOpenChange,
  brand,
}) => {
  const { currentPage } = usePageBuilder();
  const brandId = brand?.id || currentPage?.brandId || 'brand-1';
  
  const [settings, setSettings] = useState<Omit<SiteSettings, 'id' | 'brandId' | 'updatedAt'>>({
    ...defaultSettings,
    siteName: currentPage?.name || 'Untitled site',
    customDomain: brand?.domain || '',
  });
  
  const [brandCss, setBrandCss] = useState('');
  const [brandSettings, setBrandSettings] = useState({
    primaryColor: '#0891b2',
    secondaryColor: '#164e63',
    logo: '',
    customFontUrls: [] as string[],
    domain: '',
    subdomain: '',
  });
  const [newFontUrl, setNewFontUrl] = useState('');
  const [newScript, setNewScript] = useState<Partial<ScriptConfig>>({
    name: '',
    src: '',
    content: '',
    position: 'head',
    async: false,
    defer: false,
    enabled: true,
  });
  const [newLocaleCode, setNewLocaleCode] = useState('');

  const COMMON_LOCALE_CODES = ['en-GB', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-PT', 'nl-NL', 'pl-PL', 'ja-JP', 'zh-CN'];
  const currentLangs = settings.supportedLangs?.length ? settings.supportedLangs : [DEFAULT_LANG];

  // Load settings from API
  useEffect(() => {
    if (!open || !brandId) return;
    
    const loadSettings = async () => {
      const [existingSettings, brandData] = await Promise.all([
        getSiteSettings(brandId),
        getBrandById(brandId),
      ]);
      
      if (existingSettings) {
        const { id, brandId: _, updatedAt, ...rest } = existingSettings;
        setSettings(rest);
      }
      
      // Load brand CSS and settings
      if (brandData) {
        setBrandCss(brandData.globalCss || '');
        setBrandSettings({
          primaryColor: brandData.primaryColor || '#0891b2',
          secondaryColor: brandData.secondaryColor || '#164e63',
          logo: brandData.logo || '',
          customFontUrls: brandData.customFontUrls || [],
          domain: brandData.domain || '',
          subdomain: brandData.subdomain || '',
        });
      }
    };
    
    loadSettings();
  }, [open, brandId]);

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const updated = await updateSiteSettings(brandId, settings);
    await updateBrandGlobalCss(brandId, brandCss);
    await updateBrand(brandId, {
      primaryColor: brandSettings.primaryColor,
      secondaryColor: brandSettings.secondaryColor,
      logo: brandSettings.logo,
      customFontUrls: brandSettings.customFontUrls,
      domain: brandSettings.domain,
      subdomain: brandSettings.subdomain,
    });
    if (updated) {
      toast.success(copy.builder.siteSettings.saved);
      onOpenChange(false);
    } else {
      toast.error(copy.builder.siteSettings.saveFailed);
    }
  };

  const handleAddFontUrl = () => {
    if (newFontUrl.trim()) {
      setBrandSettings(prev => ({
        ...prev,
        customFontUrls: [...prev.customFontUrls, newFontUrl.trim()],
      }));
      setNewFontUrl('');
      toast.success(copy.builder.siteSettings.fontAdded);
    }
  };

  const handleRemoveFontUrl = (index: number) => {
    setBrandSettings(prev => ({
      ...prev,
      customFontUrls: prev.customFontUrls.filter((_, i) => i !== index),
    }));
    toast.success(copy.builder.siteSettings.fontRemoved);
  };
  
  const handleAddScript = () => {
    if (!newScript.name) {
      toast.error(copy.builder.siteSettings.scriptNameRequired);
      return;
    }
    const script: ScriptConfig = {
      id: `script-${Date.now()}`,
      name: newScript.name || 'Unnamed Script',
      src: newScript.src,
      content: newScript.content,
      position: newScript.position as 'head' | 'body-start' | 'body-end',
      async: newScript.async || false,
      defer: newScript.defer || false,
      enabled: true,
    };
    
    if (script.position === 'head') {
      setSettings(prev => ({
        ...prev,
        headScripts: [...(prev.headScripts || []), script],
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        bodyScripts: [...(prev.bodyScripts || []), script],
      }));
    }
    
    setNewScript({
      name: '',
      src: '',
      content: '',
      position: 'head',
      async: false,
      defer: false,
      enabled: true,
    });
    toast.success(copy.builder.siteSettings.scriptAdded);
  };
  
  const handleRemoveScript = (scriptId: string, position: string) => {
    if (position === 'head') {
      setSettings(prev => ({
        ...prev,
        headScripts: (prev.headScripts || []).filter(s => s.id !== scriptId),
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        bodyScripts: (prev.bodyScripts || []).filter(s => s.id !== scriptId),
      }));
    }
    toast.success(copy.builder.siteSettings.scriptRemoved);
  };

  const handleAddLocale = () => {
    const raw = newLocaleCode.trim().toLowerCase();
    if (!raw) {
      toast.error('Use a 5-character locale (e.g. en-GB, fr-FR).');
      return;
    }
    if (raw.length !== 5 || !/^[a-z]{2}-[a-z]{2}$/.test(raw)) {
      toast.error('Use a 5-character locale (e.g. en-GB, fr-FR).');
      return;
    }
    const code = `${raw.slice(0, 2)}-${raw.slice(3, 5).toUpperCase()}`;
    const next = settings.supportedLangs?.length ? [...settings.supportedLangs] : [DEFAULT_LANG];
    if (next.includes(code)) {
      toast.error('This language is already in the list.');
      return;
    }
    setSettings(prev => ({ ...prev, supportedLangs: next.concat(code) }));
    setNewLocaleCode('');
    toast.success('Locale added.');
  };

  const handleRemoveLocale = (code: string) => {
    const next = (settings.supportedLangs ?? [DEFAULT_LANG]).filter(c => c !== code);
    setSettings(prev => ({
      ...prev,
      supportedLangs: next.length > 0 ? next : undefined,
    }));
    toast.success('Locale removed.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{copy.builder.siteSettings.dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-7 shrink-0">
            <TabsTrigger value="general" className="text-xs gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="navigation" className="text-xs gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              Navigation
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" aria-hidden />
              Branding
            </TabsTrigger>
            <TabsTrigger value="brand" className="text-xs gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Brand
            </TabsTrigger>
            <TabsTrigger value="customcss" className="text-xs gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Custom CSS
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  placeholder={copy.builder.siteSettings.siteNamePlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  This name appears in browser tabs and search results.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder={copy.builder.siteSettings.siteDescriptionPlaceholder}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Used for SEO and social media previews.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="customDomain"
                    value={settings.customDomain}
                    onChange={(e) => updateSetting('customDomain', e.target.value)}
                    placeholder={copy.builder.siteSettings.canonicalPlaceholder}
                  />
                  <Button variant="outline" size="sm">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={settings.canonicalUrl}
                  onChange={(e) => updateSetting('canonicalUrl', e.target.value)}
                  placeholder={copy.builder.siteSettings.canonicalUrlPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  The preferred URL for search engines.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <Label>Supported languages</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Locale codes for widget translations (e.g. en-GB, fr-FR). Used by all localized text fields in the builder.
                </p>
                <div className="space-y-2">
                  {currentLangs.map((code) => (
                    <div key={code} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                      <span className="flex-1 font-mono text-sm">{code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveLocale(code)}
                        disabled={currentLangs.length <= 1}
                        title={currentLangs.length <= 1 ? 'At least one language is required' : 'Remove language'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={newLocaleCode}
                      onChange={(e) => setNewLocaleCode(e.target.value)}
                      placeholder="e.g. en-GB, fr-FR"
                      className="w-32 font-mono text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocale())}
                    />
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!value) return;
                        const next = settings.supportedLangs?.length ? [...settings.supportedLangs] : [DEFAULT_LANG];
                        if (!next.includes(value)) {
                          setSettings(prev => ({ ...prev, supportedLangs: next.concat(value) }));
                          toast.success('Locale added.');
                        }
                      }}
                    >
                      <SelectTrigger className="w-28 h-9">
                        <SelectValue placeholder="Quick add" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_LOCALE_CODES.filter((c) => !currentLangs.includes(c)).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                        {COMMON_LOCALE_CODES.every((c) => currentLangs.includes(c)) && (
                          <SelectItem value="" disabled>All common added</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleAddLocale}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Navigation Tab */}
            <TabsContent value="navigation" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show navigation</Label>
                  <p className="text-xs text-muted-foreground">
                    Display navigation menu on your site
                  </p>
                </div>
                <Switch
                  checked={settings.showNavigation}
                  onCheckedChange={(checked) => updateSetting('showNavigation', checked)}
                />
              </div>

              {settings.showNavigation && (
                <>
                  <div className="space-y-2">
                    <Label>Navigation position</Label>
                    <Select
                      value={settings.navigationPosition}
                      onValueChange={(value: 'top' | 'side') => 
                        updateSetting('navigationPosition', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="side">Side</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Navigation style</Label>
                    <Select
                      value={settings.navigationStyle}
                      onValueChange={(value: 'standard' | 'compact' | 'transparent') =>
                        updateSetting('navigationStyle', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show logo in navigation</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your logo in the navigation bar
                      </p>
                    </div>
                    <Switch
                      checked={settings.showLogo}
                      onCheckedChange={(checked) => updateSetting('showLogo', checked)}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                    {settings.favicon ? (
                      <Image src={settings.favicon} alt="Favicon" width={32} height={32} className="w-8 h-8" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={settings.favicon}
                      onChange={(e) => updateSetting('favicon', e.target.value)}
                      placeholder="Favicon URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 32x32 or 180x180 pixels, PNG format
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                    {settings.logoUrl ? (
                      <Image src={settings.logoUrl} alt="Logo" fill className="object-contain" sizes="96px" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={settings.logoUrl}
                      onChange={(e) => updateSetting('logoUrl', e.target.value)}
                      placeholder="Logo URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG or SVG with transparent background
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Social sharing image (OG Image)</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                    {settings.ogImage ? (
                      <Image src={settings.ogImage} alt="OG Image" fill className="object-cover" sizes="128px" />
                    ) : (
                      <Share2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={settings.ogImage}
                      onChange={(e) => updateSetting('ogImage', e.target.value)}
                      placeholder="OG Image URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1200x630 pixels for optimal display on social media
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Brand Settings Tab */}
            <TabsContent value="brand" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label>Brand Logo</Label>
                <p className="text-xs text-muted-foreground">
                  The brand logo (separate from site logo). Used for brand identification.
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                    {brandSettings.logo ? (
                      <Image src={brandSettings.logo} alt="Brand Logo" fill className="object-contain" sizes="96px" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={brandSettings.logo}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, logo: e.target.value }))}
                      placeholder="Brand logo URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG or SVG with transparent background
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={brandSettings.primaryColor}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={brandSettings.primaryColor}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#0891b2"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main brand color used throughout the site
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={brandSettings.secondaryColor}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={brandSettings.secondaryColor}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#164e63"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secondary brand color for accents
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={brandSettings.domain}
                    onChange={(e) => setBrandSettings(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Primary domain for this brand
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{copy.builder.createBrand.subdomainLabel}</Label>
                  <Input
                    value={brandSettings.subdomain}
                    onChange={(e) => setBrandSettings(prev => ({ ...prev, subdomain: e.target.value }))}
                    placeholder={copy.builder.createBrand.subdomainPlaceholder}
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.builder.createBrand.subdomainHint}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Font URLs</Label>
                <p className="text-xs text-muted-foreground">
                  Add custom font stylesheet URLs (e.g., Google Fonts, Adobe Fonts)
                </p>
                <div className="space-y-2">
                  {brandSettings.customFontUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                      <Type className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-mono truncate">{url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveFontUrl(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFontUrl}
                      onChange={(e) => setNewFontUrl(e.target.value)}
                      placeholder="https://fonts.googleapis.com/css2?family=..."
                      className="flex-1 font-mono text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddFontUrl();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddFontUrl}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Custom CSS Tab */}
            <TabsContent value="customcss" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label htmlFor="brandCss">Brand Global CSS</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Custom CSS applied to all pages of this brand. This is stored with the brand and used by the backend render engine.
                </p>
                <Textarea
                  id="brandCss"
                  value={brandCss}
                  onChange={(e) => setBrandCss(e.target.value)}
                  rows={8}
                  placeholder={`/* Brand-wide custom styles */\n.brand-highlight {\n  color: var(--primary);\n}\n\n.custom-button {\n  border-radius: 8px;\n}`}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteCss">Site Global CSS</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Additional CSS for this site configuration. Applied after brand CSS.
                </p>
                <Textarea
                  id="siteCss"
                  value={settings.globalCss || ''}
                  onChange={(e) => updateSetting('globalCss', e.target.value)}
                  rows={6}
                  placeholder={`/* Site-level custom styles */\n:root {\n  --custom-color: #0891b2;\n}`}
                  className="font-mono text-sm"
                />
              </div>

              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <h4 className="font-medium text-sm mb-2">CSS Cascade Order</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Theme CSS variables (colors, fonts)</li>
                  <li>System spacing/shadow tokens</li>
                  <li>Brand Global CSS (stored with brand)</li>
                  <li>Site Global CSS (stored with site settings)</li>
                  <li>Page Custom CSS (per-page overrides)</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  The backend render engine applies these in order, allowing proper overrides.
                </p>
              </div>

              {/* Script Management */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <Label className="text-base">Script Injection</Label>
                  <p className="text-xs text-muted-foreground">
                    Add external scripts or inline code for analytics, tracking, or custom functionality.
                  </p>
                </div>

                {/* Existing Scripts */}
                {((settings.headScripts || []).length > 0 || (settings.bodyScripts || []).length > 0) && (
                  <div className="space-y-2">
                    <Label className="text-sm">Configured Scripts</Label>
                    <div className="space-y-2">
                      {(settings.headScripts || []).map((script) => (
                        <div key={script.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1 text-sm">{script.name}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded">head</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveScript(script.id, 'head')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {(settings.bodyScripts || []).map((script) => (
                        <div key={script.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1 text-sm">{script.name}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded">body</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveScript(script.id, 'body')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Script */}
                <div className="space-y-3 p-3 rounded-lg border border-dashed border-border">
                  <Label className="text-sm">Add New Script</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Script Name</Label>
                      <Input
                        value={newScript.name || ''}
                        onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Google Analytics"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Position</Label>
                      <Select
                        value={newScript.position || 'head'}
                        onValueChange={(value) => setNewScript(prev => ({ ...prev, position: value as 'head' | 'body-start' | 'body-end' }))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">Head</SelectItem>
                          <SelectItem value="body-start">Body Start</SelectItem>
                          <SelectItem value="body-end">Body End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">External URL (optional)</Label>
                    <Input
                      value={newScript.src || ''}
                      onChange={(e) => setNewScript(prev => ({ ...prev, src: e.target.value }))}
                      placeholder="https://www.googletagmanager.com/gtag/js?id=..."
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Inline Code (optional)</Label>
                    <Textarea
                      value={newScript.content || ''}
                      onChange={(e) => setNewScript(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="window.dataLayer = window.dataLayer || [];"
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newScript.async || false}
                        onCheckedChange={(checked) => setNewScript(prev => ({ ...prev, async: checked }))}
                      />
                      <Label className="text-xs">Async</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newScript.defer || false}
                        onCheckedChange={(checked) => setNewScript(prev => ({ ...prev, defer: checked }))}
                      />
                      <Label className="text-xs">Defer</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={handleAddScript}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Script
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable site search</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow visitors to search your site content
                  </p>
                </div>
                <Switch
                  checked={settings.enableSearch}
                  onCheckedChange={(checked) => updateSetting('enableSearch', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="robotsTxt">robots.txt</Label>
                <Textarea
                  id="robotsTxt"
                  value={settings.robotsTxt}
                  onChange={(e) => updateSetting('robotsTxt', e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Control how search engines crawl your site
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customHead">Custom HTML in &lt;head&gt;</Label>
                <Textarea
                  id="customHead"
                  value={settings.customHeadCode}
                  onChange={(e) => updateSetting('customHeadCode', e.target.value)}
                  rows={4}
                  placeholder="<meta name='...' content='...'>"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom meta tags, scripts, or stylesheets
                </p>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Label htmlFor="gaId">Google Analytics ID</Label>
                <Input
                  id="gaId"
                  value={settings.googleAnalyticsId}
                  onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Google Analytics 4 measurement ID
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable social sharing</Label>
                  <p className="text-xs text-muted-foreground">
                    Show social sharing buttons on pages
                  </p>
                </div>
                <Switch
                  checked={settings.enableSocialSharing}
                  onCheckedChange={(checked) => updateSetting('enableSocialSharing', checked)}
                />
              </div>

              {settings.enableSocialSharing && (
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Twitter/X handle</Label>
                  <Input
                    id="twitterHandle"
                    value={settings.twitterHandle}
                    onChange={(e) => updateSetting('twitterHandle', e.target.value)}
                    placeholder="@yourhandle"
                  />
                </div>
              )}

              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Site analytics</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      View detailed analytics about your site visitors, page views, and engagement metrics in the Analytics dashboard.
                    </p>
                    <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                      Open Analytics →
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};