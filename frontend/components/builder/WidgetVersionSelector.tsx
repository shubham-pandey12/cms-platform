'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';
import { getWidgetVersions } from '@/services/api/widgetsApi';
import type { WidgetVersionListItem } from '@/types/cms';

interface WidgetVersionSelectorProps {
  widgetSlug: string;
  currentVersion: string;
  onVersionChange: (newVersion: string) => void;
  disabled?: boolean;
}

export const WidgetVersionSelector: React.FC<WidgetVersionSelectorProps> = ({
  widgetSlug,
  currentVersion,
  onVersionChange,
  disabled = false,
}) => {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['widget-versions', widgetSlug],
    queryFn: () => getWidgetVersions(widgetSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!widgetSlug,
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-[10px]">
        v{currentVersion}
      </Badge>
    );
  }

  if (!versions || versions.length <= 1) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] cursor-default">
              v{currentVersion}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Widget version {currentVersion}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const currentVersionData = versions.find((v) => v.version === currentVersion);
  const isCurrentDeprecated = currentVersionData?.isDeprecated;

  return (
    <div className="flex items-center gap-1">
      <Select
        value={currentVersion}
        onValueChange={onVersionChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-6 w-auto min-w-[80px] text-[10px] px-2 py-0">
          <SelectValue placeholder="Select version">
            <span className="flex items-center gap-1">
              v{currentVersion}
              {isCurrentDeprecated && (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem
              key={version.id}
              value={version.version}
              disabled={version.isDeprecated}
              className="text-sm"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span>v{version.version}</span>
                <div className="flex items-center gap-1">
                  {version.isLatest && (
                    <Badge variant="default" className="text-[9px] h-4 px-1">
                      Latest
                    </Badge>
                  )}
                  {version.isDeprecated && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1">
                      Deprecated
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentVersionData?.changeLog && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{currentVersionData.changeLog}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default WidgetVersionSelector;
