'use client';

import { useEffect } from "react";

export default function NotFoundCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const pathname = window.location.pathname;
      if (pathname.includes("/products/")) {
        const parts = pathname.split("/products/")[1];
        const handle = parts ? parts.split("/")[0].split("?")[0].trim() : "";

        if (handle) {
          // Dispatch event to active providers
          window.dispatchEvent(
            new CustomEvent("goc_product_not_found", { detail: { handle } })
          );

          // Purge from recently viewed
          const rv = localStorage.getItem("goc_recently_viewed");
          if (rv) {
            const items = JSON.parse(rv);
            if (Array.isArray(items)) {
              localStorage.setItem(
                "goc_recently_viewed",
                JSON.stringify(items.filter((i: any) => i.handle !== handle))
              );
            }
          }

          // Purge from wishlist
          const wl = localStorage.getItem("goc_wishlist");
          if (wl) {
            const items = JSON.parse(wl);
            if (Array.isArray(items)) {
              localStorage.setItem(
                "goc_wishlist",
                JSON.stringify(items.filter((i: any) => i.handle !== handle))
              );
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to cleanup not-found product handle:", e);
    }
  }, []);

  return null;
}
