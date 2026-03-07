"use client";

import { motion } from "framer-motion";
import { CTAButton } from "./CTAButton";
import { ProductPreview } from "./ProductPreview";

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32 pb-32 overflow-hidden">
      {/* Enhanced background glow with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-primary/10 border border-green-primary/20 mb-8"
            >
              <span className="w-2 h-2 bg-green-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-accent">AI-Powered Sales Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary mb-8 leading-[1.1] tracking-tight"
            >
              Say the right thing on{" "}
              <span className="text-green-primary">every sales call</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl sm:text-2xl text-text-muted mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              Real-time AI guidance for sales conversations. The copilot that helps
              closers, reps, and founders{" "}
              <span className="text-text-secondary font-medium">win more deals</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <CTAButton variant="primary" href="/download">
                Start Free Trial
              </CTAButton>
              <CTAButton variant="secondary" href="#product">
                Watch Demo
              </CTAButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-primary/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-green-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-text-secondary">No credit card required</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-primary/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-green-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-text-secondary">14-day free trial</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Product Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative">
              {/* Enhanced glow effects */}
              <div className="absolute -inset-8 bg-green-primary/30 blur-3xl rounded-3xl opacity-60 animate-pulse" />
              <div className="absolute -inset-4 bg-green-primary/20 blur-2xl rounded-3xl opacity-40" />
              <ProductPreview className="relative transform hover:scale-[1.01] transition-transform duration-700" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-text-dim rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-text-dim rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
