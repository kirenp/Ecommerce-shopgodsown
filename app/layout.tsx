import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { geishta, pickyside } from "@/lib/fonts";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { UIProvider } from "@/lib/uiContext";
import QuickViewModal from "@/components/QuickViewModal";
import CartSidebar from "@/components/CartSidebar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = "https://shopgodsown.com";
const siteName = "Gods Own Culture";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "GODS OWN | Luxury Streetwear — Shop Gods Own Culture",
    template: "%s | GODS OWN",
  },

  description:
    "Shop Gods Own Culture — premium limited-release streetwear born from Kerala's heritage. Exclusive drops, gym & street-ready fits. ShopGodsOwn, GodsOwn, GodsOwnCulture.",

  keywords: [
    "shopgodsown",
    "godsown",
    "godsownculture",
    "gods own",
    "gods own culture",
    "shop gods own",
    "gods own streetwear",
    "gods own clothing",
    "gods own kerala",
    "luxury streetwear india",
    "premium streetwear",
    "limited release clothing",
    "exclusive drops india",
    "indian streetwear brand",
    "kerala streetwear",
    "gym streetwear",
    "street legal clothing",
    "gods own club",
    "new drops streetwear",
    "shopgodsown.com",
  ],

  authors: [{ name: "Gods Own Culture", url: siteUrl }],
  creator: "Gods Own Culture",
  publisher: "Gods Own Culture",

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "GODS OWN | Luxury Streetwear",
    description:
      "Premium limited-release streetwear born from Kerala's cultural heritage. Exclusive drops — gym & street ready.",
    images: [
      {
        url: "/images/Gods Own (1).png",
        width: 1200,
        height: 630,
        alt: "Gods Own Culture — Luxury Streetwear",
      },
    ],
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "GODS OWN | Luxury Streetwear",
    description:
      "Premium limited-release streetwear. Exclusive drops — gym & street ready.",
    images: ["/images/Gods Own (1).png"],
    creator: "@godsownculture",
  },

  icons: {
    icon: [
      { url: "/images/Gods Own (1).png", type: "image/png" },
    ],
    apple: [
      { url: "/images/Gods Own (1).png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/images/Gods Own (1).png",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    // Add your Google Search Console verification code here when available:
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },

  category: "fashion",
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Gods Own Culture",
      alternateName: ["ShopGodsOwn", "GodsOwn", "GodsOwnCulture", "Gods Own"],
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/Gods Own (1).png`,
        width: 512,
        height: 512,
      },
      description:
        "Premium limited-release streetwear brand born from Kerala's cultural heritage. Exclusive drops, gym & street-ready fits.",
      sameAs: [
        "https://www.instagram.com/godsownculture",
        "https://shopgodsown.com",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        url: `${siteUrl}/contact`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Gods Own Culture",
      description:
        "Shop Gods Own Culture — premium limited-release streetwear. ShopGodsOwn.",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/catalog?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ClothingStore",
      "@id": `${siteUrl}/#store`,
      name: "Gods Own Culture",
      url: siteUrl,
      image: `${siteUrl}/images/Gods Own (1).png`,
      description: "Luxury streetwear — exclusive drops and limited releases.",
      priceRange: "$$",
      currenciesAccepted: "INR",
      paymentAccepted: "Credit Card, UPI, Net Banking",
      areaServed: "IN",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${geishta.variable} ${pickyside.variable}`}
    >
      <head>
        {/* Canonical & alternate */}
        <link rel="canonical" href={siteUrl} />

        {/* Favicon fallback */}
        <link rel="icon" href="/images/Gods Own (1).png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/Gods Own (1).png" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <CartProvider>
          <UIProvider>
            {children}
            <QuickViewModal />
            <CartSidebar />
          </UIProvider>
        </CartProvider>
      </body>
    </html>
  );
}
