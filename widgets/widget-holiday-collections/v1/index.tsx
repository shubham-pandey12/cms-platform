'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { CustomRenderer } from '@/types/renderTemplate';
import { cn } from '@/lib/utils';
import { getPadding, getStyleValue, applyElementStyles } from '@/lib/styleUtils';
import { fetchWidgetJson } from '@/lib/widgetApi';
import { getIcon } from '@/lib/iconRegistry';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';
import { Star, Phone, X, ArrowRight, Plane, Bus, Luggage, ShieldCheck, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ItineraryItem {
  nights?: string;
  hotel?: string;
}

interface Amenity {
  type?: string;
}

interface HolidayPackage {
  imageUrl?: string;
  locationName?: string;
  category?: string;
  description?: string;
  rating?: number;
  savePercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  currency?: string;
  itinerary?: ItineraryItem[];
  amenities?: Amenity[];
  depositAmount?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

interface PaginatedResponse {
  items?: HolidayPackage[];
  packages?: HolidayPackage[];
  total?: number;
  totalCount?: number;
  count?: number;
}

const mapToPackages = (data: unknown): HolidayPackage[] => {
  const pickItems = (): unknown[] => {
    if (Array.isArray(data)) return data;
    if (isRecord(data) && Array.isArray(data.packages)) return data.packages;
    if (isRecord(data) && Array.isArray(data.items)) return data.items;
    return [];
  };

  const toPackage = (item: unknown): HolidayPackage | null => {
    if (!isRecord(item)) return null;
    const candidate = item as Record<string, unknown>;
    
    // Map common field variations
    const imageUrl = candidate.imageUrl || candidate.image || candidate.photo;
    const locationName = candidate.locationName || candidate.location || candidate.title || candidate.name;
    
    if (!imageUrl || !locationName) return null;

    // Map itinerary
    let itinerary: ItineraryItem[] = [];
    if (Array.isArray(candidate.itinerary)) {
      itinerary = candidate.itinerary.map((it: unknown) => {
        if (isRecord(it)) {
          return {
            nights: (it.nights as string) || (it.nightsLabel as string) || '',
            hotel: (it.hotel as string) || (it.hotelName as string) || '',
          };
        }
        return { nights: '', hotel: '' };
      });
    }

    // Map amenities
    let amenities: Amenity[] = [];
    if (Array.isArray(candidate.amenities)) {
      amenities = candidate.amenities.map((am: unknown) => {
        if (isRecord(am)) {
          return { type: (am.type as string) || '' };
        }
        if (typeof am === 'string') {
          return { type: am };
        }
        return { type: '' };
      });
    } else if (isRecord(candidate.amenities)) {
      // Handle object format { flights: true, transfers: true }
      amenities = Object.entries(candidate.amenities)
        .filter(([_, value]) => Boolean(value))
        .map(([key]) => ({ type: key }));
    }

    return {
      imageUrl: String(imageUrl),
      locationName: String(locationName),
      category: candidate.category ? String(candidate.category) : undefined,
      description: candidate.description ? String(candidate.description) : undefined,
      rating: candidate.rating ? Number(candidate.rating) : 5,
      savePercentage: candidate.savePercentage ? Number(candidate.savePercentage) : 0,
      originalPrice: candidate.originalPrice ? Number(candidate.originalPrice) : 0,
      discountedPrice: candidate.discountedPrice ? Number(candidate.discountedPrice) : 0,
      currency: candidate.currency ? String(candidate.currency) : '£',
      itinerary,
      amenities,
      depositAmount: candidate.depositAmount ? String(candidate.depositAmount) : '£99',
    };
  };

  return pickItems()
    .map(toPackage)
    .filter((pkg): pkg is HolidayPackage => Boolean(pkg));
};

export const HolidayCollectionsRenderer: CustomRenderer = ({
  config,
  styles,
  theme,
  lang = DEFAULT_LANG,
  isPreviewMode = false,
}) => {
  const preFilledPackages = useMemo(() => {
    const endpoint = (config.apiEndpoint as string)?.trim();
    const arr = Array.isArray(config.packages) ? (config.packages as HolidayPackage[]) : [];
    return endpoint && arr.length > 0 ? arr : null;
  }, [config.apiEndpoint, config.packages]);
  const [apiPackages, setApiPackages] = useState<HolidayPackage[] | null>(preFilledPackages);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = Number(config.pageSize) || 6;
  const [totalItems, setTotalItems] = useState<number | null>(null);

  const bgColor = getStyleValue(styles.backgroundColor as string, 'transparent');
  const padding = getPadding(styles.padding as string);
  const columns = Number(config.columns) || 3;
  const showEnquiryModal = config.showEnquiryModal !== false;

  const cardImageSizes = useMemo(() => {
    const override = (config.imageSizes as string)?.trim();
    if (override) return override;
    switch (columns) {
      case 1: return '(max-width: 768px) 100vw, 1280px';
      case 2: return '(max-width: 768px) 100vw, 50vw';
      default: return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
  }, [columns, config.imageSizes]);

  // Extract element styles from config
  const elementStyles = useMemo(() => {
    return {
      title: applyElementStyles('title', config, undefined, theme.colors),
      categoryBadge: applyElementStyles('categoryBadge', config, undefined, theme.colors),
      price: applyElementStyles('price', config, undefined, theme.colors),
      primaryButton: applyElementStyles('primaryButton', config, undefined, theme.colors),
      secondaryButton: applyElementStyles('secondaryButton', config, undefined, theme.colors),
      card: applyElementStyles('card', config, undefined, theme.colors),
      saveBadge: applyElementStyles('saveBadge', config, undefined, theme.colors),
    };
  }, [config, theme.colors]);

  // Fetch packages from API when endpoint is set (API priority).
  useEffect(() => {
    const endpoint = (config.apiEndpoint as string)?.trim();

    if (!endpoint) {
      setApiPackages(null);
      setIsLoadingApi(false);
      setApiError(null);
      setTotalItems(null);
      return;
    }

    const loadFromApi = async () => {
      setIsLoadingApi(true);
      setApiError(null);

      try {
        // Build URL with pagination parameters
        // Check if endpoint already has query parameters
        const separator = endpoint.includes('?') ? '&' : '?';
        const endpointWithPagination = `${endpoint}${separator}page=${currentPage}&pageSize=${pageSize}`;
        
        const json = await fetchWidgetJson(endpointWithPagination, undefined, 'Holiday Collections');
        if (!json) {
          setApiError('No data returned from API');
          setApiPackages([]);
          setTotalItems(0);
          return;
        }
        
        // Handle different response formats
        let packages: HolidayPackage[] = [];
        let total: number | null = null;
        
        if (isRecord(json)) {
          const response = json as Record<string, unknown>;
          
          // Check if response has pagination metadata (common field names)
          if (typeof response.total === 'number') {
            total = response.total;
          } else if (typeof response.totalCount === 'number') {
            total = response.totalCount;
          } else if (typeof response.count === 'number') {
            total = response.count;
          } else if (typeof response.totalItems === 'number') {
            total = response.totalItems;
          }
          
          // Extract packages from response
          packages = mapToPackages(json);
          
          // If we got packages but no total count, try to infer from response
          if (total === null) {
            // If response has items/packages array and we got fewer items than pageSize,
            // it's likely the last page, so total equals current items
            if (packages.length < pageSize) {
              // Calculate total: (currentPage - 1) * pageSize + current items
              total = (currentPage - 1) * pageSize + packages.length;
            }
            // Otherwise, we can't determine total - will show pagination assuming more pages exist
            // until we get a page with fewer items than pageSize
          }
        } else if (Array.isArray(json)) {
          // Direct array response
          packages = mapToPackages(json);
          // For direct array, if length is less than pageSize, we know it's the last page
          if (packages.length < pageSize) {
            // Calculate total: (currentPage - 1) * pageSize + current items
            total = (currentPage - 1) * pageSize + packages.length;
          }
        } else {
          // Unknown format, try to extract packages anyway
          packages = mapToPackages(json);
        }
        
        setApiPackages(packages);
        setTotalItems(total);
        
        if (packages.length === 0) {
          setApiError('API returned no packages');
        }
      } catch (error) {
        console.error('Holiday Collections fetch failed:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to fetch packages from API');
        setApiPackages([]);
        setTotalItems(0);
      } finally {
        setIsLoadingApi(false);
      }
    };
    
    // Always attempt to load if endpoint exists (even if config object is empty initially)
    // Use endpoint value as dependency to ensure it triggers on changes
    loadFromApi();
  }, [config.apiEndpoint, currentPage, pageSize]); // Include pagination in dependencies

  // Use packages from API or config (mutually exclusive)
  const { packages, totalPages, allPackagesCount } = useMemo(() => {
    const endpoint = (config.apiEndpoint as string)?.trim();
    
    // If API endpoint is provided, ONLY use API data (even if empty)
    if (endpoint) {
      const packages = apiPackages || [];
      let pages: number;
      
      if (totalItems !== null) {
        // Total is known, calculate pages from total
        pages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
      } else {
        // Total is unknown - infer from current page and package count
        if (packages.length === 0) {
          pages = 1;
        } else if (packages.length < pageSize) {
          // Fewer packages than pageSize means this is the last page
          pages = currentPage;
        } else {
          // Exactly pageSize packages - there might be more pages
          // Show at least currentPage + 1 to allow navigation
          pages = currentPage + 1;
        }
      }
      
      return { 
        packages, 
        totalPages: pages,
        allPackagesCount: totalItems
      };
    }
    
    // No API endpoint - use manual packages from config with client-side pagination
    const configPackages = config.packages as HolidayPackage[];
    const allPackages = Array.isArray(configPackages) ? configPackages : [];
    const total = allPackages.length;
    const pages = total > 0 ? Math.ceil(total / pageSize) : 1;
    
    // Calculate pagination slice
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPackages = allPackages.slice(startIndex, endIndex);
    
    return { 
      packages: paginatedPackages, 
      totalPages: pages,
      allPackagesCount: total
    };
  }, [apiPackages, config.packages, config.apiEndpoint, currentPage, pageSize, totalItems]);
  
  // Reset to page 1 when endpoint or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [config.apiEndpoint, pageSize]);

  const openModal = (packageName: string) => {
    if (!isPreviewMode || !showEnquiryModal) return;
    setSelectedPackage(packageName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPackage('');
    setFormData({ name: '', phone: '', email: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPreviewMode) return;
    
    const baseMessage = getLocalizedValue(config.enquirySuccessMessage, lang) || 'Enquiry Sent! One of our specialists will be in touch shortly.';
    const message = selectedPackage ? `${baseMessage} about ${selectedPackage}.` : `${baseMessage}.`;
    alert(message);
    closeModal();
  };

  const StarIcon = getIcon('star');
  const PhoneIcon = Phone;
  const CheckCircleIcon = CheckCircle;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const hasApiEndpoint = Boolean((config.apiEndpoint as string)?.trim());

  return (
    <>
      <div
        style={{
          backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
          padding,
          borderRadius: `${styles.borderRadius || 0}px`,
          opacity: ((styles.opacity as number) ?? 100) / 100,
        }}
        className="min-h-screen py-10 px-4"
      >
        <div className="max-w-7xl w-full mx-auto">
          {getLocalizedValue(config.title, lang) && (
            <div className="text-center mb-10">
              <h1
                className="text-3xl md:text-4xl font-extrabold mb-2"
                style={{ ...elementStyles.title, color: elementStyles.title.color || theme.colors.text }}
              >
                {getLocalizedValue(config.title, lang)}
              </h1>
              {getLocalizedValue(config.subtitle, lang) && (
                <p style={{ color: theme.colors.text, opacity: 0.7 }}>
                  {getLocalizedValue(config.subtitle, lang)}
                </p>
              )}
            </div>
          )}

          {isLoadingApi ? (
            <div className="flex h-64 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p>Loading packages{currentPage > 1 ? ` (page ${currentPage})` : ''}...</p>
              </div>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex h-64 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              {apiError ? (
                <div className="text-center max-w-md">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <p className="text-destructive font-semibold mb-1">Failed to load packages</p>
                  <p className="text-xs text-muted-foreground">{apiError}</p>
                </div>
              ) : hasApiEndpoint ? (
                <p>No packages found from API endpoint.</p>
              ) : (
                <p>Add holiday packages to preview the collection.</p>
              )}
            </div>
          ) : (
            <>
              <div className={cn('grid gap-8', gridCols)}>
                {packages.map((pkg, index) => {
                const rating = Math.max(1, Math.min(5, pkg.rating || 5));
                const currency = pkg.currency || '£';
                const hasSave = (pkg.savePercentage || 0) > 0;
                // Use locationName + index as key for better uniqueness across pages
                const locationStr = getLocalizedValue(pkg.locationName, lang);
                const packageKey = locationStr
                  ? `package-${locationStr}-${(currentPage - 1) * pageSize + index}`
                  : `package-${(currentPage - 1) * pageSize + index}`;

                return (
                  <article
                    key={packageKey}
                    className={cn(
                      'bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-100 group',
                      'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
                    )}
                    style={elementStyles.card}
                  >
                    {/* Image Header */}
                    <div className="relative h-60 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      
                      {/* Logo Badge - Optional, can be configured later */}
                      <div className="absolute top-4 left-4 z-20 bg-white/95 p-1.5 rounded-full shadow-md">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      {/* Save Badge */}
                      {hasSave && (
                        <div
                          className="absolute top-4 right-4 z-20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide"
                          style={{
                            ...elementStyles.saveBadge,
                            backgroundColor: elementStyles.saveBadge.backgroundColor || theme.colors.accent || '#e91e63',
                            color: elementStyles.saveBadge.color || '#ffffff',
                          }}
                        >
                          Save {pkg.savePercentage}%
                        </div>
                      )}

                      {/* Location Label */}
                      <div className="absolute bottom-4 left-4 z-20 text-white">
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 fill-gray-400'
                              )}
                            />
                          ))}
                        </div>
                        <h3 className="font-bold text-lg leading-none drop-shadow-md">
                          {getLocalizedValue(pkg.locationName, lang)}
                        </h3>
                      </div>

                      {pkg.imageUrl && (
                        <Image
                          src={pkg.imageUrl}
                          alt={getLocalizedValue(pkg.locationName, lang) || 'Holiday package'}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes={cardImageSizes}
                          priority={index === 0}
                        />
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="p-6 flex flex-col flex-grow justify-between">
                      <div>
                        {pkg.category && (
                          <div
                            className="text-xs font-bold uppercase tracking-wider mb-2"
                            style={{
                              ...elementStyles.categoryBadge,
                              color: elementStyles.categoryBadge.color || theme.colors.primary,
                            }}
                          >
                            {pkg.category}
                          </div>
                        )}
                        {getLocalizedValue(pkg.description, lang) && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {getLocalizedValue(pkg.description, lang)}
                          </p>
                        )}

                        {/* Itinerary */}
                        {pkg.itinerary && pkg.itinerary.length > 0 && (
                          <div className="space-y-2 mb-6">
                            {pkg.itinerary.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center text-xs text-gray-700 bg-gray-50 p-2 rounded-lg"
                              >
                                <span className="font-bold text-gray-900 w-16">
                                  {item.nights || ''}
                                </span>
                                <div className="w-px h-3 bg-gray-300 mx-2" />
                                <span>{item.hotel || ''}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Amenities */}
                        <div className="flex justify-between border-t border-b border-gray-100 py-3 mb-4">
                          {[
                            { type: 'flights', icon: Plane, label: 'Flights' },
                            { type: 'transfers', icon: Bus, label: 'Transfer' },
                            { type: 'baggage', icon: Luggage, label: 'Baggage' },
                            { type: 'protected', icon: ShieldCheck, label: 'Protected' },
                          ].map(({ type, icon: Icon, label }) => {
                            const hasAmenity = pkg.amenities?.some(
                              (a) => a.type === type
                            ) ?? false;
                            return (
                              <div
                                key={type}
                                className="flex flex-col items-center gap-1"
                                title={label}
                              >
                                <Icon
                                  className={cn(
                                    'w-4 h-4',
                                    hasAmenity ? 'text-gray-600' : 'text-gray-300'
                                  )}
                                />
                                <span className="text-[10px] text-gray-500">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Footer */}
                      <div>
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            {hasSave && pkg.originalPrice && (
                              <p className="text-[10px] text-gray-400 line-through">
                                was {currency}
                                {pkg.originalPrice.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">from</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span
                                className="text-lg font-bold"
                                style={{
                                  ...elementStyles.price,
                                  color: elementStyles.price.color || theme.colors.primary,
                                }}
                              >
                                {currency}
                              </span>
                              <span
                                className="text-3xl font-extrabold"
                                style={{
                                  ...elementStyles.price,
                                  color: elementStyles.price.color || theme.colors.primary,
                                }}
                              >
                                {pkg.discountedPrice?.toLocaleString() || '0'}
                              </span>
                              <span className="text-sm font-medium text-gray-500">pp</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 border py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                            style={{
                              ...elementStyles.secondaryButton,
                              borderColor: elementStyles.secondaryButton.borderColor || theme.colors.primary,
                              color: elementStyles.secondaryButton.color || theme.colors.primary,
                              backgroundColor: elementStyles.secondaryButton.backgroundColor || 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              const hoverBg = elementStyles.secondaryButton.backgroundColor || `${theme.colors.primary}15`;
                              e.currentTarget.style.backgroundColor = hoverBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = elementStyles.secondaryButton.backgroundColor || 'transparent';
                            }}
                            onClick={(e) => {
                              if (!isPreviewMode) {
                                e.preventDefault();
                                return;
                              }
                              // In preview mode, could trigger phone call or action
                            }}
                            disabled={!isPreviewMode}
                          >
                            <PhoneIcon className="w-3 h-3" /> Call
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              if (!isPreviewMode) {
                                e.preventDefault();
                                return;
                              }
                              openModal(pkg.locationName || '');
                            }}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors text-white"
                            style={{
                              ...elementStyles.primaryButton,
                              backgroundColor: elementStyles.primaryButton.backgroundColor || theme.colors.accent || '#e91e63',
                              color: elementStyles.primaryButton.color || '#ffffff',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            disabled={!isPreviewMode}
                          >
                            View Deal
                          </button>
                        </div>
                        {pkg.depositAmount && (
                          <p
                            className="text-[10px] text-center mt-2 flex items-center justify-center gap-1"
                            style={{ color: '#16a34a' }}
                          >
                            <CheckCircleIcon className="w-3 h-3" /> Secure with{' '}
                            {pkg.depositAmount} deposit
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={cn(
                            'cursor-pointer',
                            currentPage === 1 && 'pointer-events-none opacity-50 cursor-not-allowed'
                          )}
                        />
                      </PaginationItem>
                      
                      {/* Page Numbers */}
                      {(() => {
                        const pages: (number | 'ellipsis')[] = [];
                        const maxVisible = 7;
                        
                        if (totalPages <= maxVisible) {
                          // Show all pages if total is small
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);
                          
                          if (currentPage > 3) {
                            pages.push('ellipsis');
                          }
                          
                          // Show pages around current
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          
                          for (let i = start; i <= end; i++) {
                            if (i !== 1 && i !== totalPages) {
                              pages.push(i);
                            }
                          }
                          
                          if (currentPage < totalPages - 2) {
                            pages.push('ellipsis');
                          }
                          
                          // Always show last page
                          if (totalPages > 1) {
                            pages.push(totalPages);
                          }
                        }
                        
                        return pages.map((page, idx) => {
                          if (page === 'ellipsis') {
                            return (
                              <PaginationItem key={`ellipsis-${idx}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        });
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={cn(
                            'cursor-pointer',
                            currentPage === totalPages && 'pointer-events-none opacity-50 cursor-not-allowed'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              
              {/* Page Info */}
              {totalPages > 1 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {allPackagesCount !== null ? (
                    <>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, allPackagesCount)} of {allPackagesCount} packages</>
                  ) : (
                    <>Showing page {currentPage} of {totalPages}</>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            className="absolute w-[90%] max-w-md bg-white rounded-xl shadow-2xl p-6 transform transition-all scale-100 opacity-100 z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id="modal-title" className="text-xl font-bold text-gray-800">
                Enquire: {selectedPackage}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="enquiry-name"
                  className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                >
                  Full Name
                </label>
                <input
                  id="enquiry-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label
                  htmlFor="enquiry-phone"
                  className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="enquiry-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="07700 900000"
                />
              </div>
              <div>
                <label
                  htmlFor="enquiry-email"
                  className="block text-xs font-semibold text-gray-600 uppercase mb-1"
                >
                  Email Address
                </label>
                <input
                  id="enquiry-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-white"
                style={{ backgroundColor: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Request Callback <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-4">
              By submitting this form you agree to our privacy policy.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default HolidayCollectionsRenderer;
