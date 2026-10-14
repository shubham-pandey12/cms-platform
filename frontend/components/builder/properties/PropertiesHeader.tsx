'use client';

import React from 'react';
import { ChevronLeft, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WidgetVersionSelector } from '../WidgetVersionSelector';
import type { PropertiesHeaderProps } from './types';

export const PropertiesHeader: React.FC<PropertiesHeaderProps> = ({
  isSiteLayoutWidget,
  widgetSection,
  widgetSlug,
  widgetName,
  widgetVersion,
  onBack,
  onDuplicate,
  onVersionChange,
}) => {
  return (
    <div className="h-14 px-4 border-b border-border flex items-center gap-3">
      {isSiteLayoutWidget && widgetSection && (
        <Badge variant="secondary" className="text-xs">
          Site Layout - {widgetSection === 'header' ? 'Header' : 'Footer'}
        </Badge>
      )}

      <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-foreground truncate">{widgetName}</h2>
          {onVersionChange ? (
            <WidgetVersionSelector
              widgetSlug={widgetSlug}
              currentVersion={widgetVersion}
              onVersionChange={onVersionChange}
            />
          ) : (
            <Badge variant="outline" className="text-[10px]">
              v{widgetVersion}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Edit element</p>
      </div>

      <Button variant="ghost" size="icon" onClick={onDuplicate} className="shrink-0">
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );
};
