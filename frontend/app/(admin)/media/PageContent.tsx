'use client';

import React from 'react';
import { MediaLibraryPanel } from '@/components/media/MediaLibraryPanel';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { copy } from '@/lib/copy';

export default function MediaPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Media library"
        description="Upload, crop, and copy URLs for images stored in the CMS."
      />

      {/* Panel fills remaining vertical space between PageHeader and viewport bottom */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white px-4 pb-4 pt-4 md:px-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
            <MediaLibraryPanel active layout="page" />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
