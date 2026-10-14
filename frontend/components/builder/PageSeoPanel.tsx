'use client';

import React from 'react';
import Image from 'next/image';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Search,
  Twitter,
  Share2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Link2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';

interface PageSeoPanelProps {
  onClose: () => void;
}

export const PageSeoPanel: React.FC<PageSeoPanelProps> = ({ onClose }) => {
  const { currentPage, updatePageSeo, updatePageName, updatePageUri, updatePageStatus, updatePageDynamicVariables, savePage } = usePageBuilder();

  if (!currentPage) return null;

  const seo = currentPage.seo;

  const updateSeo = (field: string, value: string | string[]) => {
    updatePageSeo({ [field]: value } as any);
  };

  const handleSave = () => {
    savePage();
    toast.success(copy.builder.renderers.seoSaved);
  };

  // SEO Score calculation
  const calculateSeoScore = () => {
    let score = 0;
    let maxScore = 0;

    maxScore += 20;
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) {
      score += 20;
    } else if (seo.title) {
      score += 10;
    }

    maxScore += 20;
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) {
      score += 20;
    } else if (seo.description) {
      score += 10;
    }

    maxScore += 10;
    if (seo.keywords && seo.keywords.length > 0) {
      score += 10;
    }

    maxScore += 10;
    if (seo.canonicalUrl) {
      score += 10;
    }

    maxScore += 10;
    if (seo.ogTitle) {
      score += 10;
    }

    maxScore += 10;
    if (seo.ogDescription) {
      score += 10;
    }

    maxScore += 10;
    if (seo.ogImage) {
      score += 10;
    }

    maxScore += 10;
    if (seo.twitterTitle && seo.twitterDescription) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  };

  const seoScore = calculateSeoScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const issues = [];
  if (!seo.title || seo.title.length < 30) {
    issues.push('Title is too short (recommended: 30-60 characters)');
  }
  if (seo.title && seo.title.length > 60) {
    issues.push('Title is too long (recommended: 30-60 characters)');
  }
  if (!seo.description || seo.description.length < 120) {
    issues.push('Description is too short (recommended: 120-160 characters)');
  }
  if (seo.description && seo.description.length > 160) {
    issues.push('Description is too long (recommended: 120-160 characters)');
  }
  if (!seo.ogImage) {
    issues.push('Missing Open Graph image');
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="h-14 px-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="font-medium text-foreground">SEO Settings</h2>
          <p className="text-xs text-muted-foreground">Page: {currentPage.name}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* SEO Score */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">SEO Score</span>
              <span className={cn("text-2xl font-bold", getScoreColor(seoScore))}>
                {seoScore}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all",
                  seoScore >= 80 ? "bg-green-500" : seoScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${seoScore}%` }}
              />
            </div>
            {issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {issues.slice(0, 3).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="page">
            <TabsList className="w-full mb-4 grid grid-cols-3">
              <TabsTrigger value="page" className="flex-1">
                <FileText className="w-3 h-3 mr-1" />
                Page
              </TabsTrigger>
              <TabsTrigger value="basic" className="flex-1">
                <Search className="w-3 h-3 mr-1" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="social" className="flex-1">
                <Share2 className="w-3 h-3 mr-1" />
                Social
              </TabsTrigger>
            </TabsList>

            <TabsContent value="page" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  value={currentPage.name}
                  onChange={(e) => updatePageName(e.target.value)}
                  placeholder="Enter page name"
                />
                <p className="text-xs text-muted-foreground">
                  The internal name for this page
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageUri">Page URI</Label>
                <Input
                  id="pageUri"
                  value={currentPage.uri}
                  onChange={(e) => updatePageUri(e.target.value)}
                  placeholder="/page-path"
                />
                <p className="text-xs text-muted-foreground">
                  URL path for this page. Use &lt;VARIABLE&gt; for dynamic pages (e.g., /blog/&lt;SLUG&gt;)
                </p>
                {currentPage.isDynamic && currentPage.dynamicVariables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentPage.dynamicVariables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageStatus">Page Status</Label>
                <Select
                  value={currentPage.status}
                  onValueChange={(value: 'draft' | 'published' | 'disabled') => updatePageStatus(value)}
                >
                  <SelectTrigger id="pageStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {currentPage.status === 'draft' && 'Page is not visible to visitors'}
                  {currentPage.status === 'published' && 'Page is live and visible to visitors'}
                  {currentPage.status === 'disabled' && 'Page is hidden from visitors'}
                </p>
              </div>

              {currentPage.isDynamic && (
                <div className="space-y-2">
                  <Label>Dynamic Variables</Label>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      Variables extracted from the URL:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {currentPage.dynamicVariables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs font-mono">
                          &lt;{variable}&gt;
                        </Badge>
                      ))}
                    </div>
                    {currentPage.dynamicVariables.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No variables found in URI
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <Label>Page Information</Label>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="font-mono">{currentPage.version || '1.0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(currentPage.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {currentPage.publishedAt && (
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span>{new Date(currentPage.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Page Title</Label>
                  <span className={cn(
                    "text-xs",
                    (seo.title?.length || 0) > 60 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {seo.title?.length || 0}/60
                  </span>
                </div>
                <Input
                  id="title"
                  value={seo.title || ''}
                  onChange={(e) => updateSeo('title', e.target.value)}
                  placeholder="Enter page title"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Meta Description</Label>
                  <span className={cn(
                    "text-xs",
                    (seo.description?.length || 0) > 160 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {seo.description?.length || 0}/160
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={seo.description || ''}
                  onChange={(e) => updateSeo('description', e.target.value)}
                  placeholder="Enter meta description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={seo.keywords?.join(', ') || ''}
                  onChange={(e) => updateSeo('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                  placeholder="travel, vacation, luxury"
                />
                <p className="text-xs text-muted-foreground">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonical">Canonical URL</Label>
                <Input
                  id="canonical"
                  value={seo.canonicalUrl || ''}
                  onChange={(e) => updateSeo('canonicalUrl', e.target.value)}
                  placeholder="https://example.com/page"
                />
              </div>

              <div className="space-y-2">
                <Label>Search Preview</Label>
                <div className="p-3 bg-white rounded-lg border text-left">
                  <div className="text-blue-600 text-sm font-medium truncate">
                    {seo.title || 'Page Title'}
                  </div>
                  <div className="text-green-700 text-xs truncate">
                    https://brand.example.com{currentPage.uri}
                  </div>
                  <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {seo.description || 'Page description will appear here...'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Open Graph</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogTitle">OG Title</Label>
                  <Input
                    id="ogTitle"
                    value={seo.ogTitle || ''}
                    onChange={(e) => updateSeo('ogTitle', e.target.value)}
                    placeholder={seo.title || 'Use page title'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogDescription">OG Description</Label>
                  <Textarea
                    id="ogDescription"
                    value={seo.ogDescription || ''}
                    onChange={(e) => updateSeo('ogDescription', e.target.value)}
                    placeholder={seo.description || 'Use meta description'}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogImage">OG Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ogImage"
                      value={seo.ogImage || ''}
                      onChange={(e) => updateSeo('ogImage', e.target.value)}
                      placeholder="Image URL (1200x630 recommended)"
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <ImageIcon className="w-4 h-4" aria-hidden />
                    </Button>
                  </div>
                </div>

                {seo.ogImage && (
                  <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
                    <Image
                      src={seo.ogImage}
                      alt="OG Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter Card</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterTitle">Title</Label>
                  <Input
                    id="twitterTitle"
                    value={seo.twitterTitle || ''}
                    onChange={(e) => updateSeo('twitterTitle', e.target.value)}
                    placeholder={seo.ogTitle || seo.title || 'Use OG title'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterDescription">Description</Label>
                  <Textarea
                    id="twitterDescription"
                    value={seo.twitterDescription || ''}
                    onChange={(e) => updateSeo('twitterDescription', e.target.value)}
                    placeholder={seo.ogDescription || seo.description || 'Use OG description'}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterImage">Image</Label>
                  <Input
                    id="twitterImage"
                    value={seo.twitterImage || ''}
                    onChange={(e) => updateSeo('twitterImage', e.target.value)}
                    placeholder={seo.ogImage || 'Use OG image'}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button className="w-full" onClick={handleSave}>
          Save SEO Settings
        </Button>
      </div>
    </div>
  );
};