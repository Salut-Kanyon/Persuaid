import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Subprocessors | Persuaid",
  description: "List of subprocessors Persuaid uses to provide its service.",
};

const SUBPROCESSORS = [
  {
    name: "Vercel",
    purpose: "Hosting and deployment of web application and API",
    location: "United States",
  },
  {
    name: "OpenAI",
    purpose: "AI models for real-time suggestions, call analysis, and language processing",
    location: "United States",
  },
  {
    name: "Deepgram",
    purpose: "Speech-to-text transcription for live call audio",
    location: "United States",
  },
  {
    name: "Supabase",
    purpose: "Authentication, database, and user data storage",
    location: "United States",
  },
  {
    name: "Stripe",
    purpose: "Payment processing and subscription billing",
    location: "United States",
  },
];

export default function SubprocessorsPage() {
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
            Subprocessors
          </h1>
          <p className="text-text-muted mt-2 text-base sm:text-lg">
            Last updated: March 2025
          </p>
        </header>

        <div className="space-y-10 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              Overview
            </h2>
            <p className="leading-relaxed">
              Persuaid uses carefully selected subprocessors to operate the Service (hosting, AI, transcription, auth, payments, and email). Each subprocessor is required to protect data in line with our security and privacy standards. This page lists our current subprocessors and their role. We may update this list as we add or change providers; we will notify you of material changes that affect how we process your data, in line with our <Link href="/data-processing-agreement" className="text-green-accent hover:underline">Data Processing Agreement</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Current subprocessors
            </h2>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-background-elevated/50">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 font-semibold text-text-primary">
                      Subprocessor
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-primary">
                      Purpose
                    </th>
                    <th className="px-4 py-3 font-semibold text-text-primary">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {SUBPROCESSORS.map((sub) => (
                    <tr key={sub.name} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {sub.name}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {sub.purpose}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {sub.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              Updates and objections
            </h2>
            <p className="leading-relaxed">
              We may add or replace subprocessors to maintain or improve the Service. If you have a reasonable objection to a new subprocessor on data protection grounds, contact us at{" "}
              <a href="mailto:persuaidapp@gmail.com" className="text-green-accent hover:underline">
                persuaidapp@gmail.com
              </a>
              . We will work with you to address your concerns, which may include continuing without that subprocessor for your account where feasible.
            </p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  );
}
