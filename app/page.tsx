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
              Your control center for{" "}
              <span className="text-green-primary">winning conversations</span>
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              See everything you need in one place. Real-time guidance, live
              transcripts, smart scripts, and structured notes.
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
              Why sales teams choose Persuaid
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Built for closers who want to win more deals, not just manage
              them.
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
                  "Start a call through your phone, Zoom, or any platform. Persuaid listens in real-time.",
              },
              {
                step: "02",
                title: "Get live guidance",
                description:
                  "AI analyzes the conversation and provides suggestions, objection handling tips, and next steps.",
              },
              {
                step: "03",
                title: "Close more deals",
                description:
                  "Use transcripts, notes, and insights to follow up effectively and win more opportunities.",
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Live Transcript",
                description:
                  "Real-time transcription with speaker identification and timestamps. Never miss a detail.",
              },
              {
                title: "AI Suggestions",
                description:
                  "Context-aware recommendations for objection handling, questions, and next steps.",
              },
              {
                title: "Editable Scripts",
                description:
                  "Dynamic scripts that adapt to your conversation. Edit on the fly or use AI suggestions.",
              },
              {
                title: "Smart Notes",
                description:
                  "Automatically capture key points, pain points, and action items with intelligent tagging.",
              },
              {
                title: "Objection Handling",
                description:
                  "Get instant guidance on how to address common objections and concerns in real-time.",
              },
              {
                title: "Follow-up Intelligence",
                description:
                  "AI-powered insights help you craft better follow-up messages and close more deals.",
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

      {/* Stats Section */}
      <Section className="bg-background-elevated">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <StatBlock value="3x" label="Faster response time" />
          <StatBlock value="42%" label="Higher close rate" />
          <StatBlock value="2.5hrs" label="Saved per day" />
          <StatBlock value="98%" label="User satisfaction" />
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
                  "Persuaid transformed how I handle sales calls. The real-time suggestions are incredibly accurate, and I've closed 40% more deals since using it.",
                author: "Michael Chen",
                role: "Sales Director",
                company: "TechCorp",
              },
              {
                quote:
                  "As a founder doing sales, I needed help knowing what to say. Persuaid is like having a sales coach in my ear. Game changer.",
                author: "Sarah Johnson",
                role: "Founder & CEO",
                company: "StartupXYZ",
              },
              {
                quote:
                  "The transcript and notes features alone are worth it. But the AI coaching is what makes this product special. It's made me a better closer.",
                author: "David Rodriguez",
                role: "Account Executive",
                company: "SalesForce Pro",
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

      {/* Pricing Section */}
      <Section id="pricing" className="bg-background-elevated">
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
                Pricing
              </span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto leading-relaxed font-light">
              Choose the plan that fits your team. All plans include a 14-day
              free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              price="$49"
              description="Perfect for individual sales reps"
              features={[
                "Unlimited calls",
                "Live transcript",
                "AI suggestions",
                "Basic scripts",
                "Notes & tags",
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
                "Advanced AI coaching",
                "Custom scripts",
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
            Ready to close more deals?
          </h2>
          <p className="text-xl sm:text-2xl text-text-muted mb-12 leading-relaxed font-light max-w-2xl mx-auto">
            Join sales teams using Persuaid to win more conversations. Start
            your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton variant="primary" href="#pricing" className="text-lg px-8 py-4">
              Start Free Trial
            </CTAButton>
            <CTAButton variant="secondary" href="#product" className="text-lg px-8 py-4">
              See How It Works
            </CTAButton>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}
