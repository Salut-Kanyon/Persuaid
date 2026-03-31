"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { cn } from "@/lib/utils";

export default function DownloadPage() {
  const [downloadingTarget, setDownloadingTarget] = useState<"mac" | "windows" | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  /** Direct CDN/GitHub URL at build time, or `/api/download/mac` (server redirect + env at runtime). */
  const macUrl =
    process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL?.trim() || "/api/download/mac";
  const windowsUrl =
    process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL?.trim() || "/downloads/Persuaid-Setup.exe";

  useEffect(() => {
    setIsLocalhost(/localhost|127\.0\.0\.1/.test(window.location?.host ?? ""));
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    setCheckoutSuccess(checkout === "success");
  }, []);

  const supportMailto = useMemo(
    () => "mailto:persuaidapp@gmail.com?subject=Windows%20beta%20access%20request",
    []
  );

  const startDownload = async (
    target: "mac" | "windows",
    assetUrl: string,
    filename: string
  ) => {
    setDownloadingTarget(target);
    setDownloadError(null);

    try {
      try {
        const response = await fetch(assetUrl, { method: "HEAD" });
        if (response.status === 404) {
          setDownloadError(
            isLocalhost
              ? `${filename} not found. Generate a fresh desktop build, then refresh this page.`
              : target === "windows"
                ? "Windows build is not live yet. Join the beta list and we will send you the installer."
                : "macOS download is not available yet. Please try again shortly."
          );
          setDownloadingTarget(null);
          return;
        }
      } catch {
        // HEAD can fail (CORS etc.); still attempt download.
      }

      const link = document.createElement("a");
      link.href = assetUrl;
      // For same-origin assets keep explicit filename; for remote hosts let server headers drive filename.
      if (assetUrl.startsWith("/")) {
        link.download = filename;
      }
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        setDownloadingTarget(null);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      setDownloadError("Failed to start download. Please try again or contact support.");
      setDownloadingTarget(null);
    }
  };

  return (
    <main className="min-h-screen bg-background-near-black">
      <Navbar />

      <div className="relative z-10 min-h-[calc(100vh-8rem)]">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            {checkoutSuccess && (
              <div className="mb-6 rounded-xl border border-green-primary/35 bg-green-primary/10 p-3 text-sm text-green-accent">
                Payment successful. Choose your desktop download below.
              </div>
            )}

            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Download Persuaid Desktop
            </h1>
            <p className="mt-4 text-base text-text-muted sm:text-lg">
              Pick your platform and install in under a minute.
            </p>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="rounded-2xl border border-border/60 bg-background-surface/50 p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <svg className="h-6 w-6 text-text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">macOS</h2>
              <p className="mt-1 text-sm text-text-muted">Universal app (.dmg)</p>
              <button
                type="button"
                onClick={() => void startDownload("mac", macUrl, "Persuaid.dmg")}
                disabled={downloadingTarget !== null}
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  "bg-green-primary text-white hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {downloadingTarget === "mac" ? "Starting download..." : "Download for Mac"}
              </button>
              <p className="mt-3 text-xs text-text-dim">
                If Gatekeeper warns, right-click app in Applications and choose Open.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14 }}
              className="rounded-2xl border border-border/60 bg-background-surface/40 p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <svg className="h-6 w-6 text-text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M1 4l9.5-1.3v9.1H1V4zm10.5-1.4L23 1v10.8H11.5V2.6zM1 12.9h9.5V22L1 20.7v-7.8zm10.5 0H23V23l-11.5-1.6v-8.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Windows</h2>
              <p className="mt-1 text-sm text-text-muted">Installer (.exe)</p>
              <button
                type="button"
                disabled
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  "border border-border/70 bg-background-elevated/50 text-text-muted cursor-not-allowed opacity-75"
                )}
              >
                Windows beta soon
              </button>
              <a
                href={supportMailto}
                className="mt-3 inline-flex text-xs font-medium text-green-accent hover:text-green-primary"
              >
                Join Windows beta waitlist
              </a>
            </motion.div>
          </div>

          {downloadError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {downloadError}
            </motion.div>
          )}

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border/60 bg-background-elevated/35 p-6">
            <h3 className="text-base font-semibold text-text-primary">Install in 3 steps</h3>
            <ol className="mt-4 space-y-3 text-sm text-text-secondary">
              <li>1. Download the installer for your OS.</li>
              <li>2. Drag or run installer and place Persuaid in Applications/Programs.</li>
              <li>3. Open Persuaid and sign in to start your trial.</li>
            </ol>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
