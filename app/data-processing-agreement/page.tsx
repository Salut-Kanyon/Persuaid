import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Data Processing Agreement | Persuaid",
  description: "Data Processing Agreement for Persuaid customers.",
};

export default function DataProcessingAgreementPage() {
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
            Data Processing Agreement
          </h1>
          <p className="text-text-muted mt-2 text-base sm:text-lg">
            Last updated: March 2025
          </p>
        </header>

        <div className="space-y-10 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Scope and roles
            </h2>
            <p className="leading-relaxed">
              This Data Processing Agreement (&quot;DPA&quot;) applies when Persuaid processes personal data on your behalf in connection with the Persuaid Service. You are the &quot;Controller&quot; and Persuaid is the &quot;Processor&quot; (or &quot;Service Provider&quot; where applicable). This DPA is incorporated by reference into the Terms of Service and supplements our <Link href="/privacy" className="text-green-accent hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              2. Processing details
            </h2>
            <p className="leading-relaxed mb-4">
              Persuaid processes personal data as necessary to provide the Service, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-muted">
              <li><strong className="text-text-secondary">Purpose:</strong> Real-time transcription, AI suggestions, call analysis, and related product and support functions.</li>
              <li><strong className="text-text-secondary">Data subjects:</strong> Your users (e.g. sales reps) and, where you use the Service on calls, the individuals on those calls (e.g. prospects), to the extent you instruct and have lawful basis.</li>
              <li><strong className="text-text-secondary">Types of data:</strong> Account and profile data; call audio and transcripts; product knowledge and notes you provide; usage and log data.</li>
              <li><strong className="text-text-secondary">Duration:</strong> For the term of your use of the Service and as needed for retention, legal compliance, and dispute resolution.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. Your instructions and compliance
            </h2>
            <p className="leading-relaxed">
              We process personal data only in accordance with your documented instructions (including use of the Service as configured by you) and applicable data protection law. You are responsible for ensuring that you have a lawful basis and, where required, consent or other legal grounds for having us process personal data (including call participants&apos; data). You will not instruct us to process data in a way that violates applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Security and subprocessors
            </h2>
            <p className="leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect personal data against unauthorized access, loss, or alteration. We use subprocessors to operate the Service; they are listed on our <Link href="/subprocessors" className="text-green-accent hover:underline">Subprocessors</Link> page. We require subprocessors to protect data in a manner consistent with this DPA and applicable law. We may add or replace subprocessors with notice to you; you may object on reasonable grounds relating to data protection.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Assistance and audits
            </h2>
            <p className="leading-relaxed">
              We will assist you in responding to data subject requests and in meeting your obligations under applicable data protection law regarding security, breach notification, and impact assessments, to the extent that such assistance is necessary and feasible within the scope of our role as Processor. You may request information or audits necessary to verify our compliance with this DPA, subject to confidentiality and reasonable frequency and cost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. International transfers
            </h2>
            <p className="leading-relaxed">
              Where personal data is transferred outside the European Economic Area or other restricted jurisdictions, we implement appropriate safeguards (such as Standard Contractual Clauses or equivalent mechanisms) as required by applicable law. Details can be provided on request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              7. Deletion and return
            </h2>
            <p className="leading-relaxed">
              Upon termination of your use of the Service, we will delete or return personal data processed under this DPA as agreed or as required by law, unless we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              8. Contact
            </h2>
            <p className="leading-relaxed">
              For data protection and DPA-related questions, contact us at{" "}
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
