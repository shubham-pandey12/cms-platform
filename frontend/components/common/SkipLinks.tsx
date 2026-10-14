'use client';

import React from 'react';
import { copy } from '@/lib/copy';

/**
 * SkipLinks component for keyboard navigation
 * Allows users to skip to main content, navigation, etc.
 */
export const SkipLinks: React.FC = () => {
  const handleSkip = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault();
          handleSkip('main-content');
        }}
      >
        {copy.common.skipToMainContent}
      </a>
    </div>
  );
};

