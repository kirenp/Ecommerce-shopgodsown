import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { geishta, pickyside } from "@/lib/fonts";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { UIProvider } from "@/lib/uiContext";
import QuickViewModal from "@/components/QuickViewModal";
import CartSidebar from "@/components/CartSidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "godsownculture | Luxury Streetwear",
  description: "Exclusive drops and limited releases. Elegance redefined.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${geishta.variable} ${pickyside.variable}`}>

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
