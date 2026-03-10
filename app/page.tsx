"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { ProductPreview } from "@/components/ui/ProductPreview";
import { CTAButton } from "@/components/ui/CTAButton";
import { PricingCard } from "@/components/ui/PricingCard";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { StatBlock } from "@/components/ui/StatBlock";
import { Footer } from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Product Preview Section */}
      <Section id="product" className="bg-background-elevated">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-center mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Product Overview
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Live transcript and AI suggestions{" "}
              <span className="text-green-primary">in one place</span>
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              See your conversation as it happens. Press Enter for what to say next, questions to ask, and key points from your notes.
            </p>
          </div>
          <ProductPreview />
        </motion.div>
      </Section>

      {/* Value Proposition Section */}
      <Section id="features">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-20 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Value Proposition
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Real-time coaching, not post-call notes
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Built for reps who want a coach in the call—suggestions when you need them, not after the meeting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              title="Live Intelligence"
              description="Real-time conversation analysis and insights as you speak. Never miss a critical moment."
            />
            <FeatureCard
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
              title="Real-time Coaching"
              description="AI-powered suggestions that help you handle objections, ask better questions, and close deals."
            />
            <FeatureCard
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
              title="Smart Scripts"
              description="Editable, AI-enhanced scripts that adapt to your conversation. Always know what to say next."
            />
            <FeatureCard
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
              title="Structured Notes"
              description="Automatically capture key points, action items, and follow-ups. Never lose context."
            />
          </div>
        </motion.div>
      </Section>

      {/* How It Works Section */}
      <Section className="bg-background-elevated">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-20 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Simple Process
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              How it works
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Get started in minutes. No complex setup, no training required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Connect your call",
                description:
                  "Start a call through your phone, Zoom, or any platform. Persuaid listens in real time and shows a live transcript.",
              },
              {
                step: "02",
                title: "Get live guidance",
                description:
                  "Press Enter for a suggested line and questions. Use the What to say, Questions, and Key points buttons to get focused suggestions.",
              },
              {
                step: "03",
                title: "Use notes and save the transcript",
                description:
                  "Paste or type notes; AI can rewrite them for the call. When you're done, save the transcript for follow-up.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-green-primary/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Features Grid Section */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-20 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Features
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Everything you need to win
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Powerful features designed for modern sales teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Live transcript",
                description:
                  "See the conversation as it happens. Speaker identification so you know what you and the prospect said—the same feed that powers your suggestions.",
              },
              {
                title: "What to say, questions, key points",
                description:
                  "Press Enter or use filter buttons to get a suggested line, questions to ask, and key points from your notes. Responses are tailored to the last thing the prospect said.",
              },
              {
                title: "Notes + AI rewrite",
                description:
                  "Paste or type product knowledge and objection handling. Use Rewrite with AI to clean them up for the call. Suggestions use your notes as context.",
              },
              {
                title: "Save transcript",
                description:
                  "When the call ends, save the transcript with one click. Download as a file for follow-up emails, CRM, or team handoffs.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Stats Section - realistic early-stage / product metrics */}
      <Section className="bg-background-elevated">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <StatBlock value="10k+" label="Suggestions delivered" />
          <StatBlock value="~2s" label="Avg. suggestion response" />
          <StatBlock value="500+" label="Calls coached" />
          <StatBlock value="Early access" label="Limited spots" />
        </motion.div>
      </Section>

      {/* Testimonials Section */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-20 lg:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Testimonials
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Trusted by sales teams
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              See what closers, reps, and founders are saying about Persuaid.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I was missing follow-ups and forgetting what the prospect said. Now I hit Enter and get a line that actually answers their last question. Huge for discovery calls.",
                author: "Jake M.",
                role: "SDR",
                company: "B2B SaaS",
              },
              {
                quote:
                  "As a founder I’m in every sales call but I’m not a natural closer. Persuaid gives me what to say and questions to ask without it feeling scripted. My co-founder noticed the difference in my last three demos.",
                author: "Priya S.",
                role: "Founder",
                company: "Series A startup",
              },
              {
                quote:
                  "The live transcript plus the ‘what to say’ button is the combo. I use my notes in the app so the suggestions pull from our real product. Way better than winging it on enterprise calls.",
                author: "Marcus T.",
                role: "Account Executive",
                company: "Enterprise software",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Final CTA Section */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-8 leading-tight tracking-tight">
            Start your free trial
          </h2>
          <p className="text-xl sm:text-2xl text-text-muted mb-12 leading-relaxed font-light max-w-2xl mx-auto">
            No credit card required. Sign in or create an account to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton variant="primary" href="/sign-in" className="text-lg px-8 py-4">
              Get started
            </CTAButton>
            <CTAButton variant="secondary" href="/pricing" className="text-lg px-8 py-4">
              Compare plans
            </CTAButton>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
