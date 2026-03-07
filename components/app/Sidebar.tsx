"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-background-elevated/35 backdrop-blur-2xl border-r border-border/8 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border/6">
        <Link href="/" className="text-base font-semibold text-text-primary tracking-tight">
          <span className="text-green-primary/90">Persuaid</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 group relative",
                isActive
                  ? "bg-green-primary/8 text-green-accent/90 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
                  : "text-text-secondary/75 hover:text-text-primary hover:bg-background-surface/25"
              )}
            >
              <span className={cn(
                "transition-colors w-4 h-4 flex-shrink-0",
                isActive ? "text-green-primary/90" : "text-text-dim/60 group-hover:text-text-muted"
              )}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-primary/80 shadow-[0_0_6px_rgba(16,185,129,0.4)] flex-shrink-0"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2.5 border-t border-border/6">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-background-surface/25 transition-all duration-300 cursor-pointer group">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-green-primary/15 to-green-primary/5 border border-green-primary/15 flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-green-primary/90 text-[10px] font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">John Doe</div>
            <div className="text-[10px] text-text-dim/60 truncate">john@company.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
