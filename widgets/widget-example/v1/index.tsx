'use client';

import React from 'react';
import type { CustomRenderer } from '@/types/renderTemplate';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

const ExampleRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG }) => (
  <div
    style={{
      padding: '16px',
      backgroundColor: (styles?.backgroundColor as string) || theme.colors.background,
      color: theme.colors.text,
      borderRadius: '8px',
    }}
  >
    {getLocalizedValue(config?.message, lang) || 'Example widget'}
  </div>
);

export default ExampleRenderer;
