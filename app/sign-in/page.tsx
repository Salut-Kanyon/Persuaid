"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PersuaidLogo } from "@/components/ui/PersuaidLogo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <PersuaidLogo className="w-14 h-14 text-green-primary" />
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/50 transition-all duration-200"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-dim hover:text-text-primary hover:bg-background-surface/50 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
