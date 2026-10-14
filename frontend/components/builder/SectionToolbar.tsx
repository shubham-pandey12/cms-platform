'use client';

import React from 'react';
import { PageSection } from '@/types/cms';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Trash2,
  Layout,
  Columns,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionToolbarProps {
  section: PageSection;
  onAddColumn: () => void;
  onDeleteSection: () => void;
  onChangeLayout: (layout: PageSection['layout']) => void;
  onEditStyles?: () => void;
  isSelected?: boolean;
}

const layoutOptions: { value: PageSection['layout']; label: string; icon: React.ElementType }[] = [
  { value: '1-col', label: '1 Column', icon: Columns },
  { value: '2-col', label: '2 Columns', icon: Columns },
  { value: '3-col', label: '3 Columns', icon: Columns },
  { value: '4-col', label: '4 Columns', icon: Columns },
  { value: 'left-sidebar', label: 'Left Sidebar', icon: Layout },
  { value: 'right-sidebar', label: 'Right Sidebar', icon: Layout },
  { value: 'flex-grid', label: 'Flex Grid', icon: Layout },
];

export const SectionToolbar: React.FC<SectionToolbarProps> = ({
  section,
  onAddColumn,
  onDeleteSection,
  onChangeLayout,
  onEditStyles,
  isSelected = false,
}) => {
  const currentLayout = layoutOptions.find(opt => opt.value === section.layout);

  return (
    <div
      className={cn(
        'absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-sidebar text-sidebar-foreground rounded-lg p-1 shadow-lg z-20 transition-opacity',
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}
    >
      {/* Layout Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Layout className="w-3 h-3 mr-1" />
            {currentLayout?.label || section.layout}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {layoutOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChangeLayout(option.value)}
                className={cn(
                  section.layout === option.value && 'bg-accent'
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Column */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onAddColumn}
        title="Add Column"
      >
        <Plus className="w-3 h-3" />
      </Button>

      {/* Edit Styles */}
      {onEditStyles && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onEditStyles}
          title="Edit Section Styles"
        >
          <Settings2 className="w-3 h-3" />
        </Button>
      )}

      {/* Delete Section */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        onClick={onDeleteSection}
        title="Delete Section"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};
