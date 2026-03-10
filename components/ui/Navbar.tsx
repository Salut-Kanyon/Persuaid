"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show download button when scrolled past 400px (hero section)
      setShowDownloadButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Home", href: "/" },
  ];

  return (
    <>
      {/* Fixed Download Button - appears when scrolling past hero */}
      {showDownloadButton && (
        <div className="fixed top-4 right-4 z-50 hidden md:block animate-in fade-in slide-in-from-top-2">
          <a
            href="/download"
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 border border-green-primary/60 bg-black text-white hover:bg-gray-900 hover:border-green-primary/80 hover:shadow-xl shadow-lg"
          >
            <img
              src="/PersuaidLogo.png"
              alt="Persuaid"
              className="w-4 h-4 flex-shrink-0 object-contain"
            />
            <span>Download</span>
          </a>
        </div>
      )}

      {/* Regular Navbar - scrolls with page */}
      <nav className="bg-background-near-black/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 lg:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-end gap-0 group">
                <img
                  src="/PersuaidLogo.png"
                  alt="Persuaid"
                  className="w-8 h-8 flex-shrink-0 object-contain translate-y-0.5 group-hover:opacity-90 transition-opacity duration-300"
                />
                <span className="text-xl font-bold text-text-primary tracking-tight -ml-1 translate-y-2 group-hover:text-green-accent transition-colors duration-300">
                  ersuaid
                </span>
              </a>
            </div>

            {/* Desktop Navigation - links + CTA */}
            <div className="hidden md:flex md:items-center md:gap-8 md:ml-auto">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-green-accent transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-primary group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
              <a
                href="/download"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-green-primary/60 bg-green-primary/10 text-green-accent hover:bg-green-primary/20 transition-colors duration-300"
              >
                Start free trial
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300",
              mobileMenuOpen ? "max-h-64 pb-4" : "max-h-0"
            )}
          >
            <div className="flex flex-col space-y-4 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-text-secondary hover:text-green-accent transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/download"
                className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 border border-green-primary/60 bg-black text-white hover:bg-gray-900 hover:border-green-primary/80 hover:shadow-xl shadow-lg w-full"
              >
                <img
                  src="/PersuaidLogo.png"
                  alt="Persuaid"
                  className="w-4 h-4 flex-shrink-0 object-contain"
                />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
