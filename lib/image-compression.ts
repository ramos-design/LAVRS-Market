/**
 * Client-side image compression using Canvas API.
 * Compresses images before uploading to Supabase Storage.
 */

interface CompressOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0-1
    outputType?: 'image/jpeg' | 'image/webp';
}

const GALLERY_OPTIONS: CompressOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    outputType: 'image/webp',
};

const LOGO_OPTIONS: CompressOptions = {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.85,
    outputType: 'image/webp',
};

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

async function compressImage(file: File, options: CompressOptions): Promise<File> {
    // Skip compression for very small files (< 100KB)
    if (file.size < 100 * 1024) {
        return file;
    }

    const img = await loadImage(file);

    let { width, height } = img;
    const { maxWidth, maxHeight, quality, outputType } = options;

    // Scale down proportionally
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    ctx.drawImage(img, 0, 0, width, height);

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    const mimeType = outputType || 'image/webp';
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
            mimeType,
            quality
        );
    });

    const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}

export async function compressGalleryImage(file: File): Promise<File> {
    return compressImage(file, GALLERY_OPTIONS);
}

export async function compressLogoImage(file: File): Promise<File> {
    return compressImage(file, LOGO_OPTIONS);
}
