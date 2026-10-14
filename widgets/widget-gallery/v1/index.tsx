'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CustomRenderer } from '@/types/renderTemplate';
import { cn } from '@/lib/utils';
import { getPadding } from '@/lib/styleUtils';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchWidgetJson } from '@/lib/widgetApi';

const normalizeGalleryEndpoint = (apiEndpoint?: unknown): unknown => {
  if (typeof apiEndpoint !== 'string') return apiEndpoint;
  const trimmed = apiEndpoint.trim();
  if (!trimmed) return apiEndpoint;

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  const packagesPattern = /^(https?:\/\/[^/]+)?\/?api\/packages$/i;

  if (packagesPattern.test(withoutTrailingSlash)) {
    return withoutTrailingSlash.replace(/api\/packages$/i, 'api/packages/featured');
  }

  return apiEndpoint;
};

type GalleryLike = {
  id?: string;
  src?: string;
  image?: string;
  alt?: string;
  name?: string;
  title?: string;
  caption?: string;
  description?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const mapToGalleryImages = (data: unknown): GalleryImage[] => {
  const pickItems = (): unknown[] => {
    if (Array.isArray(data)) return data;
    if (isRecord(data) && Array.isArray(data.images)) return data.images;
    if (isRecord(data) && Array.isArray(data.packages)) return data.packages;
    return [];
  };

  const toImage = (item: unknown): GalleryImage | null => {
    if (!isRecord(item)) return null;
    const candidate = item as GalleryLike;
    const src = candidate.src || candidate.image;
    if (!src) return null;
    return {
      id: candidate.id || crypto.randomUUID(),
      src,
      alt: candidate.alt || candidate.name || candidate.title,
      caption: candidate.caption || candidate.description,
    };
  };

  return pickItems()
    .map(toImage)
    .filter((img): img is GalleryImage => Boolean(img));
};

interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
}

const defaultImages: GalleryImage[] = [
  { id: 'img-1', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', alt: 'Mountain view' },
  { id: 'img-2', src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', alt: 'Peak landscape' },
  { id: 'img-3', src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop', alt: 'City skyline' },
  { id: 'img-4', src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop', alt: 'Resort pool' },
  { id: 'img-5', src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop', alt: 'Beach sunset' },
  { id: 'img-6', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop', alt: 'Nature path' },
];

export const GalleryRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG, isPreviewMode = false }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const preFilledImages = useMemo(() => {
    const endpoint = (config.apiEndpoint as string)?.trim();
    const arr = Array.isArray(config.images) ? mapToGalleryImages({ images: config.images }) : [];
    return endpoint && arr.length > 0 ? arr : null;
  }, [config.apiEndpoint, config.images]);
  const [apiImages, setApiImages] = useState<GalleryImage[] | null>(preFilledImages);
  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const padding = getPadding(styles.padding as string);

  // Fetch images from API when endpoint is set (API priority); otherwise use config.
  useEffect(() => {
    const endpoint = normalizeGalleryEndpoint(config.apiEndpoint as string);
    if (!endpoint) {
      const arr = Array.isArray(config.images) ? mapToGalleryImages({ images: config.images }) : [];
      setApiImages(arr.length > 0 ? (arr as GalleryImage[]) : null);
      return;
    }
    const loadFromApi = async () => {
      try {
        const json = await fetchWidgetJson(endpoint, undefined, 'Gallery');
        if (!json) return;
        const images = mapToGalleryImages(json);
        if (images.length > 0) setApiImages(images as GalleryImage[]);
      } catch (error) {
        console.error('Gallery fetch failed:', error);
      }
    };
    loadFromApi();
  }, [config.apiEndpoint, config.images]);
  
  const normalizeImages = (imgs: unknown): GalleryImage[] => {
    if (!Array.isArray(imgs)) return [];
    return imgs.map((img, idx) => {
      if (isRecord(img)) {
        return {
          id: (img.id as string) || `img-${idx}-${Date.now()}`,
          src: (img.src as string) || '',
          alt: (img.alt as string) || undefined,
          caption: (img.caption as string) || undefined,
        };
      }
      return {
        id: `img-${idx}-${Date.now()}`,
        src: '',
        alt: undefined,
        caption: undefined,
      };
    }).filter(img => img.src);
  };
  
  const images = apiImages
    || normalizeImages(config.images)
    || defaultImages;
  const galleryCols = parseInt(config.columns as string) || 3;
  const displayImages = images.slice(0, galleryCols * 2);

  const galleryImageSizes = useMemo(() => {
    const override = (config.imageSizes as string)?.trim();
    if (override) return override;
    switch (galleryCols) {
      case 2: return '(max-width: 640px) 100vw, 50vw';
      case 4: return '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw';
      default: return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw';
    }
  }, [galleryCols, config.imageSizes]);

  const openLightbox = (index: number) => {
    if (!isPreviewMode) return;
    setLightboxIndex(index);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () => setLightboxIndex((prev) => prev !== null ? (prev + 1) % displayImages.length : 0);
  const goPrev = () => setLightboxIndex((prev) => prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : 0);
  
  return (
    <>
      <div style={{ 
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}>
        <div className="w-full max-w-full md:max-w-5xl md:mx-auto px-4 md:px-6">
          <div className={cn("grid gap-2 md:gap-4", {
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-2': galleryCols === 2,
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3': galleryCols === 3,
            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4': galleryCols === 4,
          })}>
            {displayImages.map((img, idx) => (
              <div 
                key={img.id} 
                className="relative aspect-square rounded-lg overflow-hidden"
                onClick={(e) => {
                  if (!isPreviewMode) {
                    e.preventDefault();
                    return;
                  }
                  openLightbox(idx);
                }}
                style={{
                  pointerEvents: isPreviewMode ? 'auto' : 'none',
                  cursor: isPreviewMode ? 'pointer' : 'default',
                }}
              >
                <Image 
                  src={img.src} 
                  alt={getLocalizedValue(img.alt, lang) || `Gallery image`}
                  fill
                  className={cn(
                    "object-cover transition-transform",
                    isPreviewMode && "hover:scale-105 cursor-pointer"
                  )}
                  loading="lazy"
                  sizes={galleryImageSizes}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button 
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <button 
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <div className="max-w-4xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ maxHeight: '70vh', aspectRatio: 'auto' }}>
              <Image 
                src={displayImages[lightboxIndex].src} 
                alt={getLocalizedValue(displayImages[lightboxIndex].alt, lang) || 'Gallery image'}
                width={1200}
                height={800}
                className="w-full h-auto max-w-full max-h-[70vh] object-contain rounded-lg"
                priority
              />
            </div>
            {getLocalizedValue(displayImages[lightboxIndex].caption, lang) && (
              <p className="text-white text-center mt-4">{getLocalizedValue(displayImages[lightboxIndex].caption, lang)}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryRenderer;
