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
    <main className="min-h-screen bg-background-near-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow effects matching the theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-green-primary/20 border border-green-primary/30 flex items-center justify-center mb-4 group hover:bg-green-primary/30 transition-colors duration-300">
            <span className="text-green-primary font-bold text-xl group-hover:text-green-accent transition-colors duration-300">P</span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-2 text-center tracking-tight">
          {isSignUp ? "Create account" : "Sign in"}
        </h1>
        <p className="text-center text-text-muted mb-8">
          {isSignUp ? "Get started with Persuaid" : "Welcome back to Persuaid"}
        </p>

        <div className="w-full bg-background-elevated rounded-2xl shadow-card border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/50 transition-all duration-200"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/50 transition-all duration-200"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-button bg-green-primary text-white font-semibold hover:bg-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-button hover:shadow-button-hover hover:shadow-glow-button relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-accent/0 via-green-accent/20 to-green-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10">
                {loading ? "Signing in…" : isSignUp ? "Create account" : "Sign in"}
              </span>
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}

          <p className="text-center text-sm text-text-muted mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-green-primary font-medium hover:text-green-accent transition-colors duration-200"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
