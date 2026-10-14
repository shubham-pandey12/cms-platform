'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { FieldMatch } from '@/lib/autoMapper';
import { cn } from '@/lib/utils';

interface BulkMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: FieldMatch[];
  onApply: (selectedMappings: FieldMatch[]) => void;
}

export const BulkMappingDialog: React.FC<BulkMappingDialogProps> = ({
  open,
  onOpenChange,
  suggestions,
  onApply,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-select high confidence suggestions
    if (open) {
      const highConfidence = suggestions
        .filter(s => s.confidence >= 80)
        .map(s => s.widgetField);
      setSelectedIds(new Set(highConfidence));
    }
  }, [open, suggestions]);

  const handleToggle = (widgetField: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(widgetField)) {
        next.delete(widgetField);
      } else {
        next.add(widgetField);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(suggestions.map(s => s.widgetField)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleApply = () => {
    const selected = suggestions.filter(s => selectedIds.has(s.widgetField));
    onApply(selected);
    onOpenChange(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 border-green-600';
    if (confidence >= 70) return 'text-blue-600 border-blue-600';
    if (confidence >= 50) return 'text-yellow-600 border-yellow-600';
    return 'text-orange-600 border-orange-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return <CheckCircle2 className="w-3 h-3" />;
    if (confidence >= 70) return <TrendingUp className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  const selectedCount = selectedIds.size;
  const highConfidenceCount = suggestions.filter(s => s.confidence >= 80).length;
  const mediumConfidenceCount = suggestions.filter(s => s.confidence >= 60 && s.confidence < 80).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Auto-Map Field Suggestions
          </DialogTitle>
          <DialogDescription>
            Review and apply suggested field mappings based on name similarity and data types.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {highConfidenceCount} High
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {mediumConfidenceCount} Medium
              </Badge>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Suggestions List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-4 space-y-2">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No field mapping suggestions found.</p>
                  <p className="text-sm mt-1">Try configuring API call and fetching data first.</p>
                </div>
              ) : (
                suggestions.map((suggestion) => {
                  const isSelected = selectedIds.has(suggestion.widgetField);
                  
                  return (
                    <div
                      key={suggestion.widgetField}
                      className={cn(
                        'flex items-start gap-3 p-3 border rounded-lg transition-colors',
                        isSelected ? 'bg-primary/5 border-primary' : 'bg-muted/30 hover:bg-muted/50'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(suggestion.widgetField)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{suggestion.widgetField}</span>
                          <span className="text-muted-foreground">←</span>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {suggestion.apiPath}
                          </code>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', getConfidenceColor(suggestion.confidence))}
                          >
                            {getConfidenceIcon(suggestion.confidence)}
                            {suggestion.confidence}% confidence
                          </Badge>
                          <span className="text-muted-foreground">{suggestion.reason}</span>
                          {suggestion.dataType && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.dataType}
                            </Badge>
                          )}
                        </div>

                        {suggestion.apiValue !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Sample:</span>
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs max-w-md truncate">
                              {String(suggestion.apiValue)}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> High confidence mappings (90%+) are pre-selected. 
              Review medium confidence mappings before applying.
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center gap-3 w-full">
            <div className="text-sm text-muted-foreground">
              {selectedCount} {selectedCount === 1 ? 'mapping' : 'mappings'} selected
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApply} 
                disabled={selectedCount === 0}
              >
                Apply {selectedCount} {selectedCount === 1 ? 'Mapping' : 'Mappings'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
