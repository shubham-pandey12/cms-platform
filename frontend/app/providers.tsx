'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { WidgetStylesClipboardProvider } from '@/contexts/WidgetStylesClipboardContext';
import { SkipLinks } from '@/components/common/SkipLinks';
import { useState } from 'react';
import type { ServerSession } from '@/lib/auth/serverSession';

/**
 * When admin routes are migrated to RSC with server-prefetched TanStack Query data, add HydrationBoundary
 * in the server layout or here as the hydration bridge. QueryClientProvider remains the client sink.
 */
export function Providers({
  children,
  sessionFromServer,
}: {
  children: React.ReactNode;
  sessionFromServer: ServerSession;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider sessionFromServer={sessionFromServer}>
          <WidgetStylesClipboardProvider>
            <TooltipProvider>
              <SkipLinks />
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </WidgetStylesClipboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

