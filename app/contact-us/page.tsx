import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Contact Us | Persuaid",
  description: "Contact the Persuaid team by email or phone.",
};

const SUPPORT_EMAIL = "persuaidapp@gmail.com";
const SUPPORT_PHONE = "6267374463";
const PHONE_DISPLAY = "(626) 737-4463";

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-background-near-black flex flex-col">
      <Navbar />
      <article className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-xl w-full text-center">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-green-accent transition-colors mb-8 inline-block"
          >
            ← Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3">Contact us</h1>
          <p className="text-text-muted text-lg mb-12">Questions, feedback, or need help? We&apos;re here for you.</p>

          <div className="space-y-8">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border border-white/10 bg-background-elevated/50 hover:border-green-primary/30 hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Email</span>
              <span className="text-lg sm:text-xl text-text-primary font-medium group-hover:text-green-accent transition-colors break-all">
                {SUPPORT_EMAIL}
              </span>
            </a>

            <a
              href={`tel:+1${SUPPORT_PHONE}`}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border border-white/10 bg-background-elevated/50 hover:border-green-primary/30 hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</span>
              <span className="text-lg sm:text-xl text-text-primary font-medium group-hover:text-green-accent transition-colors">
                {PHONE_DISPLAY}
              </span>
            </a>
          </div>

          <p className="mt-16 text-text-dim text-sm">750 B Street, Suite 1200 · San Diego, CA 92101</p>
          <p className="mt-1 text-text-dim/80 text-sm">Made in San Diego with love</p>
        </div>
      </article>
      <Footer />
    </main>
  );
}
