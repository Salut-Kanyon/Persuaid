"use client";

import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { MARKETING_SITE_ORIGIN, isElectronApp, openMarketingUrl } from "@/lib/electron-client";

export function Footer() {
  const footerLinks = {
    Product: [
      { label: "Pricing", href: "/pricing" },
      { label: "Tutorial", href: "/tutorial" },
      { label: "Our Message", href: "/manifesto" },
    ],
    Support: [
      { label: "Get in Touch", href: "/contact" },
      { label: "Contact Us", href: "/contact-us" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Data Processing Agreement", href: "/data-processing-agreement" },
      { label: "Subprocessors", href: "/subprocessors" },
    ],
  };

  return (
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <p className="text-text-muted max-w-sm mb-0">
              The AI copilot for sales calls. Say the right thing on every
              conversation.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-text-primary mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={
                        link.href === "/pricing"
                          ? (e) => {
                              if (!isElectronApp()) return;
                              e.preventDefault();
                              void openMarketingUrl(`${MARKETING_SITE_ORIGIN}/pricing`);
                            }
                          : undefined
                      }
                      className="text-text-muted hover:text-text-primary transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom — logo lockup + legal */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <a
            href="/"
            className="inline-flex items-end gap-0 self-start opacity-90 hover:opacity-100 transition-opacity"
            aria-label="Persuaid home"
          >
            <img
              src={PERSUAID_MARK_PNG}
              alt=""
              width={32}
              height={32}
              aria-hidden
              className="h-7 w-7 shrink-0 object-contain translate-y-0.5"
            />
            <span
              className="text-base font-bold text-stone-100 tracking-tight -ml-1 translate-y-1"
              aria-hidden
            >
              ersuaid
            </span>
          </a>
          <p className="text-text-dim text-sm sm:text-right sm:pb-0.5">
            © {new Date().getFullYear()} Persuaid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
