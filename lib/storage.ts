/**
 * Supabase Storage utilities for uploading images.
 * Handles banner and event image uploads efficiently.
 */
import { supabase } from './supabase';

const BANNER_BUCKET = 'banners';
const BANNER_FOLDER = 'banner-images';

export async function uploadBannerImage(
  file: File,
  bannerId: string
): Promise<string> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Soubor musí být obrázek');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Obrázek je příliš velký (max 5 MB)');
  }

  // Create filename with timestamp to avoid conflicts
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${BANNER_FOLDER}/${bannerId}-${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(filename, file, {
      cacheControl: '3600', // 1 hour
      upsert: false, // Don't overwrite if exists
    });

  if (error) {
    throw error;
  }

  if (!data?.path) {
    throw new Error('Upload se nezdařil - chybí path');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BANNER_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('Nelze získat public URL obrázku');
  }

  return urlData.publicUrl;
}

export async function deleteBannerImage(imageUrl: string): Promise<void> {
  // Extract path from public URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/banners/banner-images/...
  const pathMatch = imageUrl.match(new RegExp(`${BANNER_BUCKET}/(.+)$`));

  if (!pathMatch?.[1]) {
    // URL is not from our storage (e.g., external image), skip deletion
    return;
  }

  const path = pathMatch[1];

  const { error } = await supabase.storage
    .from(BANNER_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Failed to delete banner image:', error);
    // Don't throw - deletion failure shouldn't block the app
  }
}
