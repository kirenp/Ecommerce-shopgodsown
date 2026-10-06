import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-montserrat-bold text-5xl md:text-7xl font-bold text-black mb-12 uppercase tracking-tight">Terms of Service</h1>

                <div className="space-y-10 text-[#111111] font-normal leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Acceptance of Terms
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            By accessing and using the <span className="font-montserrat-bold font-bold text-black">GOD&apos;S OWN</span> website, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Intellectual Property
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            All content on this site, including designs, text, graphics, logos, and images, is the property of{" "}
                            <span className="font-montserrat-bold font-bold text-black">GOD&apos;S OWN</span> and protected by intellectual property laws. Unauthorized use of any content is strictly prohibited.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Product Availability
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            All orders are subject to availability. We reserve the right to limit the quantity of products we supply,
                            to supply only part of an order, or to divide orders.
                        </p>
                    </section>

                    <section className="space-y-3 pt-6 border-t border-black/15">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Limitation of Liability
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            <span className="font-montserrat-bold font-bold text-black">GOD&apos;S OWN</span> shall not be liable for any special or consequential damages that result from the use of,
                            or the inability to use, the materials on this site or the performance of the products.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
