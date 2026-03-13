"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/app/contexts/SessionContext";
import type { User } from "@supabase/supabase-js";

const SIDEBAR_COLLAPSED_KEY = "persuaid_sidebar_collapsed";

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

const navigation = [
  {
    name: "Live Session",
    href: "/dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "AI Coach",
    href: "/dashboard/analyze",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v1.5M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
        <circle cx="9.5" cy="11" r="1.25" />
        <circle cx="14.5" cy="11" r="1.25" />
        <path d="M9.5 15.5q2.5 2 5 0" />
      </svg>
    ),
  },
  {
    name: "Scripts",
    href: "/dashboard/scripts",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Notes",
    href: "/dashboard/notes",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function getEmailInitial(email: string | undefined): string {
  if (!email) return "?";
  const first = email.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isRecording } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsedState] = useState(false);
  /** When a call starts we collapse the sidebar; when it ends we restore this. */
  const openBeforeCallRef = useRef<boolean | null>(null);

  useEffect(() => {
    setCollapsedState(getStoredCollapsed());
  }, []);

  useEffect(() => {
    if (isRecording) {
      if (openBeforeCallRef.current === null) {
        openBeforeCallRef.current = !collapsed;
        setCollapsedState(true);
        try {
          if (typeof window !== "undefined") localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");
        } catch {
          // ignore
        }
      }
    } else {
      if (openBeforeCallRef.current !== null) {
        const wasOpen = openBeforeCallRef.current;
        openBeforeCallRef.current = null;
        setCollapsedState(!wasOpen);
        try {
          if (typeof window !== "undefined") {
            if (wasOpen) localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
            else localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isRecording, collapsed]);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    try {
      if (typeof window !== "undefined") {
        if (value) localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");
        else localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    router.replace("/welcome");
  };

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? "Signed in";
  const email = user?.email ?? "";
  const initial = getEmailInitial(email);

  return (
    <aside
      className={cn(
        "bg-background-elevated/35 backdrop-blur-2xl border-r border-border/8 flex flex-col transition-[width] duration-200 ease-out overflow-hidden",
        collapsed ? "w-[3.5rem]" : "w-52"
      )}
    >
      {/* Logo + collapse arrow: when collapsed, stack so logo has full width and can be larger */}
      <div
        className={cn(
          "shrink-0 pt-4 pb-2",
          collapsed ? "flex flex-col items-center gap-1 px-1" : "flex items-center gap-0 px-2"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-end gap-0 group min-w-0 transition-all duration-200",
            collapsed ? "flex-none justify-center" : "flex-1"
          )}
        >
          <img
            src="/PersuaidLogo.png"
            alt="Persuaid"
            className={cn(
              "flex-shrink-0 object-contain translate-y-1 group-hover:opacity-90 transition-all duration-200",
              "w-8 h-8"
            )}
          />
          {!collapsed && (
            <span className="text-lg font-semibold text-text-primary tracking-tight -ml-1 translate-y-3 group-hover:text-green-accent transition-colors">
              ersuaid
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg text-text-dim hover:text-text-primary hover:bg-background-surface/30 transition-all",
            collapsed && "mt-0.5"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      {/* Navigation */}
      <nav className={cn("flex-1 px-2.5 py-4 space-y-1", collapsed && "px-2")}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative",
                collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
                isActive
                  ? "bg-green-primary/8 text-text-primary shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
                  : "text-text-primary hover:bg-background-surface/25"
              )}
            >
              <span className={cn(
                "transition-colors w-4 h-4 flex-shrink-0",
                isActive ? "text-green-primary/90" : "text-text-dim/60 group-hover:text-text-muted"
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-primary/80 shadow-[0_0_6px_rgba(16,185,129,0.4)] flex-shrink-0" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={cn("p-2.5 border-t border-border/6 relative shrink-0", collapsed && "p-2")} ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          title={collapsed ? displayName : undefined}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl hover:bg-background-surface/25 transition-all duration-300 cursor-pointer group text-left",
            collapsed ? "justify-center px-0 py-2" : "px-2.5 py-2"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-green-primary/20 border border-green-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-green-primary text-sm font-semibold">{initial}</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary truncate">{displayName}</div>
                <div className="text-[10px] text-text-dim/60 truncate">{email || "Signed in"}</div>
              </div>
              <svg className={cn("w-4 h-4 text-text-dim/50 flex-shrink-0 transition-transform", profileOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {profileOpen && (
          <div
            className={cn(
              "absolute bottom-full mb-1 py-1 rounded-xl bg-background-elevated border border-border shadow-lg z-50 min-w-[11rem]",
              collapsed ? "left-full top-1/2 -translate-y-1/2 bottom-auto ml-1" : "left-2.5 right-2.5"
            )}
          >
            <Link
              href="/dashboard/settings"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-primary hover:bg-background-surface/50 transition-colors"
            >
              <svg className="w-4 h-4 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-xl"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
