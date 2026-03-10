"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";
import { ProductPreview } from "@/components/ui/ProductPreview";
import { CTAButton } from "@/components/ui/CTAButton";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Product Overview Section */}
      <Section id="product">
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
              See your conversation as it happens. Press Enter for the next line to say, or use Follow-up for a strong question—grounded in the notes you keep on the right.
            </p>
          </div>
          <ProductPreview />
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
                  "Press Enter for the exact next line to say, or use Follow-up for a strong question that moves the deal forward. Suggestions stay grounded in your notes and script.",
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

      <FAQSection />

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
              Try for Free
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
