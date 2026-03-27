import React from 'react';

const BannerSkeleton: React.FC = () => {
  return (
    <div className="relative h-72 md:h-80 overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/30 text-center">
          <div className="h-12 w-48 bg-gray-300 rounded mx-auto mb-4"></div>
          <div className="h-4 w-64 bg-gray-300 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default BannerSkeleton;
