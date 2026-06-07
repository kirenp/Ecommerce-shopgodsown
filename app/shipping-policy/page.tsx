import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShippingPolicy() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-brand text-5xl md:text-7xl font-light text-black mb-12 uppercase tracking-tight">Shipping Policy</h1>

                <div className="prose prose-sm md:prose-base max-w-none text-black/70 space-y-8 font-light leading-relaxed tracking-wide">
                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Domestic Shipping (India)</h2>
                        <p>
                            We offer standard shipping across India. Orders are typically processed within 2-3 business days.
                            Once shipped, please allow 5-7 business days for delivery depending on your location.
                            High-demand drops may experience slight delays.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">International Shipping</h2>
                        <p>
                            Gods Own Culture ships worldwide. International shipping rates and delivery times vary by destination.
                            Customs duties and taxes, if applicable, are the responsibility of the customer.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Tracking Your Order</h2>
                        <p>
                            Once your order is dispatched, you will receive a confirmation email with a tracking link.
                            You can also track your order through your account dashboard.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Delivery Issues</h2>
                        <p>
                            If your package is lost or damaged during transit, please contact us immediately at support@godsownculture.com
                            with your order number.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
