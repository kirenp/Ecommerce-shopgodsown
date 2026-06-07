'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePreview } from '@/lib/preview';

interface CollectionCarouselProps {
  collections: any[];
}

export default function CollectionCarousel({ collections }: CollectionCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { getPreviewPath } = usePreview();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // Infinite-like wrap around
      if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (direction === 'left' && scrollLeft <= 10) {
        scrollContainerRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollWidth > clientWidth) {
          scroll('right');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [collections.length]);

  return (
    <div className="relative group/carousel w-full bg-transparent">
      {/* Horizontal Scroll Area */}
      <div 
        ref={scrollContainerRef}
        className="flex space-x-6 overflow-x-auto pb-12 no-scrollbar scroll-smooth px-4 bg-transparent"
      >
        {collections.map((collection: any) => (
          <Link
            key={collection.id}
            href={getPreviewPath(`/collections/${collection.handle}`)}
            className="group relative flex-shrink-0 w-[280px] sm:w-[350px] md:w-[400px] aspect-[4/5] rounded-[2rem] shadow-xl overflow-hidden isolate"
          >
            <NextImage
              src={collection.image}
              alt={collection.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 rounded-[2rem]"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 rounded-[2rem] pointer-events-none" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter mb-2">
                {collection.title}
              </h3>
              <div className="flex items-center space-x-2 text-luxury-gold text-[10px] tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <span>Explore Drop</span>
                <div className="w-8 h-[1px] bg-luxury-gold" />
              </div>
            </div>
          </Link>
        ))}
        {/* Spacer to prevent right edge clipping on the last child */}
        <div className="w-4 md:w-8 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Centered Scroll Navigation Buttons */}
      <div className="flex items-center justify-center space-x-6 mt-4 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 transition-opacity duration-500">
        <button 
          onClick={() => scroll('left')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 transition-all duration-300 shadow-sm backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 transition-all duration-300 shadow-sm backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
