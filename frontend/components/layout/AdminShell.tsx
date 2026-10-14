'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Layers, Loader2, LogOut } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { adminNavGroups, isNavItemActive } from '@/lib/adminNav';
import { useAuth } from '@/contexts/AuthContext';
import { AdminTopbar } from './AdminTopbar';
import { AdminSidebar } from './AdminSidebar';
import { copy } from '@/lib/copy';

interface AdminShellProps {
  children: React.ReactNode;
  /** When true the shell redirects unauthenticated visitors to /login */
  requireAuth?: boolean;
  /** When true the shell redirects users without the specified permission to /brands */
  requirePermission?: (user: import('@/types/cms').User | null) => boolean;
}

/** Mobile drawer nav that mirrors the desktop sidebar content */
function MobileDrawerNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[260px] p-0">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4285F4]">
            <Layers className="h-4 w-4 text-white" aria-hidden />
          </div>
          <span className="text-xl font-normal tracking-tight text-[#5f6368]">
            {copy.brands.appName}
          </span>
        </div>
        <Suspense fallback={<div className="flex-1" />}>
          <MobileNavInner onClose={onClose} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavInner({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav aria-label="Mobile main navigation" className="flex flex-col gap-6 px-3 py-4">
      {adminNavGroups.map((group) => {
        const visibleItems = group.items.filter((item) => item.visible(user));
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#5f6368]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const active = isNavItemActive(item, pathname, searchParams);
                const href = item.tabParam
                  ? `${item.href}?${item.tabParam.key}=${item.tabParam.value}`
                  : item.href;
                const Icon = item.icon;
                return (
                  <li key={href + (item.tabParam?.value ?? '')}>
                    <Link
                      href={href as Route}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[#e8f0fe] font-medium text-[#1a73e8]'
                          : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className={cn('h-4 w-4 shrink-0', active ? 'text-[#1a73e8]' : 'text-[#5f6368]')}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function AdminShellInner({ children, requireAuth = true, requirePermission }: AdminShellProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!requireAuth) return;
    if (!authLoading && !user) {
      const returnUrl = encodeURIComponent(pathname ?? '/brands');
      router.replace(`/login?redirect=${returnUrl}`);
    }
  }, [authLoading, user, router, pathname, requireAuth]);

  useEffect(() => {
    if (!requirePermission) return;
    if (!authLoading && user && !requirePermission(user)) {
      router.replace('/brands');
    }
  }, [authLoading, user, requirePermission, router]);

  if (authLoading || (requireAuth && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#202124]">
      <AdminTopbar onMobileMenuOpen={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <AdminSidebar />
        </div>

        {/* Mobile drawer */}
        <MobileDrawerNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Top-level shell for all admin pages.
 * Provides the sticky top-bar, persistent desktop sidebar, mobile drawer,
 * and centralised auth-redirect + loading-state handling.
 *
 * Usage:
 * ```tsx
 * <AdminShell requirePermission={(u) => userHasOrganizationPermission(u, USERS_MANAGE)}>
 *   <PageHeader title="Users" description="…" actions={…} />
 *   <div className="p-6">…content…</div>
 * </AdminShell>
 * ```
 */
export function AdminShell(props: AdminShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
        </div>
      }
    >
      <AdminShellInner {...props} />
    </Suspense>
  );
}
