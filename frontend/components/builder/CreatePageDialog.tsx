'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Page, Template, Brand } from '@/types/cms';
import { getBrands, getTemplates, createPage as createPageService, getWidgetDefinitions, getSiteLayouts } from '@/services/cmsApiService';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { copy, formatCopy } from '@/lib/copy';
import { extractUriVariables, normalizePageUriInput, validatePageUri } from '@/lib/pageUriValidation';
import { 
  FileText, 
  Layout, 
  Globe, 
  AlertCircle, 
  Check,
  Variable,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId?: string;
  onPageCreated?: (page: Page) => void;
}

type Step = 'method' | 'uri' | 'template' | 'details';

export const CreatePageDialog: React.FC<CreatePageDialogProps> = ({ 
  open, 
  onOpenChange,
  brandId,
  onPageCreated
}) => {
  const { selectedBrandId } = useAuth();
  const { setCurrentPage, pages, refreshPages } = usePageBuilder();
  
  const effectiveBrandId = brandId || selectedBrandId;
  
  const [step, setStep] = useState<Step>('method');
  const [createMethod, setCreateMethod] = useState<'blank' | 'template'>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uriType, setUriType] = useState<'static' | 'dynamic'>('static');
  const [uri, setUri] = useState('');
  const [pageName, setPageName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load brands and templates asynchronously when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedBrands, fetchedTemplates] = await Promise.all([
          getBrands(),
          getTemplates(effectiveBrandId),
        ]);
        setBrands(fetchedBrands);
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error('Failed to load dialog data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, effectiveBrandId]);

  const brand = brands.find(b => b.id === effectiveBrandId);
  const brandPages = pages.filter(p => p.brandId === effectiveBrandId);

  const extractVariables = (uri: string): string[] => extractUriVariables(uri);

  const validateUri = (inputUri: string): string | null => {
    const result = validatePageUri(inputUri, brandPages);
    return result.error;
  };

  const handleUriChange = (value: string) => {
    const normalized = normalizePageUriInput(value);
    setUri(normalized);
    setError(null);

    // Auto-detect dynamic URL
    if (normalized.includes('<') && normalized.includes('>')) {
      setUriType('dynamic');
    }
  };

  const handleNext = () => {
    if (step === 'method') {
      if (createMethod === 'template') {
        setStep('template');
      } else {
        setStep('uri');
      }
    } else if (step === 'template') {
      setStep('uri');
    } else if (step === 'uri') {
      const validationError = validateUri(uri);
      if (validationError) {
        setError(validationError);
        return;
      }
      setStep('details');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('uri');
    } else if (step === 'uri') {
      if (createMethod === 'template') {
        setStep('template');
      } else {
        setStep('method');
      }
    } else if (step === 'template') {
      setStep('method');
    }
  };

  const handleCreate = async () => {
    if (!pageName.trim()) {
      setError(copy.builder.createPage.errors.pageNameRequired);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const variables = extractVariables(uri);
      
      // Get available widget definitions to filter out removed widgets
      const availableWidgets = await getWidgetDefinitions(effectiveBrandId);
      const availableWidgetIds = new Set(availableWidgets.map(w => w.id));
      
      // Get default layout ID (brand default or first)
      const layouts = await getSiteLayouts(effectiveBrandId);
      if (layouts.length === 0) {
        setError(copy.builder.createPage.errors.noSiteLayouts);
        setIsCreating(false);
        return;
      }
      const defaultLayout = layouts.find(l => l.isDefault) || layouts.find(l => l.name === 'Default Layout') || layouts[0];
      const defaultLayoutId = defaultLayout.id;
      
      // Build body content from template if selected, filtering out removed widgets
      const bodyContentArray = selectedTemplate
        ? (selectedTemplate.bodyContent || []).map((section, sIdx) => ({
            ...section,
            id: `section-${Date.now()}-${sIdx}`,
            columns: section.columns.map((column, cIdx) => ({
              ...column,
              id: `col-${Date.now()}-${cIdx}`,
              widgets: column.widgets
                .filter((w) => availableWidgetIds.has(w.widgetDefinitionId))
                .map((w, wIdx) => ({
                  ...w,
                  id: `widget-${Date.now()}-${wIdx}`,
                }))
            }))
          }))
        : [];

      // Create page via service (bodyContent must be a JSON string)
      const newPage = await createPageService({
        brandId: effectiveBrandId!,
        name: pageName,
        uri: uri,
        isDynamic: variables.length > 0,
        dynamicVariables: variables,
        layoutId: defaultLayoutId,
        bodyContent: JSON.stringify(bodyContentArray),
      });

      if (!newPage) {
        setError(copy.builder.createPage.errors.createFailed);
        return;
      }

      // Refresh pages list
      await refreshPages();
      
      // Callback or set current page
      if (onPageCreated) {
        onPageCreated(newPage);
      } else {
        setCurrentPage(newPage);
      }
      
      // Reset and close
      resetForm();
      onOpenChange(false);
      
      toast.success(copy.builder.createPage.toast.success, {
        description: formatCopy(copy.builder.createPage.toast.successDescription, { name: pageName }),
      });
    } catch (err) {
      console.error('Failed to create page:', err);
      setError('Failed to create page. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setStep('method');
    setCreateMethod('blank');
    setSelectedTemplate(null);
    setUriType('static');
    setUri('');
    setPageName('');
    setError(null);
    setIsCreating(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.builder.createPage.dialogTitle}</DialogTitle>
          <DialogDescription>
            {step === 'method' && 'Choose how you want to create your page'}
            {step === 'template' && 'Select a template to start with'}
            {step === 'uri' && 'Set the URL for your page'}
            {step === 'details' && 'Add page details'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['method', 'template', 'uri', 'details'].filter(s => 
              createMethod === 'template' ? true : s !== 'template'
            ).map((s, i, arr) => {
              const currentStepIndex = arr.indexOf(step);
              const isCompleted = currentStepIndex > i;
              return (
                <React.Fragment key={s}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step === s 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5",
                      isCompleted ? "bg-primary/40" : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step: Method */}
          {step === 'method' && (
            <RadioGroup 
              value={createMethod} 
              onValueChange={(v) => setCreateMethod(v as 'blank' | 'template')}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="blank"
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all",
                  createMethod === 'blank' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="blank" id="blank" className="sr-only" />
                <FileText className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">Blank Page</div>
                  <div className="text-sm text-muted-foreground">Start from scratch</div>
                </div>
              </Label>
              
              <Label
                htmlFor="template"
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all",
                  createMethod === 'template' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="template" id="template" className="sr-only" />
                <Layout className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">From Template</div>
                  <div className="text-sm text-muted-foreground">Use a pre-built layout</div>
                </div>
              </Label>
            </RadioGroup>
          )}

          {/* Step: Template Selection */}
          {step === 'template' && (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "text-left rounded-lg border-2 overflow-hidden transition-all relative",
                      selectedTemplate?.id === template.id 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {template.thumbnail && (
                      <div 
                        className="aspect-video bg-muted bg-cover bg-center"
                        style={{ backgroundImage: `url(${template.thumbnail})` }}
                      />
                    )}
                    <div className="p-3">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {(() => {
                            const widgetCount = (template.bodyContent || []).reduce(
                              (count, section) => count + section.columns.reduce(
                                (colCount, column) => colCount + column.widgets.length, 0
                              ), 0
                            );
                            return `${widgetCount} widgets`;
                          })()}
                        </Badge>
                      </div>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Step: URI */}
          {step === 'uri' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>URL Type</Label>
                <RadioGroup 
                  value={uriType} 
                  onValueChange={(v) => setUriType(v as 'static' | 'dynamic')}
                  className="flex gap-4"
                >
                  <Label
                    htmlFor="static"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border cursor-pointer flex-1 transition-colors",
                      uriType === 'static' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="static" id="static" />
                    <div>
                      <div className="font-medium">Static URL</div>
                      <div className="text-xs text-muted-foreground">e.g., /about, /contact</div>
                    </div>
                  </Label>
                  
                  <Label
                    htmlFor="dynamic"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border cursor-pointer flex-1 transition-colors",
                      uriType === 'dynamic' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="dynamic" id="dynamic" />
                    <div>
                      <div className="font-medium">Dynamic URL</div>
                      <div className="text-xs text-muted-foreground">e.g., /packages/&lt;SLUG&gt;</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uri">Page URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                    <Globe className="w-4 h-4" />
                    {brand?.domain}
                  </div>
                  <Input
                    id="uri"
                    value={uri}
                    onChange={(e) => handleUriChange(e.target.value)}
                    placeholder={uriType === 'dynamic' ? '/packages/<PACKAGE_SLUG>' : '/about-us'}
                    className="rounded-l-none"
                  />
                </div>
                {uriType === 'dynamic' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Variable className="w-3 h-3" />
                    Use &lt;VARIABLE_NAME&gt; for dynamic segments (uppercase letters and underscores only, e.g. &lt;PACKAGE_SLUG&gt;)
                  </p>
                )}
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>

              {uri && extractVariables(uri).length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Detected Variables</div>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(uri).map((v) => (
                      <Badge key={v} variant="secondary">
                        <Variable className="w-3 h-3 mr-1" />
                        {v}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    These variables will be available in Page Data for API calls and widget binding
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  value={pageName}
                  onChange={(e) => {
                    setPageName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Homepage, About Us, Package Details"
                />
                <p className="text-xs text-muted-foreground">
                  This name is used internally and won&apos;t be visible to customers
                </p>
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium">Summary</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">URL:</div>
                  <div className="font-mono text-xs">{brand?.domain}{uri}</div>
                  
                  <div className="text-muted-foreground">Type:</div>
                  <div>{uri.includes('<') ? 'Dynamic' : 'Static'}</div>
                  
                  {selectedTemplate && (
                    <>
                      <div className="text-muted-foreground">Template:</div>
                      <div>{selectedTemplate.name}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'method' && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            {step === 'details' ? (
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Page'}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={step === 'template' && !selectedTemplate}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
