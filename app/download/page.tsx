"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function DownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      // DMG file path - served from public/downloads in production
      const dmgUrl = "/downloads/Persuaid.dmg";
      
      // First, check if file exists (optional - for better UX)
      try {
        const response = await fetch(dmgUrl, { method: "HEAD" });
        if (!response.ok && response.status === 404) {
          throw new Error("Download file not found");
        }
      } catch (err) {
        // If HEAD fails, still try to download (might be CORS issue)
        console.warn("Could not verify file existence, proceeding with download");
      }
      
      // Create download link
      const link = document.createElement("a");
      link.href = dmgUrl;
      link.download = "Persuaid.dmg";
      link.style.display = "none";
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        setIsDownloading(false);
      }, 100);
      
    } catch (error) {
      console.error("Download error:", error);
      setDownloadError("Failed to start download. Please try again or contact support.");
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background-near-black">
      <Navbar />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Section className="min-h-screen flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            {/* Apple Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-primary/20 to-green-primary/5 border border-green-primary/30 flex items-center justify-center relative overflow-hidden group">
                <motion.svg
                  className="w-12 h-12 text-green-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </motion.svg>
                <div className="absolute inset-0 bg-gradient-to-r from-green-accent/0 via-green-accent/30 to-green-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-block mb-6"
            >
              <span className="text-sm font-semibold text-green-accent uppercase tracking-wider">
                Download for macOS
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary mb-6 leading-[1.1] tracking-tight"
            >
              Get Persuaid for{" "}
              <span className="text-green-primary">Mac</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl sm:text-2xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-light"
            >
              Start your free trial today. Download the desktop app and experience
              real-time AI guidance for your sales conversations.
            </motion.p>

            {/* Download Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center px-12 py-5 rounded-button bg-green-primary text-white font-semibold text-lg hover:bg-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-button hover:shadow-button-hover hover:shadow-glow-button relative overflow-hidden group mb-8"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-accent/0 via-green-accent/20 to-green-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-3">
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download for Mac
                  </>
                )}
              </span>
            </motion.button>

            {/* Error Message */}
            {downloadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm max-w-md mx-auto"
              >
                {downloadError}
              </motion.div>
            )}

            {/* Direct Download Link (fallback) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-4"
            >
              <a
                href="/downloads/Persuaid.dmg"
                download="Persuaid.dmg"
                className="text-sm text-text-muted hover:text-green-accent transition-colors duration-200"
              >
                Or click here to download directly
              </a>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 p-6 bg-background-elevated border border-border rounded-card max-w-2xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4">Installation Instructions</h3>
              <ol className="text-left space-y-3 text-text-secondary text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-primary/20 text-green-primary flex items-center justify-center font-semibold text-xs mt-0.5">1</span>
                  <span>Open the downloaded DMG file</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-primary/20 text-green-primary flex items-center justify-center font-semibold text-xs mt-0.5">2</span>
                  <span>Drag Persuaid to your Applications folder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-primary/20 text-green-primary flex items-center justify-center font-semibold text-xs mt-0.5">3</span>
                  <span>Open Persuaid from Applications and start your free trial</span>
                </li>
              </ol>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm"
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
                <span className="text-text-secondary">Native macOS app</span>
              </div>
            </motion.div>
          </motion.div>
        </Section>
      </div>

      <Footer />
    </main>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`py-section-sm md:py-section-md lg:py-section ${className}`}>
      {children}
    </section>
  );
}
