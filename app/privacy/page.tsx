import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Persuaid",
  description: "How Persuaid collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background-near-black flex flex-col">
      <Navbar />
      <article className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-green-accent transition-colors mb-6 inline-block"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-text-muted mt-2 text-base sm:text-lg">
            Last updated: March 2025
          </p>
        </header>

        <div className="space-y-10 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Overview
            </h2>
            <p className="leading-relaxed">
              Persuaid (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides an AI-powered sales copilot that helps reps during live calls. This policy describes how we collect, use, store, and protect your information when you use our website, app, and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              2. Information we collect
            </h2>
            <p className="leading-relaxed mb-4">
              We collect information necessary to deliver and improve our service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-muted">
              <li><strong className="text-text-secondary">Account data:</strong> name, email, company, and login credentials.</li>
              <li><strong className="text-text-secondary">Call and conversation data:</strong> audio processed for real-time transcription and AI suggestions during calls you choose to use with Persuaid.</li>
              <li><strong className="text-text-secondary">Product knowledge and notes:</strong> content you add (playbooks, notes, scripts) that you connect to the AI.</li>
              <li><strong className="text-text-secondary">Usage data:</strong> how you use the product (features, sessions) to improve our service and security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. How we use your information
            </h2>
            <p className="leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-muted">
              <li>Provide real-time transcription and AI suggestions during your sales calls.</li>
              <li>Train and operate our models in line with your settings and our Data Processing Agreement.</li>
              <li>Improve our product, support, and security.</li>
              <li>Send service-related and product updates (you can opt out of marketing).</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Data sharing and subprocessors
            </h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We share data only with subprocessors that help us run the service (e.g. hosting, transcription, AI). Our <Link href="/subprocessors" className="text-green-accent hover:underline">Subprocessors</Link> page lists these providers. We also share data when required by law or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Data retention and deletion
            </h2>
            <p className="leading-relaxed">
              We retain your data for as long as your account is active and as needed to provide the service. You can request deletion of your account and associated data; we will process such requests in line with our Terms of Service and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. Security and your rights
            </h2>
            <p className="leading-relaxed mb-4">
              We use industry-standard measures to protect your data. Depending on where you live, you may have rights to access, correct, export, or delete your data, or to object to or restrict certain processing. Contact us at the address below to exercise these rights.
            </p>
            <p className="leading-relaxed">
              For questions about this policy or our practices, contact us at{" "}
              <a href="mailto:privacy@persuaid.app" className="text-green-accent hover:underline">
                privacy@persuaid.app
              </a>.
            </p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  );
}
