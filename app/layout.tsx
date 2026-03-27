import type { Metadata } from "next";
import { Inter, Instrument_Serif, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ClearLegacyThemeClass } from "@/components/ClearLegacyThemeClass";
import { ElectronFramelessChrome } from "@/components/app/ElectronFramelessChrome";
import { PERSUAID_MARK_PNG } from "@/lib/branding";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Landing hero headline — distinct from body (Inter) */
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hero-display",
  display: "swap",
});

/** Landing hero subtitle — humanist sans, distinct from Inter body */
const sourceSansSubtitle = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-hero-subtitle",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persuaid - AI Copilot for Sales Calls",
  description: "Say the right thing on every sales call. Real-time AI guidance for sales conversations.",
  icons: {
    icon: PERSUAID_MARK_PNG,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${sourceSansSubtitle.variable}`}>
      <body>
        <div id="app-shell" className="relative flex min-h-[100dvh] w-full flex-col">
          <ElectronFramelessChrome />
          <ClearLegacyThemeClass />
          {children}
          <Analytics />
        </div>
      </body>
    </html>
  );
}
