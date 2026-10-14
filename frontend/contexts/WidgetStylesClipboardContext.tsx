'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { WidgetStyles } from '@/types/cms';

interface ClipboardEntry {
  styles: WidgetStyles;
  elementStyles?: Record<string, Record<string, string>>;
}

interface WidgetStylesClipboardContextValue {
  clipboardEntry: ClipboardEntry | null;
  copyStyles: (styles: WidgetStyles, elementStyles?: Record<string, Record<string, string>>) => void;
  hasCopied: boolean;
}

const WidgetStylesClipboardContext = createContext<WidgetStylesClipboardContextValue>({
  clipboardEntry: null,
  copyStyles: () => undefined,
  hasCopied: false,
});

export function WidgetStylesClipboardProvider({ children }: { children: React.ReactNode }) {
  const [clipboardEntry, setClipboardEntry] = useState<ClipboardEntry | null>(null);

  const copyStyles = useCallback(
    (styles: WidgetStyles, elementStyles?: Record<string, Record<string, string>>) => {
      setClipboardEntry({ styles, elementStyles });
    },
    []
  );

  return (
    <WidgetStylesClipboardContext.Provider value={{ clipboardEntry, copyStyles, hasCopied: clipboardEntry !== null }}>
      {children}
    </WidgetStylesClipboardContext.Provider>
  );
}

export function useWidgetStylesClipboard() {
  return useContext(WidgetStylesClipboardContext);
}
