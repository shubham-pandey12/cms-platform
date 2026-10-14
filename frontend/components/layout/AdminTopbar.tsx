'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Layers, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInitials } from '@/lib/userInitials';
import { copy } from '@/lib/copy';

interface AdminTopbarProps {
  onMobileMenuOpen: () => void;
}

/**
 * Shared top-bar for all admin pages.
 * Renders the logo, a hamburger for mobile sidebar, and the user avatar dropdown.
 */
export function AdminTopbar({ onMobileMenuOpen }: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userInitials = getUserInitials(user?.name);

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: mobile hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-1.5 text-[#5f6368] hover:bg-gray-100 lg:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <Link href="/brands" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4285F4]">
            <Layers className="h-4 w-4 text-white" aria-hidden />
          </div>
          <span className="hidden text-xl font-normal tracking-tight text-[#5f6368] sm:block">
            {copy.brands.appName}
          </span>
        </Link>
      </div>

      {/* Right: user avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-[#1a73e8] text-sm font-medium text-white transition-all hover:ring-4 hover:ring-gray-100"
            aria-label="User profile and account"
          >
            {userInitials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-[#202124]">{user?.name}</p>
              <p className="text-xs capitalize text-[#5f6368]">
                {user?.role?.replace('_', ' ') ?? ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#5f6368]">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.brands.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
