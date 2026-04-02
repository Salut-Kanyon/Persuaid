"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { PERSUAID_MARK_PNG } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { GoogleGIcon } from "@/components/ui/GoogleGIcon";
import { AppleIcon } from "@/components/ui/AppleIcon";
import { getOAuthCallbackRedirectUrl } from "@/lib/oauth-redirect";
import { getSafeInternalPath } from "@/lib/safe-path";
import { isElectronApp } from "@/lib/electron-client";

/** Marketing CTAs use `/sign-in` → create account first. Auth redirects use `?signin=1` to open sign-in. */
function SignInForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const afterAuthPath = () => getSafeInternalPath(nextParam, "/dashboard");
  const signinParam = searchParams.get("signin");
  const openSignIn = signinParam === "1" || signinParam === "true";

  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "apple" | null>(null);
  const [oauthBrowserHint, setOauthBrowserHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(!openSignIn);
  const router = useRouter();

  useEffect(() => {
    const oauthErr = searchParams.get("oauth_error");
    if (oauthErr) {
      try {
        setError(decodeURIComponent(oauthErr));
      } catch {
        setError(oauthErr);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords don’t match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.replace(afterAuthPath());
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.replace(afterAuthPath());
    }
  }

  function switchMode(next: boolean) {
    if (next === isSignUp) return;
    setIsSignUp(next);
    setError(null);
    if (!next) setConfirmPassword("");
  }

  async function handleOAuthSignIn(provider: "google" | "apple") {
    setError(null);
    setOauthBrowserHint(false);
    setOauthProvider(provider);
    const redirectTo = getOAuthCallbackRedirectUrl(nextParam);

    if (isElectronApp()) {
      const api = (
        window as Window & {
          persuaid?: {
            openOAuthWindow?: (url: string) => Promise<{ ok?: boolean; error?: string; external?: boolean }>;
          };
        }
      ).persuaid;
      if (api?.openOAuthWindow) {
        const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (oauthErr) {
          setOauthProvider(null);
          setError(oauthErr.message);
          return;
        }
        if (!data?.url) {
          setOauthProvider(null);
          setError("Could not start sign-in.");
          return;
        }
        const res = await api.openOAuthWindow(data.url);
        setOauthProvider(null);
        if (!res || res.ok === false) {
          setError(typeof res?.error === "string" ? res.error : "Could not open sign-in window.");
        } else if (res.external) {
          setOauthBrowserHint(true);
        }
        return;
      }
    }

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (err) {
      setOauthProvider(null);
      setError(err.message);
    }
  }
  const spring = { type: "spring" as const, stiffness: 380, damping: 28 };

  return (
    <main className="min-h-screen bg-background-near-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Soft aurora drift */}
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[min(120vw,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14)_0%,transparent_65%)] blur-3xl"
        aria-hidden
        animate={
          reduceMotion
            ? {}
            : {
                opacity: [0.45, 0.7, 0.45],
                scale: [1, 1.04, 1],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-green-glow/8 via-green-glow/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          className="flex items-end justify-center gap-0 mb-8"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <motion.div
            animate={
              reduceMotion
                ? {}
                : { y: [0, -3, 0] }
            }
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={PERSUAID_MARK_PNG}
              alt="Persuaid"
              className="w-12 h-12 flex-shrink-0 object-contain translate-y-1"
            />
          </motion.div>
          <span className="text-2xl font-bold text-text-primary tracking-tight -ml-1 translate-y-3">
            ersuaid
          </span>
        </motion.div>

        <motion.div
          className="relative rounded-2xl bg-background-elevated shadow-card border border-border p-6 sm:p-8 overflow-hidden"
          animate={
            reduceMotion
              ? {}
              : {
                  boxShadow: [
                    "0 0 0 0 rgba(16,185,129,0), 0 25px 50px -12px rgba(0,0,0,0.25)",
                    "0 0 36px -6px rgba(16,185,129,0.14), 0 25px 50px -12px rgba(0,0,0,0.25)",
                    "0 0 0 0 rgba(16,185,129,0), 0 25px 50px -12px rgba(0,0,0,0.25)",
                  ],
                }
          }
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Floating specks */}
            {!reduceMotion && (
              <>
                <motion.span
                  className="pointer-events-none absolute top-16 right-8 h-1 w-1 rounded-full bg-green-primary/50"
                  animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -6, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  className="pointer-events-none absolute bottom-24 left-10 h-1.5 w-1.5 rounded-full bg-green-primary/35"
                  animate={{ opacity: [0.15, 0.65, 0.15], y: [0, 10, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                />
                <motion.span
                  className="pointer-events-none absolute top-1/2 right-6 h-px w-8 bg-gradient-to-r from-transparent via-green-primary/30 to-transparent"
                  animate={{ opacity: [0.2, 0.55, 0.2], scaleX: [0.85, 1, 0.85] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            {/* Mode toggle — compact for in-app / workspace auth */}
            <div
              className="relative mb-5 rounded-xl bg-background-surface-elevated/80 p-1 border border-border/80"
              role="tablist"
              aria-label="Account access"
            >
              <motion.div
                className="pointer-events-none absolute left-1 top-1 bottom-1 w-[calc(50%-6px)] rounded-lg bg-green-primary shadow-[0_2px_10px_rgba(16,185,129,0.28)]"
                initial={false}
                animate={{ x: isSignUp ? 0 : "calc(100% + 8px)" }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
              <div className="relative grid grid-cols-2 gap-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignUp}
                  id="tab-signup"
                  onClick={() => switchMode(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-px rounded-[10px] py-2 px-1.5 sm:px-2 text-center transition-colors z-10",
                    isSignUp ? "text-black" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <span className="text-[11px] font-semibold tracking-tight sm:text-xs">New here</span>
                  <span className={cn("text-[10px] font-medium leading-tight", isSignUp ? "text-black/75" : "text-text-dim")}>
                    Create account
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignUp}
                  id="tab-signin"
                  onClick={() => switchMode(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-px rounded-[10px] py-2 px-1.5 sm:px-2 text-center transition-colors z-10",
                    !isSignUp ? "text-black" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <span className="text-[11px] font-semibold tracking-tight sm:text-xs">Sign in</span>
                  <span className={cn("text-[10px] font-medium leading-tight", !isSignUp ? "text-black/75" : "text-text-dim")}>
                    I have an account
                  </span>
                </button>
              </div>
            </div>

            <motion.div
              key={isSignUp ? "up" : "in"}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center mb-6"
            >
              <h1 className="text-lg font-semibold text-text-primary tracking-tight">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1.5 text-sm text-text-muted">
                {isSignUp ? "Join Persuaid in a few seconds." : "Enter your credentials to continue."}
              </p>
            </motion.div>

            <div className="mb-6 space-y-3">
              <motion.button
                type="button"
                disabled={loading || oauthProvider !== null}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                onClick={() => void handleOAuthSignIn("google")}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-colors",
                  "bg-white text-gray-900 border-gray-200/90 hover:bg-gray-50",
                  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                )}
              >
                <GoogleGIcon className="h-5 w-5 shrink-0" />
                {oauthProvider === "google" ? "Redirecting…" : "Continue with Google"}
              </motion.button>
              <motion.button
                type="button"
                disabled={loading || oauthProvider !== null}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                onClick={() => void handleOAuthSignIn("apple")}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-colors",
                  "bg-black text-white border-white/10 hover:bg-zinc-950",
                  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                )}
              >
                <AppleIcon className="h-5 w-5 shrink-0 text-white" />
                {oauthProvider === "apple" ? "Redirecting…" : "Continue with Apple"}
              </motion.button>
              <div className="relative flex items-center gap-3 pt-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-text-dim uppercase tracking-wide">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <div>
                  <label htmlFor="sign-in-email" className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    id="sign-in-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/50 transition-all duration-200"
                    disabled={loading || oauthProvider !== null}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sign-in-password" className="block text-sm font-medium text-text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-in-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 rounded-lg border border-border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/50 transition-all duration-200"
                      disabled={loading || oauthProvider !== null}
                      required
                      minLength={isSignUp ? 6 : undefined}
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

                <AnimatePresence initial={false}>
                  {isSignUp && (
                    <motion.div
                      key="confirm-password"
                      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <label htmlFor="sign-in-confirm" className="block text-sm font-medium text-text-secondary mb-2">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="sign-in-confirm"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn(
                            "w-full px-4 py-3 pr-11 rounded-lg border bg-background-surface-elevated text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 transition-all duration-200",
                            confirmPassword.length > 0 &&
                              password.length > 0 &&
                              confirmPassword !== password
                              ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                              : "border-border focus:border-green-primary/50"
                          )}
                          disabled={loading || oauthProvider !== null}
                          required={isSignUp}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-dim hover:text-text-primary hover:bg-background-surface/50 transition-colors"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? (
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
                      {confirmPassword.length > 0 && password.length > 0 && confirmPassword !== password && (
                        <p className="mt-2 text-xs text-amber-400/95">Passwords must match.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                disabled={loading || oauthProvider !== null}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                className="w-full py-3 rounded-button bg-green-primary text-white font-semibold hover:bg-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-button hover:shadow-button-hover hover:shadow-glow-button relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-green-accent/0 via-green-accent/20 to-green-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative z-10">
                  {loading ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
                </span>
              </motion.button>
            </form>

            {oauthBrowserHint && (
              <p className="mt-4 text-sm text-text-muted text-center max-w-sm mx-auto">
                Sign-in opened in your default browser. When you finish, we’ll continue here automatically.
              </p>
            )}
            {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </motion.div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-near-black flex items-center justify-center px-6">
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
