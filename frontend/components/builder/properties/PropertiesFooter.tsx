'use client';

import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PropertiesFooterProps } from './types';

export const PropertiesFooter: React.FC<PropertiesFooterProps> = ({ isVisible, onToggleVisibility, onDelete }) => {
  return (
    <div className="p-4 border-t border-border space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onToggleVisibility}>
          {isVisible ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show
            </>
          )}
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};
