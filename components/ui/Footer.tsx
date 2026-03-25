export function Footer() {
  const footerLinks = {
    Product: [
      { label: "Pricing", href: "/pricing" },
      { label: "Tutorial", href: "/tutorial" },
      { label: "Our Message", href: "/manifesto" },
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
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-4">
              <img
                src="/Persuaid-wordmark.png?v=1"
                alt="Persuaid"
                className="h-12 sm:h-[3.25rem] md:h-14 w-auto max-w-[min(380px,100%)] object-contain object-left"
                width={280}
                height={56}
              />
            </div>
            <p className="text-text-muted max-w-sm">
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

        {/* Bottom */}
        <div className="pt-8 border-t border-white/[0.08]">
          <p className="text-text-dim text-sm">
            © {new Date().getFullYear()} Persuaid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
