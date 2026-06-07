import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-brand text-5xl md:text-7xl font-light text-black mb-12 uppercase tracking-tight">Terms of Service</h1>

                <div className="prose prose-sm md:prose-base max-w-none text-black/70 space-y-8 font-light leading-relaxed tracking-wide">
                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Gods Own Culture website, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Intellectual Property</h2>
                        <p>
                            All content on this site, including designs, text, graphics, logos, and images, is the property of
                            Gods Own Culture and protected by intellectual property laws. Unauthorized use of any content is strictly prohibited.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Product Availability</h2>
                        <p>
                            All orders are subject to availability. We reserve the right to limit the quantity of products we supply,
                            to supply only part of an order, or to divide orders.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Limitation of Liability</h2>
                        <p>
                            Gods Own Culture shall not be liable for any special or consequential damages that result from the use of,
                            or the inability to use, the materials on this site or the performance of the products.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
