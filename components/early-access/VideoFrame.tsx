'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';

interface VideoFrameProps {
  shouldPlay?: boolean;
}

export default function VideoFrame({ shouldPlay = false }: VideoFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted so it autoplays silently in the background
  const [size, setSize] = useState({ width: 420, height: 260 });

  // Measure container size dynamically to draw the custom frame paths
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Synchronize playing and handle browser autoplay sound restrictions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldPlay) return;

    video.muted = isMuted;

    video.play().catch((err) => {
      console.log('Video playback error:', err);
    });
  }, [isMuted, shouldPlay]);

  // Listen for transition/entry from the splash overlay to unmute the audio
  useEffect(() => {
    if (shouldPlay) {
      setIsMuted(false);
    }
  }, [shouldPlay]);

  // Fullscreen toggle
  const toggleFullscreen = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error attempting to toggle fullscreen:', err);
    }
  };

  // Toggle mute/unmute
  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // Listen for fullscreen change events (e.g. if exited via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Frame dimension math for SVG drawing
  const w = size.width;
  const h = size.height;
  
  // Outer frame corner cut (chamfer) size
  const cOuter = 16; 
  // Inset size of the video container from the outer frame edge
  const inset = 6; 
  // Inner frame corner cut (chamfer) size, mathematically aligned
  const cInner = cOuter - inset; // 10px

  return (
    <div 
      ref={containerRef}
      className="group relative w-full max-w-[420px] aspect-[16/10] select-none flex items-center justify-center"
      style={{
        animation: 'eaFadeSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards',
        opacity: 0,
      }}
    >
      {/* ── Outer SVG Frame Border ── */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(193, 18, 31, 0.45))',
        }}
      >
        {/* Outer Red Line */}
        <path
          d={`M ${cOuter},1 L ${w-cOuter},1 L ${w-1},${cOuter} L ${w-1},${h-cOuter} L ${w-cOuter},${h-1} L ${cOuter},${h-1} L 1,${h-cOuter} L 1,${cOuter} Z`}
          fill="none"
          stroke="#C1121F"
          strokeWidth="1.5"
          className="transition-colors duration-500 group-hover:stroke-[#e52a39]"
        />

        {/* Inner Metallic Border Base */}
        <path
          d={`M ${cOuter+2},3.5 L ${w-cOuter-2},3.5 L ${w-3.5},${cOuter+2} L ${w-3.5},${h-cOuter-2} L ${w-cOuter-2},${h-3.5} L ${cOuter+2},${h-3.5} L 3.5,${h-cOuter-2} L 3.5,${cOuter+2} Z`}
          fill="none"
          stroke="#111111"
          strokeWidth="3.5"
        />

        {/* Inner Metallic Specular Line */}
        <path
          d={`M ${cOuter+2},3.5 L ${w-cOuter-2},3.5 L ${w-3.5},${cOuter+2} L ${w-3.5},${h-cOuter-2} L ${w-cOuter-2},${h-3.5} L ${cOuter+2},${h-3.5} L 3.5,${h-cOuter-2} L 3.5,${cOuter+2} Z`}
          fill="none"
          stroke="#2d2d2d"
          strokeWidth="1"
        />

        {/* Inner Thin Red Accent Line */}
        <path
          d={`M ${cOuter+4},5.5 L ${w-cOuter-4},5.5 L ${w-5.5},${cOuter+4} L ${w-5.5},${h-cOuter-4} L ${w-cOuter-4},${h-5.5} L ${cOuter+4},${h-5.5} L 5.5,${h-cOuter-4} L 5.5,${cOuter+4} Z`}
          fill="none"
          stroke="rgba(193, 18, 31, 0.4)"
          strokeWidth="1"
        />

        {/* Cyberpunk Diagonal Red Slashes on the Right Border */}
        <g 
          transform={`translate(${w - 5.5}, ${h / 2 - 12})`}
          className="transition-opacity duration-300 group-hover:opacity-100"
        >
          <line x1="5.5" y1="0" x2="0" y2="6.5" stroke="#C1121F" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="5.5" y1="5.5" x2="0" y2="12" stroke="#C1121F" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="5.5" y1="11" x2="0" y2="17.5" stroke="#C1121F" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="5.5" y1="16.5" x2="0" y2="23" stroke="#C1121F" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>

      {/* ── Clipped Video Container ── */}
      <div 
        className="absolute overflow-hidden bg-black"
        style={{
          top: `${inset}px`,
          left: `${inset}px`,
          right: `${inset}px`,
          bottom: `${inset}px`,
          clipPath: `polygon(${cInner}px 0%, calc(100% - ${cInner}px) 0%, 100% ${cInner}px, 100% calc(100% - ${cInner}px), calc(100% - ${cInner}px) 100%, ${cInner}px 100%, 0% calc(100% - ${cInner}px), 0% ${cInner}px)`,
        }}
      >
        <video
          ref={videoRef}
          src="/videos/GO%201.mp4"
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          loop
          muted={isMuted}
          playsInline
        />

        {/* ── Custom Hover Controls Overlay (Minimal) ── */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-20"
        >
          {/* Top Info Bar */}
          <div className="flex justify-between items-start">
            <span 
              className="text-[9px] tracking-[0.25em] text-white/60 uppercase font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              God&apos;s Own // Cinematic
            </span>
          </div>

          {/* Bottom Controls Bar (Volume and Fullscreen) */}
          <div className="flex justify-end items-center gap-2 text-white">
            {/* Mute / Unmute Button */}
            <button 
              onClick={toggleMute}
              className="hover:text-[#C1121F] transition-colors p-1.5 rounded bg-black/40 backdrop-blur-sm border border-white/10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              className="hover:text-[#C1121F] transition-colors p-1.5 rounded bg-black/40 backdrop-blur-sm border border-white/10"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
