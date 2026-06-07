import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Collections from "@/components/Collections";
import CategoryStrip from "@/components/CategoryStrip";
import MissionSection from "@/components/MissionSection";
import VisionSection from "@/components/VisionSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <Collections />
      <CategoryStrip />
      <MissionSection />
      <VisionSection />
      <Footer />
    </main>
  );
}
