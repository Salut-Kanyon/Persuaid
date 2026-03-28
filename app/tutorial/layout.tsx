import type { Metadata } from "next";

const site =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://persuaid.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Tutorial | Persuaid",
  description:
    "Quick-start video: get oriented with Persuaid and your AI copilot for sales calls. Watch with sound for the full walkthrough.",
  alternates: {
    canonical: "/tutorial",
  },
  openGraph: {
    title: "Persuaid — Quick start tutorial",
    description:
      "Watch the short tutorial to see how Persuaid helps you say the right thing on every call.",
    url: `${site}/tutorial`,
    siteName: "Persuaid",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Persuaid — Quick start tutorial",
    description:
      "Watch the short tutorial to see how Persuaid helps you say the right thing on every call.",
  },
};

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
