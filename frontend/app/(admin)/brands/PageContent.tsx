'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getBrands, deleteBrand } from '@/services/cmsApiService';
import { Brand } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { CreateBrandDialog } from '@/components/builder/CreateBrandDialog';
import { EditBrandDialog } from '@/components/builder/EditBrandDialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { Route } from 'next';
import {
  LayoutGrid,
  Layers,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';

export default function BrandsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'domain-asc' | 'domain-desc'>('name-asc');

  const isAdmin = user?.role != null && String(user.role).toLowerCase() === 'admin';

  useEffect(() => {
    if (!user) return;
    const loadBrands = async () => {
      setIsLoading(true);
      try {
        const fetchedBrands = await getBrands();
        setBrands(fetchedBrands);
      } catch (error) {
        console.error('Failed to load brands:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBrands();
  }, [user]);

  const availableBrands = isAdmin
    ? brands
    : brands.filter((brand) => user?.brandIds.includes(brand.id));

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return availableBrands;
    const q = searchQuery.trim().toLowerCase();
    return availableBrands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q)
    );
  }, [availableBrands, searchQuery]);

  const sortedBrands = useMemo(() => {
    const list = [...filteredBrands];
    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
      case 'domain-asc':
        return list.sort((a, b) => a.domain.localeCompare(b.domain, undefined, { sensitivity: 'base' }));
      case 'domain-desc':
        return list.sort((a, b) => b.domain.localeCompare(a.domain, undefined, { sensitivity: 'base' }));
      default:
        return list;
    }
  }, [filteredBrands, sortBy]);

  const handleSelectBrand = (brandId: string) => {
    router.push(`/builder/${brandId}`);
  };

  const handleEditClick = (e: React.MouseEvent, brand: Brand) => {
    e.stopPropagation();
    setBrandToEdit(brand);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, brand: Brand) => {
    e.stopPropagation();
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBrand(brandToDelete.id);
      toast.success(copy.brands.toast.brandDeleted, {
        description: formatCopy(copy.brands.toast.brandDeletedDescription, { name: brandToDelete.name }),
      });
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      const next = await getBrands();
      setBrands(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.brands.toast.deleteFailed;
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title={copy.brands.yourBrands}
        description={copy.brands.startWithBrand}
      />

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        {/* Filters row */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-[#f8f9fa] p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6368]" />
              <input
                type="search"
                placeholder={copy.brands.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 text-sm text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                aria-label={copy.brands.searchPlaceholder}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {/* Grid/list toggle */}
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-gray-200 text-[#202124]' : 'text-[#5f6368] hover:bg-gray-100'
                }`}
                aria-label={viewMode === 'grid' ? copy.brands.listView : copy.brands.gridView}
              >
                {viewMode === 'grid' ? (
                  <List className="h-4 w-4" aria-hidden />
                ) : (
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                )}
              </button>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-md p-2 text-[#5f6368] hover:bg-gray-100 transition-colors"
                    aria-label={copy.brands.sortOptions}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('name-asc')}>
                    {copy.brands.sortNameAsc}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name-desc')}>
                    {copy.brands.sortNameDesc}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('domain-asc')}>
                    {copy.brands.sortDomainAsc}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('domain-desc')}>
                    {copy.brands.sortDomainDesc}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
          </div>
        ) : availableBrands.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <Layers className="h-8 w-8 text-[#5f6368]" aria-hidden />
            </div>
            <p className="text-sm text-[#5f6368]">{copy.brands.noBrandsTitle}</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <p className="py-8 text-sm text-[#5f6368]">{copy.brands.noBrandsMatchSearch}</p>
        ) : viewMode === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            {sortedBrands.map((brand) => (
              <div
                key={brand.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectBrand(brand.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectBrand(brand.id);
                  }
                }}
                className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a73e8]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="truncate text-sm font-medium text-[#202124]">{brand.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-[#5f6368]">
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {brand.domain}
                  </p>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="shrink-0 rounded-full p-2 text-[#5f6368] opacity-0 transition-all hover:bg-gray-200 group-hover:opacity-100"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(e as unknown as React.MouseEvent, brand);
                        }}
                      >
                        {formatCopy(copy.brands.ariaEditBrand, { name: brand.name })}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/brands/${brand.id}/redirects` as Route}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {copy.brands.manageRedirects}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(e as unknown as React.MouseEvent, brand);
                        }}
                      >
                        {formatCopy(copy.brands.ariaDeleteBrand, { name: brand.name })}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {sortedBrands.map((brand) => (
              <div
                key={brand.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectBrand(brand.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectBrand(brand.id);
                  }
                }}
                className="group flex h-[220px] w-[200px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
              >
                {/* Preview area */}
                <div
                  className="flex h-[155px] shrink-0 items-center justify-center p-5"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {/* Wireframe mockup window */}
                  <div className="flex h-full w-full max-w-[160px] flex-col rounded-lg border border-white/25 bg-white/15 p-2.5">
                    {/* Nav bar */}
                    <div className="mb-2 h-2 w-2/5 rounded-full bg-white/70" />
                    {/* Content block 1 */}
                    <div className="mb-1.5 h-[34%] w-full rounded-md bg-white/40" />
                    {/* Content block 2 */}
                    <div className="h-[34%] w-full rounded-md bg-white/30" />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex h-[65px] shrink-0 items-center justify-between border-t border-gray-100 px-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#202124]" title={brand.name}>
                      {brand.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#5f6368]">
                      <Layers className="h-3 w-3 shrink-0 text-[#4285F4]" aria-hidden />
                      {brand.domain}
                    </p>
                  </div>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="ml-1 shrink-0 rounded-full p-1 text-[#5f6368] opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(e as unknown as React.MouseEvent, brand);
                          }}
                        >
                          {formatCopy(copy.brands.ariaEditBrand, { name: brand.name })}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/brands/${brand.id}/redirects` as Route}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {copy.brands.manageRedirects}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(e as unknown as React.MouseEvent, brand);
                          }}
                        >
                          {formatCopy(copy.brands.ariaDeleteBrand, { name: brand.name })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin-access info bar */}
        {isAdmin && availableBrands.length > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-[#f8f9fa] px-4 py-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#5f6368]" aria-hidden />
            <span className="font-medium text-[#202124]">{copy.brands.adminAccess}</span>
            <span className="text-sm text-[#5f6368]">
              {formatCopy(copy.brands.adminAccessDescription, { count: brands.length })}
            </span>
          </div>
        )}
      </div>

      {/* Floating action button */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-lg transition-all hover:bg-[#1557b0] hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
          aria-label={copy.brands.addNewBrand}
          title={copy.brands.addNewBrand}
        >
          <Plus className="h-7 w-7" aria-hidden />
        </button>
      )}

      {/* Dialogs */}
      <CreateBrandDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onBrandCreated={() => getBrands().then(setBrands)}
      />

      <EditBrandDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setBrandToEdit(null);
        }}
        brand={brandToEdit}
        onBrandUpdated={() => {
          setBrandToEdit(null);
          getBrands().then(setBrands);
        }}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setBrandToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.brands.deleteBrandTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {brandToDelete
                ? formatCopy(copy.brands.deleteBrandDescription, { name: brandToDelete.name })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{copy.common.cancel}</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {copy.brands.deleting}
                </>
              ) : (
                copy.common.delete
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
