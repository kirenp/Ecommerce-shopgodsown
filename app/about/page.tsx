import type { Metadata } from "next";
import AboutPageContent from "@/components/pages/AboutPage";

export const metadata: Metadata = {
  title: "About — God's Own Culture | Our Story",
  description:
    "God's Own Culture is a premium Indian streetwear brand rooted in Kerala's cultural heritage. Discover our story, mission, and values.",
  keywords: [
    "about gods own culture",
    "godsownculture brand story",
    "gods own kerala heritage",
    "indian luxury streetwear brand",
  ],
  alternates: { canonical: "https://shopgodsown.com/about" },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
