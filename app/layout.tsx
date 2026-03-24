import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ClearLegacyThemeClass } from "@/components/ClearLegacyThemeClass";
import { ElectronFramelessChrome } from "@/components/app/ElectronFramelessChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persuaid - AI Copilot for Sales Calls",
  description: "Say the right thing on every sales call. Real-time AI guidance for sales conversations.",
  icons: {
    icon: "/PersuaidLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
