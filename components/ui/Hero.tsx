"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CTAButton } from "./CTAButton";

const FADE_START = 0;
const FADE_END = 950;

const HERO_TITLE =
  "Sales calls are hard. Persuaid guides you on what to say.";
const HERO_SUBTITLE =
  "AI listens to your call and suggests what to say next—and questions to ask—in real time.";

const HERO_WORDS = HERO_TITLE.split(" ");

function HeroTitleWords() {
  return (
    <>
      {HERO_WORDS.map((word, index) => {
        const isPersuaid = word.replace(/[.,!?]/g, "") === "Persuaid";
        return (
          <span key={index} className="inline-block whitespace-pre">
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.09,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={isPersuaid ? "text-green-primary" : ""}
            >
              {word}
            </motion.span>
            {index < HERO_WORDS.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

export function Hero() {
  const [bgOpacity, setBgOpacity] = useState(1);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      const opacity = Math.max(0, 1 - (y - FADE_START) / FADE_END);
      setBgOpacity(opacity);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stagger subtitle and CTA after word-by-word title finishes
  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtitle(true), 1200);
    const t2 = setTimeout(() => setShowCTA(true), 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32 pb-32 overflow-hidden">
      {/* Landing background image - fades out on scroll */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-150"
        style={{
          backgroundImage: "url(/LandingBackgroundSimple.png)",
          opacity: bgOpacity,
        }}
        aria-hidden
      />
      {/* Enhanced background glow with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="flex flex-col items-center gap-8">
          {/* Hero Content - Above */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center w-full -mt-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
              <HeroTitleWords />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showSubtitle ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-base sm:text-lg text-text-muted mb-4 max-w-2xl mx-auto leading-relaxed font-light"
            >
              {HERO_SUBTITLE}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showCTA ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
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
                  <span className="text-lg">Try for Free</span>
                </a>
                <a
                  href="#product"
                  className="text-sm text-text-dim hover:text-green-accent transition-colors duration-200"
                >
                  See it in action →
                </a>
            </motion.div>
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
