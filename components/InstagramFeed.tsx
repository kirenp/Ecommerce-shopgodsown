"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface InstagramPost {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  mediaType?: string;
}

const FALLBACK_POSTS: InstagramPost[] = [
  {
    id: "fb_1",
    mediaUrl: "/images/IMG_9026.JPG.jpeg",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "GODS OWN Limited Edition Tees — Street ready fits with Kerala roots.",
  },
  {
    id: "fb_2",
    mediaUrl: "/images/IMG_9025.JPG (1).jpeg",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "Quality details. Engineered for maximum presence.",
  },
  {
    id: "fb_3",
    mediaUrl: "/images/productnavig-2.png",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "Malayali Dept. Oversized Tank Top.",
  },
  {
    id: "fb_4",
    mediaUrl: "/images/Full sleeve minimal front embroidery.png",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "Full sleeve minimal front embroidery.",
  },
  {
    id: "fb_5",
    mediaUrl: "/images/d686abb82ae9c13e81987c7572fcb386.jpg",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "The new standard of streetwear drop.",
  },
  {
    id: "fb_6",
    mediaUrl: "/images/ff1780bf6880821ffda706f87413ec8f.jpg",
    permalink: "https://www.instagram.com/godsownculture/",
    caption: "Culture meets streetwear.",
  },
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>(FALLBACK_POSTS);

  useEffect(() => {
    // Developers can define the Behold.so endpoint or public Instagram API proxy in environment variables
    const feedUrl = process.env.NEXT_PUBLIC_INSTAGRAM_FEED_URL;
    
    if (feedUrl) {
      fetch(feedUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Feed fetch failed");
          return res.json();
        })
        .then((data) => {
          // Normalize behold.so or generic JSON feed data to matching format
          const normalized = (Array.isArray(data) ? data : data.data || [])
            .slice(0, 6)
            .map((post: any) => ({
              id: post.id || Math.random().toString(),
              mediaUrl: post.media_url || post.mediaUrl,
              permalink: post.permalink || post.link || "https://www.instagram.com/godsownculture/",
              caption: post.caption || "",
              mediaType: post.media_type || post.mediaType,
            }));
          
          if (normalized.length > 0) {
            setPosts(normalized);
          }
        })
        .catch((err) => {
          console.warn("Instagram dynamic feed error, using local high-quality posts fallback:", err);
        });
    }
  }, []);

  return (
    <section className="w-full bg-black py-20 border-t border-white/5 overflow-hidden">
      {/* Editorial Section Header */}
      <div className="px-6 md:px-12 lg:px-16 pb-10">
        <p className="text-[9px] text-white/40 tracking-[0.5em] uppercase mb-2">
          Instagram
        </p>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="text-2xl md:text-3xl font-light text-white/90 tracking-tight">
            Follow Us{" "}
            <a
              href="https://www.instagram.com/godsownculture/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-[#C81E1E] transition-colors"
            >
              @godsownculture
            </a>
          </h2>
          <a
            href="https://www.instagram.com/godsownculture/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-white hover:underline underline-offset-4 transition-colors"
          >
            Visit Profile →
          </a>
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square group block bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-sm hover:border-white/20 transition-colors"
            >
              {/* Image */}
              <Image
                src={post.mediaUrl}
                alt={post.caption || "Instagram post"}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />

              {/* Glass specs specular overlay on top */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

              {/* Dark Hover Glassmorphism Scrim */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10 backdrop-blur-[2px]">
                {/* Top right icon */}
                <div className="flex justify-end">
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </div>

                {/* Bottom details */}
                <div className="text-white">
                  <p className="text-[10px] text-white/80 line-clamp-3 leading-relaxed tracking-wider mb-2 font-sans font-medium">
                    {post.caption}
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#ef4444] group-hover:text-white transition-colors font-sans">
                    View Post →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
