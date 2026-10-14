'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { getEmbedRenderer } from '@/lib/embed/embedRenderers';
import {
  buildWidgetEmbedUrl,
  getEmbedLinkBaseOrigin,
} from '@/lib/embed/buildWidgetEmbedUrl';
import type { Page } from '@/types/cms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const t = copy.builder.embedLink;

export type WidgetEmbedLinkSectionProps = {
  isSiteLayoutWidget: boolean;
  widgetSlug: string;
  supportsHtmlEmbed: boolean;
  currentPage: Page;
  widgetInstanceId: string;
  selectedBrandId: string | null;
  supportedLangs: string[];
};

export function WidgetEmbedLinkSection({
  isSiteLayoutWidget,
  widgetSlug,
  supportsHtmlEmbed,
  currentPage,
  widgetInstanceId,
  selectedBrandId,
  supportedLangs,
}: WidgetEmbedLinkSectionProps): React.ReactElement {
  const langSelectId = useId();
  const langOptions = useMemo(
    () => (supportedLangs.length > 0 ? supportedLangs : [DEFAULT_LANG]),
    [supportedLangs]
  );
  const defaultLang = langOptions[0] ?? DEFAULT_LANG;
  const [embedLang, setEmbedLang] = useState(() => langOptions[0]);

  useEffect(() => {
    setEmbedLang(langOptions[0]);
  }, [langOptions]);

  const embedUrl = useMemo(() => {
    if (!selectedBrandId) return '';
    const baseOrigin = getEmbedLinkBaseOrigin();
    if (!baseOrigin) return '';
    return buildWidgetEmbedUrl({
      baseOrigin,
      brandId: selectedBrandId,
      pageUri: currentPage.uri,
      widgetInstanceId,
      lang: embedLang,
      defaultLang,
    });
  }, [
    selectedBrandId,
    currentPage.uri,
    widgetInstanceId,
    embedLang,
    defaultLang,
  ]);

  const handleCopy = async () => {
    if (!embedUrl) return;
    try {
      await navigator.clipboard.writeText(embedUrl);
      toast.success(t.copiedToast);
    } catch {
      toast.error(t.copyFailed);
    }
  };

  if (isSiteLayoutWidget) {
    return (
      <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/30 p-3">
        <Alert>
          <AlertDescription className="text-xs">{t.layoutOnlyWarning}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasEmbedTemplate = getEmbedRenderer(widgetSlug) != null;
  if (!supportsHtmlEmbed || !hasEmbedTemplate) {
    return (
      <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-1">
        <p className="text-sm text-muted-foreground">{t.notSupported}</p>
        <p className="text-xs text-muted-foreground">{t.docHint}</p>
      </div>
    );
  }

  const preview =
    embedUrl.length > 72 ? `${embedUrl.slice(0, 72)}…` : embedUrl;

  return (
    <div className="mx-4 mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium text-foreground">{t.title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t.description}</p>

      {currentPage.status !== 'published' && (
        <Alert>
          <AlertDescription className="text-xs">{t.unpublishedWarning}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={langSelectId}>
          {t.langLabel}
        </label>
        <Select value={embedLang} onValueChange={setEmbedLang}>
          <SelectTrigger id={langSelectId} className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {langOptions.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full gap-2"
        onClick={handleCopy}
        disabled={!embedUrl}
      >
        <Link2 className="h-4 w-4" />
        {t.copyButton}
      </Button>

      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{t.urlPreviewLabel}</span>
        <Input readOnly value={preview} className="h-8 font-mono text-[11px]" title={embedUrl || undefined} />
      </div>

      <p className="text-xs text-muted-foreground leading-snug">{t.secretHint}</p>
    </div>
  );
}
