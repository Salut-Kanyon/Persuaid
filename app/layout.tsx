import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persuaid - AI Copilot for Sales Calls",
  description: "Say the right thing on every sales call. Real-time AI guidance for sales conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} style={{ background: "#0a0a0a" }}>
      <body style={{ backgroundColor: "#0a0a0a", color: "#f9fafb" }}>{children}</body>
    </html>
  );
}
