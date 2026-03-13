import { CTAButton } from "./CTAButton";

export function Footer() {
  const footerLinks = {
    Product: [
      { label: "Pricing", href: "/pricing" },
      { label: "Manifesto", href: "/manifesto" },
    ],
    Support: [
      { label: "Help Center", href: "/contact" },
      { label: "Contact", href: "/contact" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Data Processing Agreement", href: "/data-processing-agreement" },
      { label: "Subprocessors", href: "/subprocessors" },
    ],
  };

  return (
    <footer className="border-t border-border bg-background-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-end gap-0 mb-4">
              <img
                src="/PersuaidLogo.png"
                alt="Persuaid"
                className="w-10 h-10 flex-shrink-0 object-contain translate-y-0.5"
              />
              <span className="text-2xl font-bold text-text-primary tracking-tight -ml-1 translate-y-2">
                ersuaid
              </span>
            </div>
            <p className="text-text-muted mb-4 max-w-sm">
              The AI copilot for sales calls. Say the right thing on every
              conversation.
            </p>
            <CTAButton variant="primary" href="/pricing">
              Start free trial
            </CTAButton>
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
                      className="text-text-muted hover:text-green-accent transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-dim text-sm">
            © {new Date().getFullYear()} Persuaid. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-text-dim hover:text-green-accent transition-colors duration-200 text-sm"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-text-dim hover:text-green-accent transition-colors duration-200 text-sm"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
