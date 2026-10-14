'use client';

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { Brand } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Eye, 
  Save, 
  MoreHorizontal, 
  Upload, 
  Undo, 
  Redo,
  LogOut,
  User,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BuilderHeaderProps {
  brand?: Brand;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ brand }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currentPage, savePage, saveSiteLayout, isDirty, isLayoutDirty, isPreviewMode, setPreviewMode, viewport, setViewport } = usePageBuilder();

  const handleSave = async () => {
    if (isLayoutDirty) await saveSiteLayout();
    if (isDirty) await savePage();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left section - Logo & Page info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">MCMS</span>
        </div>

        {currentPage && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {currentPage.name}
              </span>
              <Badge 
                variant={currentPage.status as 'draft' | 'published' | 'disabled'}
              >
                {currentPage.status}
              </Badge>
              {(isDirty || isLayoutDirty) && (
                <Badge variant="outline" className="text-xs">
                  Unsaved
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center section - Viewport controls */}
      {currentPage && (
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewport('tablet')}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {currentPage && (
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled>
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled>
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border" />

            <Button 
              variant={isPreviewMode ? "default" : "outline"} 
              size="sm"
              onClick={() => setPreviewMode(!isPreviewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Exit Preview' : 'Preview'}
            </Button>

            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!isDirty && !isLayoutDirty}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button variant="success" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </>
        )}

        <div className="w-px h-6 bg-border ml-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <div className="font-medium text-sm">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
