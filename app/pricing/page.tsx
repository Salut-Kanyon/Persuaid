"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Section } from "@/components/ui/Section";
import { PricingCard } from "@/components/ui/PricingCard";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background-near-black">
      <Navbar />

      {/* Hero Section */}
      <Section className="pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mb-6"
          >
            <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
              Pricing
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Simple, transparent{" "}
            <span className="text-green-primary">pricing</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl sm:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light"
          >
            Start free. Upgrade when you're ready. All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20"
        >
          <PricingCard
            name="Starter"
            price="$49"
            description="Perfect for individual sales reps"
            features={[
              "Unlimited calls",
              "Live transcript",
              "What to say / Questions / Key points",
              "Notes + AI rewrite",
              "Save transcript",
              "Email support",
            ]}
            cta="Start Free Trial"
          />
          <PricingCard
            name="Professional"
            price="$149"
            description="For teams and growing sales orgs"
            features={[
              "Everything in Starter",
              "Scripts & talking points",
              "Notes as context for AI",
              "Team collaboration",
              "Analytics & insights",
              "Priority support",
            ]}
            cta="Start Free Trial"
            highlighted={true}
          />
          <PricingCard
            name="Enterprise"
            price="Custom"
            period=""
            description="For large organizations"
            features={[
              "Everything in Professional",
              "Custom integrations",
              "Dedicated support",
              "Advanced security",
              "SLA guarantee",
              "Custom training",
            ]}
            cta="Contact Sales"
          />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "How does the free trial work?",
                answer:
                  "Start with a 14-day free trial—no credit card required. You get full access to the plan you choose. If you don't cancel before the trial ends, we'll charge you for the first month. You can cancel anytime from your account.",
              },
              {
                question: "Can I change plans later?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                question: "What happens after my free trial?",
                answer:
                  "After your 14-day free trial, you'll be automatically enrolled in the plan you selected. You can cancel anytime before the trial ends.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
              },
              {
                question: "Is there a setup fee?",
                answer:
                  "No setup fees. You only pay for the plan you choose, starting after your free trial.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="bg-background-surface border border-border rounded-card p-6"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {faq.question}
                </h3>
                <p className="text-text-muted">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
            Start your free trial
          </h2>
          <p className="text-text-muted mb-8 text-lg">
            No credit card required. Download and try Persuaid on your next call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton href="/download" variant="primary" size="large">
              Start Free Trial
            </CTAButton>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl border border-border/50 text-text-secondary hover:bg-background-surface hover:text-text-primary transition-colors"
            >
              Back to home
            </a>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
