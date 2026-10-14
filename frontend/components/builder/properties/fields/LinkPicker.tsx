'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPages } from '@/services/api/pagesApi';

export interface LinkValue {
  href: string;
  target?: '_self' | '_blank';
  rel?: string;
}

interface LinkPickerProps {
  id?: string;
  value: LinkValue | null;
  onChange: (value: LinkValue) => void;
  brandId?: string;
  disabled?: boolean;
}

interface PageOption {
  id: string;
  name: string;
  uri: string;
}

export function LinkPicker({ id, value, onChange, brandId, disabled }: LinkPickerProps) {
  const href = value?.href ?? '';
  const target = value?.target ?? '_self';
  const rel = value?.rel ?? '';

  const [pages, setPages] = useState<PageOption[]>([]);
  const [tabValue, setTabValue] = useState<string>(() => {
    if (!href) return 'external';
    if (href.startsWith('#')) return 'anchor';
    return 'external';
  });

  useEffect(() => {
    if (brandId) {
      getPages(brandId)
        .then((p) => setPages(p.map((pg) => ({ id: pg.id, name: pg.name, uri: pg.uri }))))
        .catch(() => setPages([]));
    }
  }, [brandId]);

  const update = (partial: Partial<LinkValue>) =>
    onChange({ href, target, rel, ...value, ...partial });

  return (
    <div id={id} className="space-y-3">
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="h-8 w-full grid grid-cols-3">
          <TabsTrigger value="external" className="text-xs gap-1">
            <ExternalLink className="w-3 h-3" /> External
          </TabsTrigger>
          <TabsTrigger value="page" className="text-xs gap-1">
            <FileText className="w-3 h-3" /> Page
          </TabsTrigger>
          <TabsTrigger value="anchor" className="text-xs gap-1">
            <Hash className="w-3 h-3" /> Anchor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="external" className="mt-2">
          <Input
            value={href}
            onChange={(e) => update({ href: e.target.value })}
            placeholder="https://example.com"
            className="h-9"
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="page" className="mt-2">
          <Select
            value={href}
            onValueChange={(v) => update({ href: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a page…" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((pg) => (
                <SelectItem key={pg.id} value={pg.uri}>
                  {pg.name} ({pg.uri})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="anchor" className="mt-2">
          <Input
            value={href.startsWith('#') ? href.slice(1) : href}
            onChange={(e) => update({ href: `#${e.target.value}` })}
            placeholder="section-id"
            className="h-9"
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Open in new tab</Label>
        <Switch
          checked={target === '_blank'}
          onCheckedChange={(checked) => update({ target: checked ? '_blank' : '_self', rel: checked ? 'noopener noreferrer' : '' })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
