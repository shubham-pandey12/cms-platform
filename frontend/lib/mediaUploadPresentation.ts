import type { LucideIcon } from 'lucide-react';
import { File, FileJson, FileSpreadsheet, FileText, Film, Presentation } from 'lucide-react';
import type { MediaItem } from '@/types/cms';

/** Matches server allowlist in MediaService (images + documents). */
export const MEDIA_LIBRARY_FILE_ACCEPT = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/csv',
  'application/json',
  '.pdf',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.docx',
  '.xlsx',
  '.pptx',
].join(',');

const rasterWebpMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

/** Same as server IsRasterWebpCandidate — JPEG/PNG/WebP/AVIF may be stored as WebP. */
export function canRasterWebpEncode(file: File | null): boolean {
  if (!file?.type) return false;
  return rasterWebpMime.has(file.type);
}

/** Bitmap-friendly images for the crop tool (excludes SVG). */
export function canUseCropTool(file: File | null): boolean {
  if (!file?.type) return false;
  return file.type.startsWith('image/') && file.type !== 'image/svg+xml';
}

/** Icon for grid/list when the asset is not shown as an image thumbnail. */
export function getMediaLibraryPlaceholderIcon(type: MediaItem['type'], fileName: string): LucideIcon {
  if (type === 'video') {
    return Film;
  }
  if (type !== 'document') {
    return File;
  }
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
  switch (ext) {
    case '.pdf':
    case '.txt':
    case '.md':
    case '.csv':
      return FileText;
    case '.json':
      return FileJson;
    case '.xlsx':
      return FileSpreadsheet;
    case '.pptx':
      return Presentation;
    case '.docx':
      return FileText;
    default:
      return File;
  }
}
