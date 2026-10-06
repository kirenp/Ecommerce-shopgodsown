'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ShimmerImageProps extends ImageProps {
  theme?: 'light' | 'dark';
}

export default function ShimmerImage({
  theme = 'light',
  className = '',
  alt,
  onLoad,
  ...props
}: ShimmerImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && (
        <div
          className={`absolute inset-0 z-[1] overflow-hidden pointer-events-none transition-opacity duration-500 ${
            theme === 'dark' ? 'bg-[#151515]' : 'bg-[#EAE5DC]'
          }`}
          aria-hidden="true"
        >
          <div
            className={`absolute inset-0 -translate-x-full animate-shimmer-sweep ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent'
                : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
            }`}
          />
        </div>
      )}
      <Image
        alt={alt || ''}
        ref={(img) => {
          if (img && img.complete && img.naturalWidth > 0 && !isLoaded) {
            setIsLoaded(true);
          }
        }}
        className={`${className} transition-opacity duration-500 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        {...props}
      />
    </>
  );
}
