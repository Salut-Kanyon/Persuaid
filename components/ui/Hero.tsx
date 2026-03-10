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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="flex flex-col items-center gap-8">
          {/* Hero Content - Above */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center w-full -mt-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight"
            >
              Sales calls are hard.{" "}
              <span className="text-green-primary">Persuaid guides you</span> on what to say.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-text-muted mb-3 max-w-2xl mx-auto leading-relaxed font-light"
            >
              AI listens to your call and suggests what to say next—and questions to ask—in real time.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-sm text-text-dim mb-8 max-w-xl mx-auto"
            >
              For SDRs, AEs, and founders who run their own demos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-3 mb-8"
            >
              <a
                href="/sign-in"
                className="group flex items-center gap-3 px-8 py-3.5 text-base font-semibold rounded-2xl transition-all duration-300 border-2 border-green-primary/70 bg-black text-white hover:bg-gray-900 hover:border-green-primary hover:shadow-2xl hover:shadow-green-primary/20 shadow-lg transform hover:scale-105 active:scale-100"
              >
                <img
                  src="/PersuaidLogo.png"
                  alt="Persuaid"
                  className="w-5 h-5 flex-shrink-0 object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-lg">Get started</span>
              </a>
              <a
                href="#product"
                className="text-sm text-text-dim hover:text-green-accent transition-colors duration-200"
              >
                See it in action →
              </a>
            </motion.div>
          </motion.div>

          {/* Product Preview - Below, Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Enhanced glow effects */}
              <div className="absolute -inset-6 bg-green-primary/30 blur-3xl rounded-3xl opacity-60 animate-pulse" />
              <div className="absolute -inset-3 bg-green-primary/20 blur-2xl rounded-3xl opacity-40" />
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
