"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { InstallStepFlow } from "@/components/download/InstallStepFlow";
import { cn } from "@/lib/utils";

type Platform = "mac" | "windows";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M1 4l9.5-1.3v9.1H1V4zm10.5-1.4L23 1v10.8H11.5V2.6zM1 12.9h9.5V22L1 20.7v-7.8zm10.5 0H23V23l-11.5-1.6v-8.5z" />
    </svg>
  );
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform>("mac");
  const [downloadingTarget, setDownloadingTarget] = useState<"mac" | "windows" | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const macUrl =
    process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL?.trim() || "/api/download/mac";

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
    <main className="relative overflow-x-hidden bg-[#050506] text-text-primary">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0b] via-[#060708] to-[#030304]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      <Navbar />

      <div className="relative z-10">
        {/* Full-bleed top hero: MacBook fills width; copy + toggle + CTA sit on top */}
        <section className="relative w-full overflow-hidden pb-8 pt-10 sm:pb-10 sm:pt-14">
          {/* Fixed viewport height so hero photos + overlays do not rescale when content below grows */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[min(88vh,900px)] overflow-hidden sm:h-[min(90vh,960px)]"
            aria-hidden
          >
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export + hero assets */}
              <motion.img
                src="/images/download-hero-macbook.png"
                alt=""
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-[center_58%] sm:object-[center_55%]"
                initial={false}
                animate={{ opacity: platform === "mac" ? 0.55 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- static export + hero assets */}
              <motion.img
                src="/images/download-hero-windows.png"
                alt=""
                decoding="async"
                loading="eager"
                className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-[center_58%] sm:object-[center_55%]"
                initial={false}
                animate={{ opacity: platform === "windows" ? 0.55 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-black/45 sm:bg-black/40"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/78 via-black/55 to-black/92"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_35%,rgba(0,0,0,0.28),transparent_55%)]"
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(26,157,120,0.08),transparent_55%)]"
              aria-hidden
              initial={false}
              animate={{ opacity: platform === "mac" ? 1 : 0 }}
              transition={{ duration: 0.45 }}
            />
          </div>

          <div className="relative z-[1] mx-auto flex max-w-3xl flex-col px-5 sm:px-8 lg:max-w-4xl lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {checkoutSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 inline-flex rounded-full border border-green-primary/25 bg-green-primary/[0.12] px-4 py-2.5 text-sm text-green-accent/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
                >
                  Payment successful. Choose your desktop download below.
                </motion.div>
              )}

              <h1 className="mx-auto max-w-[18ch] font-sans text-[2.125rem] font-semibold leading-[1.12] tracking-[-0.045em] text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] sm:max-w-none sm:text-[2.75rem] sm:leading-[1.08] sm:tracking-[-0.048em] lg:text-[3.35rem] lg:tracking-[-0.05em]">
                <span className="block text-[0.42em] font-medium uppercase tracking-[0.22em] text-white/55 sm:text-[0.38em] sm:tracking-[0.26em]">
                  Download
                </span>
                <span className="mt-1 block bg-gradient-to-b from-white via-white to-white/88 bg-clip-text text-transparent sm:mt-1.5">
                  Persuaid Desktop
                </span>
              </h1>

              <div className="mt-5 flex justify-center sm:mt-6">
                <div
                  className="inline-flex gap-1 rounded-full border border-white/[0.16] bg-black/40 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg sm:gap-1.5 sm:p-1.5"
                  role="tablist"
                  aria-label="Choose platform"
                >
                  {(["mac", "windows"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={platform === key}
                      aria-label={key === "mac" ? "macOS" : "Windows"}
                      onClick={() => setPlatform(key)}
                      className={cn(
                        "relative flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-[color] duration-300 sm:gap-2 sm:px-4 sm:py-2",
                        platform === key
                          ? "text-white"
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {platform === key && (
                        <motion.span
                          layoutId="platform-pill"
                          className="absolute inset-0 rounded-full bg-white/[0.16] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_4px_12px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.1]"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <span className="relative z-[1] flex items-center gap-1.5 sm:gap-2">
                        {key === "mac" ? (
                          <AppleIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                        ) : (
                          <WindowsIcon className="h-[1.125rem] w-[1.125rem] shrink-0 sm:h-5 sm:w-5" />
                        )}
                        <span className="text-[0.8125rem] font-semibold tracking-[-0.02em] sm:text-[0.9rem]">
                          {key === "mac" ? "macOS" : "Windows"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="mt-5 flex flex-col justify-start pb-10 pt-3 sm:mt-6 sm:pb-12 sm:pt-4">
              {/* Fixed-height block so toggling macOS/Windows does not shift the install steps */}
              <div className="mx-auto w-full max-w-md text-center">
                <div className="mt-14 sm:mt-16">
                  {platform === "mac" ? (
                    <motion.button
                      type="button"
                      onClick={() => void startDownload("mac", macUrl, "Persuaid.dmg")}
                      disabled={downloadingTarget !== null}
                      whileHover={{ scale: downloadingTarget !== null ? 1 : 1.015 }}
                      whileTap={{ scale: downloadingTarget !== null ? 1 : 0.99 }}
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      className={cn(
                        "group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl px-6 py-4 text-base font-semibold tracking-[-0.02em] sm:py-[1.125rem] sm:text-lg",
                        "border border-green-primary/45 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_32px_-4px_rgba(26,157,120,0.45)]",
                        "transition-[border-color,box-shadow] duration-300 ease-out",
                        "enabled:hover:border-green-primary/70 enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_40px_-4px_rgba(26,157,120,0.55)]",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-b from-[#2eb896] via-green-primary to-[#158f6c] opacity-100 transition-[filter,opacity] duration-300 ease-out group-hover:brightness-110 group-disabled:opacity-55 group-disabled:group-hover:brightness-100"
                      />
                      <span className="relative z-[1] flex items-center justify-center gap-3">
                        <AppleIcon className="h-6 w-6 shrink-0 text-white sm:h-7 sm:w-7" />
                        <span>
                          {downloadingTarget === "mac" ? "Starting download..." : "Download for Mac"}
                        </span>
                      </span>
                    </motion.button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={cn(
                        "inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-medium tracking-[-0.02em] sm:py-[1.125rem] sm:text-lg",
                        "border border-white/15 bg-black/40 text-white/50",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                      )}
                    >
                      <WindowsIcon className="h-6 w-6 shrink-0 text-white/45 sm:h-7 sm:w-7" />
                      <span>Windows beta soon</span>
                    </button>
                  )}
                </div>

                <div className="mt-6 flex h-[2.25rem] items-center justify-center sm:h-[2.375rem]">
                  {platform === "windows" ? (
                    <a
                      href={supportMailto}
                      className="inline-flex text-sm font-medium text-green-accent/90 transition-colors hover:text-green-light sm:text-[0.9375rem]"
                    >
                      Join Windows beta waitlist
                    </a>
                  ) : (
                    <span
                      className="invisible inline-flex select-none text-sm font-medium sm:text-[0.9375rem]"
                      aria-hidden
                    >
                      Join Windows beta waitlist
                    </span>
                  )}
                </div>

                {/* Below download + waitlist row; flow layout only — no mt-auto on hero */}
                <div className="mt-6 w-full px-1 sm:mt-6">
                  <InstallStepFlow platform={platform} />
                </div>
              </div>

              {downloadError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200/95 backdrop-blur-md"
                >
                  {downloadError}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
