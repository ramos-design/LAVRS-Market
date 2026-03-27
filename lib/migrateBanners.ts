/**
 * Migration utility to convert data URL banners to Supabase Storage.
 * Run this once to fix existing banners.
 */
import { supabase } from './supabase';
import { uploadBannerImage, deleteBannerImage } from './storage';

export async function migrateBannersToStorage(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // Fetch all banners
    const { data: banners, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order');

    if (fetchError) {
      throw new Error(`Failed to fetch banners: ${fetchError.message}`);
    }

    if (!banners || banners.length === 0) {
      return { success: 0, failed: 0, errors: ['No banners found'] };
    }

    console.log(`🔄 Migrating ${banners.length} banners...`);

    for (const banner of banners) {
      try {
        const imageUrl = banner.image || '';

        // Skip if not data URL
        if (!imageUrl.startsWith('data:')) {
          console.log(`✓ Banner "${banner.title}" already on Storage or external URL`);
          success++;
          continue;
        }

        console.log(`📤 Converting "${banner.title}" (${(imageUrl.length / 1024 / 1024).toFixed(1)} MB)...`);

        // Convert data URL to blob
        const blob = await fetch(imageUrl).then(res => res.blob());

        // Determine extension from data URL
        const mimeMatch = imageUrl.match(/data:image\/(.*?);/);
        const ext = mimeMatch?.[1] || 'jpg';

        // Create File object
        const file = new File([blob], `banner-${banner.id}.${ext}`, {
          type: `image/${ext}`,
        });

        // Upload to storage
        const newUrl = await uploadBannerImageDirect(file, banner.id);

        // Update banner in DB
        const { error: updateError } = await supabase
          .from('banners')
          .update({ image: newUrl })
          .eq('id', banner.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        console.log(`✅ "${banner.title}" migrated successfully`);
        success++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Failed to migrate "${banner.title}": ${msg}`);
        errors.push(`${banner.title}: ${msg}`);
        failed++;
      }
    }

    console.log(`\n📊 Migration complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Migration failed: ${msg}`);
    return { success: 0, failed, errors: [msg] };
  }
}

/**
 * Helper to upload file to storage (used by migration)
 */
async function uploadBannerImageDirect(
  file: File,
  bannerId: string
): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `banner-images/${bannerId}-${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from('banners')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  if (!data?.path) throw new Error('No path returned from storage');

  const { data: urlData } = supabase.storage
    .from('banners')
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) throw new Error('Could not get public URL');

  return urlData.publicUrl;
}
