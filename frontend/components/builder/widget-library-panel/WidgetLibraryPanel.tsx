'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, FileText, Palette } from 'lucide-react';
import type { TabType } from './widgetLibraryTypes';
import { InsertTab } from './InsertTab';
import { PagesTab } from './PagesTab';
import { ThemesTab } from './ThemesTab';

export const WidgetLibraryPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('insert');
  const [panelWidth, setPanelWidth] = useState(288);
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 480;
  const MAX_WIDTH = 600;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'insert', label: 'Insert', icon: Plus },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'themes', label: 'Themes', icon: Palette },
  ];

  return (
    <div
      ref={panelRef}
      className="bg-card border-r border-border flex flex-col h-full overflow-hidden relative"
      style={{ width: panelWidth, minWidth: MIN_WIDTH }}
    >
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-3 px-2 text-sm font-medium transition-colors relative',
              activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {activeTab === 'insert' && <InsertTab />}
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'themes' && <ThemesTab />}
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
    </div>
  );
};
