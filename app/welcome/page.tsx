"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { supabase } from "@/lib/supabase/client";

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const stopChecking = () => {
      if (!cancelled) setChecking(false);
    };
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setChecking(false);
          if (session) router.replace("/dashboard");
        }
      })
      .catch(() => {
        stopChecking();
      })
      .finally(stopChecking);
    // If getSession hangs (e.g. desktop app, network), show welcome after 2.5s
    const t = setTimeout(stopChecking, 2500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-background-near-black flex flex-col items-center justify-center gap-6">
        <div className="w-10 h-10 rounded-full border-2 border-green-primary/40 border-t-green-primary animate-spin" />
        <p className="text-text-muted text-sm font-medium">Opening Persuaid…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-near-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[28rem] h-[28rem] bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-primary/10 border border-green-primary/20 mb-6"
        >
          <span className="w-1.5 h-1.5 bg-green-primary rounded-full animate-pulse" />
          <span className="text-[11px] font-medium text-green-accent tracking-wider uppercase">
            AI-Powered Sales Intelligence
          </span>
        </motion.div>

        {/* Logo + wordmark — primary brand */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-end justify-center gap-0 mb-8"
        >
          <img
            src={PERSUAID_MARK_PNG}
            alt="Persuaid"
            className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 object-contain translate-y-1"
          />
          <span className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight -ml-1 translate-y-3">
            ersuaid
          </span>
        </motion.div>

        {/* Headline — supporting message, smaller than brand */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl sm:text-2xl font-semibold text-text-primary mb-2 tracking-tight leading-snug"
        >
          Say the right thing on{" "}
          <span className="text-green-primary">every call</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-text-muted text-sm leading-relaxed mb-10 max-w-xs mx-auto"
        >
          Real-time AI guidance for sales conversations. Your copilot in the room.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full max-w-xs mx-auto"
        >
          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base bg-green-primary hover:bg-green-dark transition-all duration-200 shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2 focus:ring-offset-background-near-black"
          >
            Join now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-text-dim text-[11px] text-center mt-12 max-w-xs"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6 pt-6 border-t border-border/40 flex items-center justify-center gap-6 text-text-dim/80 text-[11px] font-medium"
        >
          <span>Forbes</span>
          <span>The New York Times</span>
          <span>TechCrunch</span>
        </motion.div>
      </div>
    </main>
  );
}
