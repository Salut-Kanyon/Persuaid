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
    name: "Notes",
    href: "/dashboard/notes",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        "flex flex-col overflow-hidden bg-white/[0.03] backdrop-blur-3xl backdrop-saturate-150 transition-[width] duration-300 ease-out",
        collapsed ? "w-[3.5rem]" : "w-52"
      )}
    >
      {/* Logo + collapse arrow: when collapsed, stack so logo has full width and can be larger */}
      <div
        className={cn(
          "shrink-0 pb-2 pt-3",
          collapsed ? "flex flex-col items-center gap-1 px-1" : "flex items-center gap-0 px-2"
        )}
      >
        <Link
          href="/"
          className={cn(
            "group flex min-w-0 items-end gap-0 transition-colors duration-300 ease-out",
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
            <span className="-ml-1 translate-y-3 text-lg font-medium tracking-tight text-text-primary transition-colors duration-300 ease-out group-hover:text-text-secondary">
              ersuaid
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex-shrink-0 rounded-lg p-1.5 text-text-dim transition-colors duration-300 ease-out hover:bg-white/[0.06] hover:text-text-primary",
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
      <nav className={cn("flex-1 space-y-0.5 px-2.5 py-3", collapsed && "px-2")}>
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/dashboard/"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-300 ease-out",
                collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5",
                isActive
                  ? "bg-white/[0.06] font-medium text-text-primary"
                  : "font-normal text-text-primary/90 hover:bg-white/[0.04]"
              )}
            >
              <span className={cn(
                "transition-colors w-4 h-4 flex-shrink-0",
                isActive ? "text-text-primary" : "text-text-dim/60 group-hover:text-text-muted"
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && (
                    <div className="h-1 w-1 flex-shrink-0 rounded-full bg-white/45" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={cn("relative shrink-0 p-2.5 pt-3", collapsed && "p-2 pt-2.5")} ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          title={collapsed ? displayName : undefined}
          className={cn(
            "group flex w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors duration-300 ease-out hover:bg-white/[0.04]",
            collapsed ? "justify-center px-0 py-1.5" : "px-2 py-1.5"
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <span className="text-sm font-medium text-text-primary">{initial}</span>
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-text-primary">{displayName}</div>
                <div className="truncate text-[10px] font-normal tracking-label text-text-dim/55">
                  {email || "Signed in"}
                </div>
              </div>
              <svg className={cn("w-4 h-4 flex-shrink-0 text-text-dim/45 transition-transform duration-300 ease-out", profileOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {profileOpen && (
          <div
            className={cn(
              "absolute bottom-full z-50 mb-1 min-w-[11rem] rounded-xl border border-white/[0.08] bg-background-elevated/92 py-1 backdrop-blur-2xl",
              collapsed ? "bottom-auto left-full top-1/2 ml-1 -translate-y-1/2" : "left-2.5 right-2.5"
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
              className="flex w-full items-center gap-2 rounded-b-xl px-3 py-2 text-sm font-normal text-red-400/90 transition-colors duration-200 ease-out hover:bg-red-500/[0.08]"
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
