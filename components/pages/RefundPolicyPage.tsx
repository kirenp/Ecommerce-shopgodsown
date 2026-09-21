import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RefundPolicyPage() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-montserrat-bold text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-8 uppercase tracking-tight">
                    Refunds &amp; Exchanges
                </h1>

                <div className="space-y-12 text-[#111111] font-normal leading-relaxed">
                    {/* Introduction */}
                    <div className="space-y-4 text-base md:text-lg border-b border-black/15 pb-8 text-[#1a1a1a]">
                        <p>
                            At <span className="font-montserrat-bold font-bold text-black">GOD&apos;S OWN</span>, every order is prepared and processed with care. Before placing an order, we recommend checking the product details, size information, and other available information carefully.
                        </p>
                        <p className="text-[#222222] font-medium">
                            Please read the following policy before completing your purchase.
                        </p>
                    </div>

                    {/* No Refunds */}
                    <section className="space-y-4">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            NO REFUNDS
                        </h2>
                        <div className="space-y-3 text-base text-[#1a1a1a]">
                            <p className="font-semibold text-black">
                                All purchases from GOD&apos;S OWN are final.
                            </p>
                            <p className="font-bold text-[#C81E1E]">
                                No refunds. No cancellations.
                            </p>
                            <p>
                                Once an order has been placed, it cannot be cancelled or refunded. We encourage you to review your order details carefully before confirming your purchase, including the selected products, sizes, quantities, and delivery information.
                            </p>
                            <p>
                                Because all purchases are final, we are unable to provide refunds for reasons such as a change of mind, incorrect size selection, or simply no longer wanting the product.
                            </p>
                        </div>
                    </section>

                    {/* Wrong / Damaged Item */}
                    <section className="space-y-4">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            WRONG / DAMAGED ITEM
                        </h2>
                        <div className="space-y-4 text-base text-[#1a1a1a]">
                            <p>
                                While we take care to ensure that every order is packed and dispatched correctly, if you receive an item that is incorrect or arrives damaged due to an issue from our side, please contact us as soon as possible.
                            </p>
                            <p className="font-semibold text-black">
                                To help us review the issue:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-[#1a1a1a]">
                                <li>Contact us within 48 hours of delivery.</li>
                                <li>Please share clear photos and/or videos showing the issue with the product and, where applicable, the packaging or parcel received.</li>
                            </ul>
                            <p>
                                Providing clear visual evidence helps us understand the problem and verify the issue as quickly as possible.
                            </p>
                            <p>
                                Once we receive the details, our team will review the case and get back to you.
                            </p>
                            <p className="font-bold text-black text-lg pt-1">
                                We’ll make it right.
                            </p>
                            <p className="text-sm text-[#333333] font-medium italic pt-2">
                                Please note that issues must be reported within the stated 48 hour period after delivery. Reports received after this period may not be considered.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="space-y-4 pt-6 border-t border-black/15">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            CONTACT
                        </h2>
                        <div className="space-y-4 text-base text-[#1a1a1a]">
                            <p>
                                For any questions or concerns regarding an order, wrong item, or damaged item, please contact us through the details below.
                            </p>
                            <div className="space-y-2">
                                <p>
                                    <span className="font-bold text-black">Email:</span>{" "}
                                    <a
                                        href="mailto:godsownculture@gmail.com"
                                        className="text-black hover:text-[#C81E1E] underline underline-offset-4 transition-colors font-semibold"
                                    >
                                        godsownculture@gmail.com
                                    </a>
                                </p>
                                <p>
                                    <span className="font-bold text-black">WhatsApp:</span>{" "}
                                    <span className="text-[#1a1a1a]">[WhatsApp Number]</span>
                                </p>
                            </div>
                            <p className="text-sm text-[#333333] font-medium pt-2">
                                Please include your order details and, where relevant, clear photos or videos of the issue so our team can assist you efficiently.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}


