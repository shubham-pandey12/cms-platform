'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import type { Page } from '@/types/cms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileText, Check, Globe, MoreHorizontal, Pencil } from 'lucide-react';
import { CreatePageDialog } from '../CreatePageDialog';
import { EditPageDialog } from '../EditPageDialog';

export const PagesTab: React.FC = () => {
  const { selectedBrandId } = useAuth();
  const { currentPage, setCurrentPage, pages } = usePageBuilder();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pageToEdit, setPageToEdit] = useState<Page | null>(null);

  const brandPages = pages.filter((p) => p.brandId === selectedBrandId);

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Button variant="outline" size="sm" className="w-full mb-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add page
          </Button>

          <div className="space-y-1">
            {brandPages.map((page) => (
              <div
                key={page.id}
                className={cn(
                  'w-full flex items-center gap-1 rounded-lg transition-colors text-left',
                  currentPage?.id === page.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                )}
              >
                <button
                  onClick={() => setCurrentPage(page)}
                  className="flex-1 min-w-0 p-3 flex items-center gap-3 rounded-lg"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{page.name}</span>
                      <Badge
                        variant={page.status === 'published' ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {page.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {page.uri}
                    </div>
                  </div>
                  {currentPage?.id === page.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="mr-1 h-7 w-7 shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={async () => {
                        await setCurrentPage(page);
                        setPageToEdit(page);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {brandPages.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No pages yet</p>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create first page
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <CreatePageDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditPageDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setPageToEdit(null);
        }}
        page={pageToEdit}
      />
    </>
  );
};
