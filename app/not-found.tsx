import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import NotFoundCleaner from "@/components/NotFoundCleaner";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-between">
      <NotFoundCleaner />
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-32 text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-red-500 mb-4 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10">
          404 — Not Found
        </span>

        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-[0.15em] mb-4">
          Product Unavailable
        </h1>

        <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
          This product has been removed, discontinued, or is no longer available in our store.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/catalog"
            className="w-full sm:w-auto bg-white text-black text-xs font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag size={15} />
            <span>Explore Collection</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto bg-white/10 text-white hover:bg-white/15 text-xs font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl transition-all border border-white/15 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
