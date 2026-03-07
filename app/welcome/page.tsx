"use client";

import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Simple black wordmark logo (Cluely-style) */}
      <div className="mb-10">
        <span className="text-2xl font-bold text-black tracking-tight">
          Persuaid
        </span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-black text-center mb-3 tracking-tight">
        Welcome to Persuaid
      </h1>
      <p className="text-gray-500 text-center mb-14 max-w-sm text-base">
        The ultimate AI meeting assistant.
      </p>
      <Link
        href="/sign-in"
        className="w-full max-w-sm py-4 px-10 rounded-2xl font-semibold text-white text-center text-lg bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] transition shadow-lg"
      >
        Continue &gt;
      </Link>
      <p className="text-gray-400 text-sm text-center mt-20 max-w-sm">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
      {/* As seen in / press logos */}
      <div className="mt-10 flex items-center justify-center gap-8 text-gray-400 text-sm font-medium">
        <span>Forbes</span>
        <span>The New York Times</span>
        <span>TechCrunch</span>
      </div>
    </main>
  );
}
