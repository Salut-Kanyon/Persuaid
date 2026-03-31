import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | Persuaid",
  description: "Terms of Service for using Persuaid.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-text-muted mt-2 text-base sm:text-lg">
            Last updated: March 2025
          </p>
        </header>

        <div className="space-y-10 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Agreement to terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using Persuaid&apos;s website, applications, or services (the &quot;Service&quot;), you agree to these Terms of Service and our <Link href="/privacy" className="text-green-accent hover:underline">Privacy Policy</Link>. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              2. Description of the service
            </h2>
            <p className="leading-relaxed">
              Persuaid provides an AI-powered sales copilot that offers real-time transcription, suggested responses, and coaching during sales calls. You may connect your own product knowledge, notes, and playbooks so that suggestions are tailored to your sales process. The Service is provided as described at the time of use and may be updated from time to time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. Your account and use
            </h2>
            <p className="leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account and for all activity under your account. You agree to use the Service only in compliance with these terms and applicable laws. You may not misuse the Service (e.g. reverse engineering, circumventing access controls, or using it for illegal or unauthorized purposes). You are responsible for ensuring that your use of the Service, including any call recording or processing, complies with applicable consent and disclosure laws in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Payment and subscription
            </h2>
            <p className="leading-relaxed">
              Paid plans are billed according to the pricing and billing cycle you select. Fees are non-refundable except as required by law or as stated in your plan. We may change pricing with notice; continued use after the change constitutes acceptance. Failure to pay may result in suspension or termination of access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Intellectual property and data
            </h2>
            <p className="leading-relaxed mb-4">
              We own the Service, including its design, code, and branding. You retain ownership of your content and data. By using the Service, you grant us the limited rights necessary to operate it (e.g. to process audio and text to provide transcription and AI suggestions). Our use of your data is further described in our Privacy Policy and, where applicable, our <Link href="/data-processing-agreement" className="text-green-accent hover:underline">Data Processing Agreement</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. Disclaimers and limitation of liability
            </h2>
            <p className="leading-relaxed mb-4">
              The Service is provided &quot;as is.&quot; We do not guarantee uninterrupted or error-free operation. AI suggestions are assistive only and do not constitute legal, compliance, or professional advice. To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for any loss of data or revenue arising from your use of the Service. Our total liability is limited to the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              7. Termination
            </h2>
            <p className="leading-relaxed">
              You may stop using the Service at any time. We may suspend or terminate your access if you breach these terms or for other operational or legal reasons. Upon termination, your right to use the Service ends. Provisions that by their nature should survive (e.g. liability limits, dispute resolution) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              8. Contact
            </h2>
            <p className="leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="mailto:persuaidapp@gmail.com" className="text-green-accent hover:underline">
                persuaidapp@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  );
}
