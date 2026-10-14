import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Consistent page title band used across all admin pages.
 * Renders a gray strip with H1, optional subtitle, and an optional actions slot.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-[#f8f9fa] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#202124]">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-[#5f6368]">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
