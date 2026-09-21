import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShippingPolicyPage() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-montserrat-bold text-5xl md:text-7xl font-bold text-black mb-12 uppercase tracking-tight">Shipping Policy</h1>

                <div className="space-y-10 text-[#111111] font-normal leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Domestic Shipping (India)
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            We offer standard shipping across India. Orders are typically processed within 2-3 business days.
                            Once shipped, please allow 5-7 business days for delivery depending on your location.
                            High-demand drops may experience slight delays.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            International Shipping
                        </h2>
                        <div className="space-y-1 text-base text-[#1a1a1a]">
                            <p>We currently do not ship internationally.</p>
                            <p className="font-medium text-black">Working on it.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Tracking Your Order
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            Once your order is dispatched, you will receive a confirmation email with a tracking link.
                            You can also track your order through your account dashboard.
                        </p>
                    </section>

                    <section className="space-y-3 pt-6 border-t border-black/15">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            Delivery Issues
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            If your package is lost or damaged during transit, please contact us immediately at{" "}
                            <a
                                href="mailto:godsownculture@gmail.com"
                                className="text-black hover:text-[#C81E1E] underline underline-offset-4 transition-colors font-semibold"
                            >
                                godsownculture@gmail.com
                            </a>{" "}
                            with your order number.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
