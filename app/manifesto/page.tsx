import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Manifesto | Persuaid",
  description: "Why we built Persuaid — and why the best reps don't wing it.",
};

export default function ManifestoPage() {
  return (
    <main className="min-h-screen bg-background-near-black flex flex-col">
      <Navbar />
      <article className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-green-accent transition-colors mb-10 inline-block"
        >
          ← Back to home
        </Link>

        <header className="mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-tight">
            Manifesto
          </h1>
        </header>

        <div className="space-y-8 text-text-secondary text-lg leading-relaxed">
          <p>
            We believe you should never have to think alone on a call.
          </p>

          <p>
            Objections. Pricing. Competitors. &quot;Send me something.&quot;
            The prospect says it once — you have one shot to answer right.
            Wing it, and the deal goes cold. Nail it, and you move forward.
          </p>

          <p>
            Persuaid listens to the conversation. It knows your product, your playbook, your positioning. It doesn&apos;t replace you. It gives you the next line, in real time, so you sound like the best version of yourself — every time.
          </p>

          <p>
            Some will say that&apos;s a crutch. That the &quot;best&quot; reps don&apos;t need help.
            But the best pilots have co-pilots. The best surgeons have teams. The best closers have a second brain that never forgets the script, never blanks on the objection, and never leaves the best line unsaid.
          </p>

          <p>
            Technology that makes us sharper in the moment isn&apos;t cheating. It&apos;s leverage. Spellcheck didn&apos;t kill writing. Calculators didn&apos;t kill math. They made more people good at both. Persuaid does the same for sales: it doesn&apos;t do the call for you. It makes sure you say the right thing when it matters.
          </p>

          <p>
            The future of selling isn&apos;t more hustle. It&apos;s better judgment, in the moment, with the right words at the right time. We built Persuaid so that every rep can have that — live, on the call, without the panic.
          </p>

          <p className="text-text-primary font-medium pt-4">
            Say the right thing. Every conversation.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="text-green-accent hover:underline font-medium"
          >
            See how it works →
          </Link>
        </div>
      </article>
      <Footer />
    </main>
  );
}
