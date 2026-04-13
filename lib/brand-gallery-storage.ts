/**
 * Supabase Storage utilities for brand gallery images and logos.
 * Handles upload, deletion, and URL retrieval for the brand-gallery bucket.
 */
import { supabase } from './supabase';
import { compressGalleryImage, compressLogoImage } from './image-compression';

const BUCKET = 'brand-gallery';
const MIN_GALLERY_IMAGES = 4;
const MAX_GALLERY_IMAGES = 10;

const IMAGE_SIGNATURES: [number[], string][] = [
    [[0xFF, 0xD8, 0xFF], 'JPEG'],
    [[0x89, 0x50, 0x4E, 0x47], 'PNG'],
    [[0x52, 0x49, 0x46, 0x46], 'WebP'], // RIFF header (WebP starts with RIFF....WEBP)
    [[0x47, 0x49, 0x46, 0x38], 'GIF'],
];

async function validateImageFile(file: File, maxSizeMB = 5): Promise<void> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Soubor musí být obrázek (JPG, PNG, WebP).');
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`Obrázek je příliš velký (max ${maxSizeMB} MB).`);
    }
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isValid = IMAGE_SIGNATURES.some(([sig]) =>
        sig.every((byte, i) => header[i] === byte)
    );
    if (!isValid) {
        throw new Error('Neplatný formát souboru. Povolené formáty: JPG, PNG, WebP, GIF.');
    }
}

function generatePath(userId: string, brandId: string, type: 'logo' | 'gallery', fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    return `${userId}/${brandId}/${type}/${timestamp}-${safeName}`;
}

async function uploadFile(filePath: string, file: File): Promise<string> {
    const { data: uploadData, error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/webp',
        });

    if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Nahrávání selhalo: ${error.message}`);
    }

    const actualPath = uploadData?.path || filePath;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(actualPath);
    if (!data?.publicUrl) {
        throw new Error('Upload se podařil, ale nelze získat URL.');
    }
    return data.publicUrl;
}

function extractStoragePath(publicUrl: string): string | null {
    const match = publicUrl.match(new RegExp(`${BUCKET}/(.+)$`));
    return match?.[1] || null;
}

export async function uploadBrandLogo(
    file: File,
    userId: string,
    brandId: string
): Promise<string> {
    await validateImageFile(file);
    const compressed = await compressLogoImage(file);
    const path = generatePath(userId, brandId, 'logo', compressed.name);
    return uploadFile(path, compressed);
}

export async function uploadBrandGalleryImage(
    file: File,
    userId: string,
    brandId: string,
    currentCount: number
): Promise<string> {
    if (currentCount >= MAX_GALLERY_IMAGES) {
        throw new Error(`Maximální počet fotek v galerii je ${MAX_GALLERY_IMAGES}.`);
    }
    await validateImageFile(file);
    const compressed = await compressGalleryImage(file);
    const path = generatePath(userId, brandId, 'gallery', compressed.name);
    return uploadFile(path, compressed);
}

export async function deleteBrandImage(publicUrl: string): Promise<void> {
    const path = extractStoragePath(publicUrl);
    if (!path) return;

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
        console.error('Failed to delete brand image:', error);
    }
}

export { MIN_GALLERY_IMAGES, MAX_GALLERY_IMAGES };
