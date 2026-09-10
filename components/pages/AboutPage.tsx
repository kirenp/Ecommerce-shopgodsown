import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, RefreshCw, Headphones, Truck } from "lucide-react";

export default function AboutPageContent() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      {/* Hero */}
      <section className="pt-48 pb-28 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] text-white/80 tracking-[0.4em] uppercase mb-6 font-montserrat-bold font-bold">OUR Story</p>
          <h1 className="font-sans font-bold text-6xl md:text-[9rem] tracking-[0.25em] uppercase leading-none">
            <span className="text-[#C81E1E]">GODS</span> <span className="text-white">OWN</span>
          </h1>
          <p className="mt-10 text-[#F5F5F3] text-lg md:text-xl font-normal leading-relaxed max-w-2xl tracking-wide">
            A Kerala born luxury streetwear label redefining what it means to dress with intention. Every thread rooted in heritage, every drop a statement.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-24 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[10px] text-white/60 tracking-[0.4em] uppercase mb-4 font-montserrat-bold font-bold">01 / Mission</p>
            <h2 className="font-montserrat-bold text-4xl md:text-6xl font-bold text-white tracking-tight">
              Made with Purpose
            </h2>
          </div>
          <div className="space-y-6 pt-3">
            <p className="text-[#F5F5F3] text-base leading-relaxed font-normal">
              GODS OWN was born from a desire to bring the richness of Kerala's cultural heritage into the global fashion conversation. We create pieces that aren't just worn, they're lived in.
            </p>
            <p className="text-[#E0E0DC] text-base leading-relaxed font-normal">
              Every collection is a curated exploration of texture, identity, and intention. We work with artisans and innovators to craft garments that stand at the intersection of tradition and disruption.
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="py-24 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[10px] text-white/60 tracking-[0.4em] uppercase mb-4 font-montserrat-bold font-bold">02 / Vision</p>
            <h2 className="font-montserrat-bold text-4xl md:text-6xl font-bold text-white tracking-tight">
              Fashion as Identity
            </h2>
          </div>
          <div className="space-y-6 pt-3">
            <p className="text-[#F5F5F3] text-base leading-relaxed font-normal">
              We envision a world where what you wear is an extension of who you are. Not a brand you belong to, a belief system you embody. GODS OWN is that belief in fabric form.
            </p>
            <p className="text-[#E0E0DC] text-base leading-relaxed font-normal">
              Our vision is to build a global community of individuals who disrupt, create, and lead, anchored always in the quiet dignity of Kerala, God's Own Country.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
            {[
              { title: "Secure Payment", body: "Your transactions are encrypted and protected with multiple payment methods.", icon: ShieldCheck },
              { title: "Dedicated Support", body: "Our team is available during business hours to help you.", icon: Headphones },
              { title: "Free Shipping", body: "Complimentary delivery on all orders across India with real-time tracking.", icon: Truck },
            ].map((v) => (
              <div key={v.title} className="border-t border-white/10 pt-8 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="text-white/90 shrink-0">
                    <v.icon strokeWidth={1.5} size={28} />
                  </div>
                  <h3 className="font-montserrat-bold text-xl md:text-2xl font-bold text-white tracking-tight">{v.title}</h3>
                </div>
                <p className="text-[#E0E0DC] text-sm leading-relaxed font-normal">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
