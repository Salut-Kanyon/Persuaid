"use client";

import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-background-near-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow to match site theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo wordmark */}
        <div className="mb-10">
          <span className="text-2xl font-bold text-text-primary tracking-tight">
            <span className="text-green-primary">Persuaid</span>
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary text-center mb-3 tracking-tight">
          Welcome to <span className="text-green-primary">Persuaid</span>
        </h1>
        <p className="text-text-muted text-center mb-14 max-w-sm text-base">
          The ultimate AI meeting assistant.
        </p>
        <Link
          href="/sign-in"
          className="w-full max-w-sm py-4 px-10 rounded-2xl font-semibold text-white text-center text-lg bg-green-primary hover:bg-green-dark transition shadow-button hover:shadow-button-hover focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2 focus:ring-offset-background-near-black"
        >
          Continue &gt;
        </Link>
        <p className="text-text-muted text-sm text-center mt-20 max-w-sm">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
        <div className="mt-10 flex items-center justify-center gap-8 text-text-muted text-sm font-medium">
          <span>Forbes</span>
          <span>The New York Times</span>
          <span>TechCrunch</span>
        </div>
      </div>
    </main>
  );
}
