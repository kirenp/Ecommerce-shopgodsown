import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import ShopTheLook from "@/components/ShopTheLook";
import CategoryStrip from "@/components/CategoryStrip";
import MissionSection from "@/components/MissionSection";
import VisionSection from "@/components/VisionSection";
import PromiseBanner from "@/components/PromiseBanner";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F4EF] overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <ShopTheLook />
      <CategoryStrip />
      <MissionSection />
      <VisionSection />
      <PromiseBanner />
      <Footer />
    </main>
  );
}
