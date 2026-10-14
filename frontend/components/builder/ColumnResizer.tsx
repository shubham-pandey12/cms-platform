'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GripVertical, Minus, Plus, Smartphone, Tablet, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveSpan } from '@/types/cms';

interface ColumnResizerProps {
  currentSpan: ResponsiveSpan;
  totalSpan: number; // Total span used in the section (desktop)
  onSpanChange: (newSpan: ResponsiveSpan) => void;
  disabled?: boolean;
}

export const ColumnResizer: React.FC<ColumnResizerProps> = ({
  currentSpan,
  totalSpan,
  onSpanChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const currentValue = currentSpan[activeBreakpoint];
  const maxSpan = activeBreakpoint === 'desktop' 
    ? 12 - (totalSpan - currentSpan.desktop) 
    : 12; // Mobile and tablet can use full width

  const handleSpanChange = (value: number[]) => {
    const newSpan = Math.max(1, Math.min(maxSpan, value[0]));
    onSpanChange({
      ...currentSpan,
      [activeBreakpoint]: newSpan,
    });
  };

  const handleIncrement = () => {
    if (currentValue < maxSpan) {
      onSpanChange({
        ...currentSpan,
        [activeBreakpoint]: currentValue + 1,
      });
    }
  };

  const handleDecrement = () => {
    if (currentValue > 1) {
      onSpanChange({
        ...currentSpan,
        [activeBreakpoint]: currentValue - 1,
      });
    }
  };

  const handleQuickSpan = (span: number) => {
    if (span <= maxSpan) {
      onSpanChange({
        ...currentSpan,
        [activeBreakpoint]: span,
      });
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 px-1 absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity',
            disabled && 'cursor-not-allowed'
          )}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(true);
          }}
        >
          <GripVertical className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Responsive Column Width</span>
            <span className="text-sm text-muted-foreground">
              {currentValue} / 12
            </span>
          </div>

          {/* Breakpoint selector */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={activeBreakpoint === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => setActiveBreakpoint('mobile')}
            >
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile
            </Button>
            <Button
              variant={activeBreakpoint === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => setActiveBreakpoint('tablet')}
            >
              <Tablet className="w-3 h-3 mr-1" />
              Tablet
            </Button>
            <Button
              variant={activeBreakpoint === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => setActiveBreakpoint('desktop')}
            >
              <Monitor className="w-3 h-3 mr-1" />
              Desktop
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
              disabled={currentValue <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <Slider
              value={[currentValue]}
              onValueChange={handleSpanChange}
              min={1}
              max={maxSpan}
              step={1}
              className="flex-1"
            />
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrement}
              disabled={currentValue >= maxSpan}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 6, 12].map((span) => (
              <Button
                key={span}
                variant={currentValue === span ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleQuickSpan(span)}
                disabled={span > maxSpan}
              >
                {span}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Mobile: {currentSpan.mobile} | Tablet: {currentSpan.tablet} | Desktop: {currentSpan.desktop}</div>
            {activeBreakpoint === 'desktop' && maxSpan < 12 && (
              <span>Max: {maxSpan} (other columns use {12 - maxSpan} spans)</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
