"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.replace("/dashboard");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.replace("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-10 h-10 rounded-lg bg-[#0f172a] flex items-center justify-center mb-4">
        <span className="text-white font-bold">P</span>
      </div>
      <h1 className="text-2xl font-bold text-black mb-8">Sign in</h1>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  );
}
