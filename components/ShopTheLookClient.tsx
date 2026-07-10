'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LookSlide } from './ShopTheLook';

interface ShopTheLookClientProps {
  slides: LookSlide[];
}

export default function ShopTheLookClient({ slides }: ShopTheLookClientProps) {
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false); // locked = clicked open
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [naturalSizes, setNaturalSizes] = useState<{ [key: number]: { w: number; h: number } }>({});
  const [hotspotCoords, setHotspotCoords] = useState<{ [key: number]: { x: number; y: number } }>({});

  useEffect(() => {
    const updateCoords = () => {
      const newCoords: { [key: number]: { x: number; y: number } } = {};
      containerRefs.current.forEach((el, index) => {
        if (!el || !naturalSizes[index]) return;
        const { w: imgW, h: imgH } = naturalSizes[index];
        const rect = el.getBoundingClientRect();
        const containerW = rect.width;
        const containerH = rect.height;
        const scale = Math.max(containerW / imgW, containerH / imgH);
        const renderedW = imgW * scale;
        const renderedH = imgH * scale;
        const offsetX = (renderedW - containerW) * slides[index].objectPosition.x;
        const offsetY = (renderedH - containerH) * slides[index].objectPosition.y;
        newCoords[index] = {
          x: (slides[index].plusPosition.x * renderedW) - offsetX,
          y: (slides[index].plusPosition.y * renderedH) - offsetY,
        };
      });
      setHotspotCoords(newCoords);
    };
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [naturalSizes, slides]);

  const showPopup = useCallback((index: number) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setActivePopup(index);
  }, []);

  const scheduleHide = useCallback((index: number) => {
    // Don't hide if user clicked to lock it open
    if (isLocked) return;
    hideTimerRef.current = setTimeout(() => {
      setActivePopup((current) => (current === index ? null : current));
    }, 300); // small delay so user can move to the popup card
  }, [isLocked]);

  const toggleLock = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked && activePopup === index) {
      // Clicking again on same → unlock and close
      setIsLocked(false);
      setActivePopup(null);
    } else {
      // Click to lock open
      setIsLocked(true);
      setActivePopup(index);
    }
  }, [isLocked, activePopup]);

  const handleSectionClick = useCallback(() => {
    // Close popup if locked and user clicks outside
    if (isLocked) {
      setIsLocked(false);
      setActivePopup(null);
    }
  }, [isLocked]);

  return (
    <section
      className="relative overflow-hidden bg-transparent"
      onClick={handleSectionClick}
    >
      {/* Section Header — Minimal, editorial */}
      <div className="px-6 md:px-12 lg:px-16 pt-16 md:pt-20 pb-6 md:pb-8">
        <p className="text-[9px] text-gray-500 tracking-[0.5em] uppercase mb-2">
          Editorial
        </p>
        <h2 className="text-2xl md:text-3xl font-light text-black tracking-tight">
          Shop the Look
        </h2>
      </div>

      {/* Full-Bleed Lookbook Grid */}
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row w-full gap-4">
          {slides.map((slide, index) => {
            const product = slide.product;
            const isPopupOpen = activePopup === index;

            return (
              <div
                key={index}
                ref={(el) => { containerRefs.current[index] = el; }}
                className={`relative w-full ${slide.layoutClass} h-[85vh] overflow-hidden group rounded-xl bg-black/20`}
              >
                {/* Full-Bleed Lifestyle Image */}
                <Image
                  src={slide.lifestyleImage}
                  alt={product?.title || 'Shop the look'}
                  fill
                  style={{ objectPosition: `${slide.objectPosition.x * 100}% ${slide.objectPosition.y * 100}%` }}
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    setNaturalSizes(prev => ({
                      ...prev,
                      [index]: { w: target.naturalWidth, h: target.naturalHeight }
                    }));
                  }}
                />

                {/* Cinematic gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none rounded-xl" />

                {/* Hotspot Container */}
                <div
                  className="absolute z-20"
                  style={{
                    left: hotspotCoords[index] ? `${hotspotCoords[index].x}px` : `${slide.plusPosition.x * 100}%`,
                    top: hotspotCoords[index] ? `${hotspotCoords[index].y}px` : `${slide.plusPosition.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => showPopup(index)}
                  onMouseLeave={() => scheduleHide(index)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pulsing red ring — heartbeat effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="absolute w-8 h-8 md:w-9 md:h-9 rounded-full border border-[#ff1a1a]/70 stl-pulse-ring shadow-[0_0_15px_rgba(255,26,26,0.6)]" />
                    <span className="absolute w-8 h-8 md:w-9 md:h-9 rounded-full border border-[#ff1a1a]/50 stl-pulse-ring stl-pulse-delayed shadow-[0_0_12px_rgba(255,26,26,0.4)]" />
                    <span className="absolute w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#ff1a1a]/20 stl-glow" />
                  </div>

                  {/* Plus icon button */}
                  <button
                    onClick={(e) => toggleLock(index, e)}
                    className={`relative w-7 h-7 md:w-8 md:h-8 rounded-full border border-white
                      flex items-center justify-center backdrop-blur-md transition-all duration-300 cursor-pointer z-10
                      ${isPopupOpen
                        ? 'bg-white/90 text-black scale-105'
                        : 'bg-black/45 text-white hover:bg-white/80 hover:text-black hover:scale-105'
                      }`}
                    aria-label={`View ${product?.title || 'product'}`}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className={`transition-transform duration-300 ${isPopupOpen ? 'rotate-45' : ''}`}
                    >
                      <line x1="8" y1="3" x2="8" y2="13" />
                      <line x1="3" y1="8" x2="13" y2="8" />
                    </svg>
                  </button>

                  {/* Product Popup Card — positioned relative to hotspot */}
                  {isPopupOpen && product && (
                    <div
                      className={`absolute z-40 ${
                        index === 0
                          ? 'left-full ml-3 top-0 -translate-y-1/4'
                          : 'right-full mr-3 top-0 -translate-y-1/4'
                      }`}
                      onMouseEnter={() => showPopup(index)}
                      onMouseLeave={() => scheduleHide(index)}
                      style={{
                        animation: 'stlCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      }}
                    >
                      <Link
                        href={`/dev-preview/products/${product.handle}`}
                        className="block w-[175px] md:w-[195px] bg-white rounded-xl overflow-hidden 
                          shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_60px_rgba(0,0,0,0.7)] 
                          transition-all duration-300 group/card"
                      >
                        {/* Main Product Image */}
                        <div className="relative aspect-[4/5] bg-[#f5f5f5] overflow-hidden">
                          <Image
                            src={product.images[0]?.url || ''}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                            sizes="195px"
                          />
                        </div>

                        {/* Product Thumbnails Row */}
                        {product.images.length > 1 && (
                          <div className="flex gap-1 px-2.5 pt-2">
                            {product.images.slice(1, 4).map((img, i) => (
                              <div
                                key={i}
                                className="relative w-11 h-11 rounded-md overflow-hidden bg-[#eee] border border-gray-100"
                              >
                                <Image
                                  src={img.url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Color Swatches */}
                        {product.colors && product.colors.length > 0 && (
                          <div className="flex gap-1.5 px-2.5 pt-2">
                            {product.colors.map((colorObj, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                style={{ backgroundColor: colorObj.color?.toLowerCase() || '#000' }}
                                title={colorObj.label}
                              />
                            ))}
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="px-2.5 pb-2.5 pt-1.5">
                          <p className="text-[8px] text-gray-400 uppercase tracking-[0.15em] mb-0.5 font-medium">
                            Shop Now →
                          </p>
                          <p className="text-[11px] font-semibold text-black leading-tight line-clamp-2">
                            {product.title}
                          </p>
                          {product.price && product.price !== '0.0' && (
                            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                              ₹{parseFloat(product.price).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Bottom editorial label */}
                <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 z-10 pointer-events-none">
                  <p className="text-[9px] text-white/40 tracking-[0.4em] uppercase font-light">
                    {index === 0 ? '01' : '02'} / Look
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 py-8">
        {[0, 1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dot === 0
                ? 'bg-white/80 w-5'
                : 'bg-white/20 w-1.5'
            }`}
          />
        ))}
      </div>

      {/* Scoped Animation Styles */}
      <style jsx global>{`
        .stl-pulse-ring {
          animation: stlPulse 1.8s ease-out infinite;
        }
        .stl-pulse-delayed {
          animation-delay: 0.9s;
        }
        .stl-glow {
          animation: stlGlow 1.8s ease-out infinite;
        }

        @keyframes stlPulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
            border-width: 2px;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
            border-width: 1px;
          }
        }

        @keyframes stlGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes stlCardIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(-25%) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
