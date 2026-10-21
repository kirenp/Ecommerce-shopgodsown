import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 md:px-12">
                <h1 className="font-montserrat-bold text-5xl md:text-7xl font-bold text-black mb-12 uppercase tracking-tight">
                    Privacy Policy
                </h1>

                <div className="space-y-10 text-[#111111] font-normal leading-relaxed">
                    <section className="space-y-3">
                        <p className="text-base text-[#1a1a1a]">
                            At <span className="font-semibold text-black">God&apos;s Own Culture</span> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), 
                            accessible from <span className="font-semibold text-black">shopgodsown.com</span>, 
                            protecting your personal privacy is paramount. This Privacy Policy details how we collect, use, disclose, 
                            and safeguard your personal data in accordance with the Information Technology Act, 2000, the Information 
                            Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, 
                            and the Digital Personal Data Protection Act, 2023 (DPDP Act).
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            1. Information We Collect
                        </h2>
                        <div className="space-y-3 text-base text-[#1a1a1a]">
                            <p>
                                When you browse our store, place an order, or contact us, we may collect the following categories of information:
                            </p>
                            <ul className="list-disc list-inside space-y-2 pl-2 text-[#1a1a1a]">
                                <li>
                                    <span className="font-medium text-black">Customer Details:</span> Name, shipping address, billing address, email address, and phone number provided during checkout or account registration.
                                </li>
                                <li>
                                    <span className="font-medium text-black">Payment & Transaction Details:</span> Payment method, transaction identifiers, and order status. All electronic payments are processed through RBI-authorized, PCI-DSS compliant payment gateways (Razorpay). We do not store your raw debit/credit card numbers or UPI PINs on our servers.
                                </li>
                                <li>
                                    <span className="font-medium text-black">Technical & Device Information:</span> IP address, browser type, operating system, approximate geographic location, referring URLs, and device identifiers collected automatically when you visit our website.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            2. Cookies and Tracking Technologies
                        </h2>
                        <div className="space-y-3 text-base text-[#1a1a1a]">
                            <p>
                                We use first-party cookies, local storage, web beacons, and server-side tracking technologies (including the Meta Pixel and Meta Conversions API) to enhance your shopping experience and measure digital marketing performance.
                            </p>
                            <p>
                                These cookies allow us to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 pl-2 text-[#1a1a1a]">
                                <li>Remember items in your shopping bag and maintain your session across pages.</li>
                                <li>Understand website traffic, visitor interactions, and popular collections.</li>
                                <li>Measure the effectiveness of our advertising campaigns on platforms like Instagram and Facebook, ensuring relevant ad delivery without selling your personal information.</li>
                            </ul>
                            <p className="text-sm text-black/70 italic pt-1">
                                You can choose to disable or clear cookies through your browser settings at any time; however, some features of our website (such as retaining items in your shopping bag) may not function as intended.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            3. How We Use Your Information
                        </h2>
                        <div className="space-y-2 text-base text-[#1a1a1a]">
                            <p>We use the data collected strictly for legitimate business and transactional purposes, including:</p>
                            <ul className="list-disc list-inside space-y-2 pl-2 text-[#1a1a1a]">
                                <li>Processing, verifying, and fulfilling your orders and shipping deliveries.</li>
                                <li>Sending automated transactional communications (order confirmation, tracking links, and delivery status updates via email, SMS, or WhatsApp).</li>
                                <li>Providing responsive customer support and resolving returns or sizing queries.</li>
                                <li>Preventing fraudulent orders and maintaining platform security.</li>
                                <li>Sharing updates about exclusive drops and early access, only where you have opted in.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            4. Sharing of Information
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            We do not sell, rent, or trade your personal data to any third party for commercial gain. 
                            We only share information with trusted third-party service providers who assist us in operating our storefront, 
                            under strict confidentiality and security agreements:
                        </p>
                        <ul className="list-disc list-inside space-y-2 pl-2 text-base text-[#1a1a1a]">
                            <li><span className="font-medium text-black">Logistics Partners:</span> Couriers and shipping aggregators (e.g., Shiprocket, Delhivery, Blue Dart) to deliver your purchases.</li>
                            <li><span className="font-medium text-black">Payment Gateways:</span> Razorpay for secure checkout payment authorization.</li>
                            <li><span className="font-medium text-black">E-Commerce Infrastructure:</span> Shopify for order and inventory management.</li>
                            <li><span className="font-medium text-black">Legal Compliance:</span> Law enforcement or regulatory authorities only when strictly required by applicable Indian law or court order.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            5. Data Security & Retention
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            We enforce industry-standard administrative, technical, and physical safeguards—including SSL 256-bit encryption—to 
                            protect your information against unauthorized access, alteration, or disclosure. We retain your personal data 
                            only as long as necessary to fulfill the purposes outlined in this policy, comply with statutory tax and accounting 
                            obligations under Indian law, and resolve disputes.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            6. Your Rights
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            In accordance with the Digital Personal Data Protection Act, 2023, you have the right to access a summary of your 
                            personal data, request correction of inaccurate details, or request erasure of your data when it is no longer 
                            necessary for the purposes for which it was collected. To exercise any of these rights, please contact our support team.
                        </p>
                    </section>

                    <section className="space-y-3 pt-6 border-t border-black/15">
                        <h2 className="text-black text-sm md:text-base font-bold tracking-[0.25em] uppercase font-montserrat-bold">
                            7. Grievance Redressal & Contact Us
                        </h2>
                        <p className="text-base text-[#1a1a1a]">
                            In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, 
                            if you have questions, concerns, or grievances regarding this Privacy Policy or your personal data, you may reach our 
                            Grievance Officer at:
                        </p>
                        <div className="pt-2 text-base text-[#1a1a1a] space-y-1">
                            <p><span className="font-semibold text-black">Brand:</span> God&apos;s Own Culture</p>
                            <p>
                                <span className="font-semibold text-black">Email:</span>{" "}
                                <a
                                    href="mailto:hello@shopgodsown.com"
                                    className="text-black hover:text-[#C81E1E] underline underline-offset-4 transition-colors font-semibold"
                                >
                                    hello@shopgodsown.com
                                </a>
                            </p>
                            <p>
                                <span className="font-semibold text-black">WhatsApp / Phone:</span>{" "}
                                <a
                                    href="https://wa.me/917907478189"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-[#C81E1E] underline underline-offset-4 transition-colors font-semibold"
                                >
                                    +91 7907478189
                                </a>
                            </p>
                            <p><span className="font-semibold text-black">Location:</span> Kerala, India</p>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
