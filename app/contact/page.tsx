import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <ContactForm />
      <Footer />
    </main>
  );
}
