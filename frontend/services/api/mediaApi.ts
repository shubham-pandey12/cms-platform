import type { MediaItem, MediaItemDto } from '@/types/cms';
import { getApiBaseUrl } from '../apiClient';

function mapMediaItemDto(item: MediaItemDto): MediaItem {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    thumbnail: item.thumbnail,
    type: item.type,
    size: item.size,
    brandId: item.brandId,
    folder: item.folder,
    alt: item.alt,
    uploadedBy: item.uploadedBy,
    uploadedAt: new Date(item.uploadedAt),
    storageProvider: item.storageProvider,
  };
}

export async function getMediaLibrary(brandId?: string): Promise<MediaItem[]> {
  try {
    const query = brandId ? `?brandId=${brandId}` : '';
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/media${query}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch media library');
      return [];
    }

    const data: MediaItemDto[] = await response.json();
    return data.map(mapMediaItemDto);
  } catch (error) {
    console.error('Failed to get media library:', error);
    return [];
  }
}

export type MediaUploadOutputFormat = 'original' | 'webp';

export async function uploadMediaItem(params: {
  file: File;
  brandId: string;
  folder?: string | null;
  alt?: string;
  /** For JPEG/PNG/WebP/AVIF only, server may re-encode to WebP; other types ignore this. */
  outputFormat?: MediaUploadOutputFormat;
}): Promise<MediaItem | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('brandId', params.brandId);
    if (params.folder) formData.append('folder', params.folder);
    if (params.alt) formData.append('alt', params.alt);
    const fmt = params.outputFormat ?? 'original';
    if (fmt !== 'original') {
      formData.append('outputFormat', fmt);
    }

    const response = await fetch(`${baseUrl}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to upload media:', text);
      return null;
    }

    const data: MediaItemDto = await response.json();
    return mapMediaItemDto(data);
  } catch (error) {
    console.error('Failed to upload media item:', error);
    return null;
  }
}

export async function updateMediaItem(
  id: string,
  params: { name?: string; alt?: string; folder?: string }
): Promise<MediaItem | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/media/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to update media:', text);
      return null;
    }

    const data: MediaItemDto = await response.json();
    return mapMediaItemDto(data);
  } catch (error) {
    console.error('Failed to update media item:', error);
    return null;
  }
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/media/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to delete media:', text);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete media item:', error);
    return false;
  }
}
