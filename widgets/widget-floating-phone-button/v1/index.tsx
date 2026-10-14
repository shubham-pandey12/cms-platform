'use client';

import React, { useState } from 'react';
import { CustomRenderer } from '@/types/renderTemplate';
import { cn } from '@/lib/utils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

export const FloatingPhoneButtonRenderer: CustomRenderer = ({
  config,
  styles,
  theme,
  isPreviewMode = false,
  lang = DEFAULT_LANG,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const phoneNumber = getLocalizedValue(config.phoneNumber, lang) || '0207 071 3636';
  const phoneLink = (config.phoneLink as string) || '02070713636';
  const showText = config.showText !== false;
  const textBehavior = (config.textBehavior as string) || 'hover';
  const position = (config.position as string) || 'bottom-left';
  const horizontalOffset = (config.horizontalOffset as string) || 'md';
  const verticalOffset = (config.verticalOffset as string) || 'md';
  const backgroundColor = (config.backgroundColor as string) || '#cf132a';
  const hoverBackgroundColor = (config.hoverBackgroundColor as string) || '#b01125';
  const textColor = (config.textColor as string) || '#ffffff';
  const size = (config.size as string) || 'md';
  const enableScaleAnimation = config.enableScaleAnimation !== false;
  const zIndex = (config.zIndex as number) || 50;

  const getPositionClasses = () => {
    const offsetMap: Record<string, string> = {
      sm: '8',
      md: '8',
      lg: '12',
    };

    const horizontal = offsetMap[horizontalOffset] || '8';
    const vertical = offsetMap[verticalOffset] || '8';

    const positionMap: Record<string, string> = {
      'bottom-left': `bottom-${vertical} left-${horizontal}`,
      'bottom-right': `bottom-${vertical} right-${horizontal}`,
      'top-left': `top-${vertical} left-${horizontal}`,
      'top-right': `top-${vertical} right-${horizontal}`,
    };

    return positionMap[position] || positionMap['bottom-left'];
  };

  const sizeClasses = {
    sm: {
      padding: 'p-3',
      icon: 'w-5 h-5',
      text: 'text-sm',
    },
    md: {
      padding: 'p-4',
      icon: 'w-6 h-6',
      text: 'text-base',
    },
    lg: {
      padding: 'p-5',
      icon: 'w-7 h-7',
      text: 'text-lg',
    },
  };

  const currentSize = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreviewMode) {
      e.preventDefault();
    }
  };

  const shouldShowText = showText && (textBehavior === 'always' || isHovered);

  const buttonContent = (
    <a
      href={`tel:${phoneLink}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'fixed rounded-full shadow-2xl transition-all group',
        getPositionClasses(),
        currentSize.padding,
        enableScaleAnimation && 'hover:scale-110'
      )}
      style={{
        backgroundColor: isHovered ? hoverBackgroundColor : backgroundColor,
        color: textColor,
        zIndex,
        opacity: ((styles.opacity as number) ?? 100) / 100,
        cursor: isPreviewMode ? 'pointer' : 'default',
      }}
      aria-label={`Call ${phoneNumber}`}
    >
      <div className="flex items-center gap-3">
        <svg
          className={currentSize.icon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>

        {showText && (
          <span
            className={cn(
              'font-semibold whitespace-nowrap transition-all',
              currentSize.text,
              textBehavior === 'hover' && 'hidden group-hover:inline-block'
            )}
            style={{ color: textColor }}
          >
            {phoneNumber}
          </span>
        )}
      </div>
    </a>
  );

  if (!isPreviewMode) {
    return (
      <div className="relative w-full h-32 pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-gray-400 text-center pointer-events-none">
            Floating Phone Button<br />
            (Preview to see final position)
          </div>
        </div>
        <div className="pointer-events-auto">
          {buttonContent}
        </div>
      </div>
    );
  }

  return buttonContent;
};

export default FloatingPhoneButtonRenderer;
