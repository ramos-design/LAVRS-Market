import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
    alt?: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, currentIndex, onClose, onNavigate, alt }) => {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
            if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [currentIndex, images.length, onClose, onNavigate]);

    if (!images[currentIndex]) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
                <X size={20} />
            </button>

            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs font-bold px-3 py-1.5">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Prev */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <ChevronLeft size={22} />
                </button>
            )}

            {/* Next */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <ChevronRight size={22} />
                </button>
            )}

            {/* Image */}
            <img
                src={images[currentIndex]}
                alt={alt || `Fotka ${currentIndex + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="relative z-[1] max-w-[90vw] max-h-[85vh] object-contain shadow-2xl"
            />
        </div>
    );
};

export default ImageLightbox;
