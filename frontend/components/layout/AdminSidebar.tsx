'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNavGroups, isNavItemActive } from '@/lib/adminNav';
import { useAuth } from '@/contexts/AuthContext';

function SidebarNavInner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6 px-3 py-4">
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

/**
 * Persistent sidebar shown on desktop; used inside AdminShell.
 * Wrapped in Suspense because useSearchParams requires it.
 */
export function AdminSidebar() {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <Suspense fallback={<div className="flex-1" />}>
        <SidebarNavInner />
      </Suspense>
    </aside>
  );
}
