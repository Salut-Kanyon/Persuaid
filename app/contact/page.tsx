import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Contact | Persuaid",
  description: "Get in touch with the Persuaid team.",
};

const SUPPORT_EMAIL = "kanyonefvd@gmail.com";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background-near-black flex flex-col">
      <Navbar />
      <article className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl w-full">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-green-accent transition-colors mb-8 inline-block"
          >
            ← Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3 text-center">
            Get in touch
          </h1>
          <p className="text-text-muted text-lg mb-10 text-center">
            Tell us a bit about what you need and your email app will open a ready-to-send message to our team.
          </p>

          <form
            action={`mailto:${SUPPORT_EMAIL}`}
            method="post"
            encType="text/plain"
            className="rounded-2xl border border-white/10 bg-background-elevated/50 p-5 sm:p-7"
          >
            <div className="grid grid-cols-1 gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">Your email</span>
                <input
                  type="email"
                  name="Reply-to"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-text-primary placeholder:text-text-dim/70 outline-none transition-colors focus:border-green-primary/45"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">About</span>
                <input
                  type="text"
                  name="Subject"
                  required
                  placeholder="Onboarding, pricing, support, partnership..."
                  className="w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-text-primary placeholder:text-text-dim/70 outline-none transition-colors focus:border-green-primary/45"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">Message</span>
                <textarea
                  name="Message"
                  required
                  rows={6}
                  placeholder="Share context so we can help quickly."
                  className="w-full resize-y rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-text-primary placeholder:text-text-dim/70 outline-none transition-colors focus:border-green-primary/45"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-dim/90">
                This opens your default email app addressed to <span className="text-text-muted">{SUPPORT_EMAIL}</span>.
              </p>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white bg-gradient-to-b from-[#1fb388] via-green-primary to-[#127a5c] border border-[#4dc49a]/45 shadow-[0_0_0_1px_rgba(26,157,120,0.35),0_4px_20px_rgba(26,157,120,0.32)] hover:brightness-[1.05] transition-[filter]"
              >
                Create Email
              </button>
            </div>
          </form>

          <p className="mt-10 text-text-dim text-sm text-center">
            750 B Street, Suite 1200 · San Diego, CA 92101
          </p>
          <p className="mt-1 text-text-dim/80 text-sm text-center">
            Made in San Diego with love
          </p>
        </div>
      </article>
      <Footer />
    </main>
  );
}
