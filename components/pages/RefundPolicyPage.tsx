import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RefundPolicyPage() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-brand text-5xl md:text-7xl font-light text-black mb-12 uppercase tracking-tight">Refund Policy</h1>

                <div className="prose prose-sm md:prose-base max-w-none text-black/70 space-y-8 font-light leading-relaxed tracking-wide">
                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Returns & Exchanges</h2>
                        <p>
                            We accept returns and exchanges within 14 days of delivery. Items must be in their original condition:
                            unworn, unwashed, and with all tags attached.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Non-Returnable Items</h2>
                        <p>
                            Limited release "Drop" items, accessories, and sale items are final sale and cannot be returned
                            unless they arrive damaged or defective.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Refund Process</h2>
                        <p>
                            Once your return is received and inspected, we will notify you of the approval or rejection of your refund.
                            If approved, your refund will be processed to your original method of payment within 7-10 business days.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-black text-xs font-bold tracking-[0.3em] uppercase">Return Shipping</h2>
                        <p>
                            Customers are responsible for paying their own shipping costs for returning items.
                            Shipping costs are non-refundable.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
