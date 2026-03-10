"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SessionRecord } from "@/lib/analytics";
import { formatDuration } from "@/lib/analytics";

interface RecentCallsTableProps {
  sessions: SessionRecord[];
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const PREVIEW_MAX = 80;

export function RecentCallsTable({ sessions, className }: RecentCallsTableProps) {
  if (sessions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-background-surface/40 border border-border/50 border-dashed p-12 text-center",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-text-primary font-medium">No calls yet</p>
        <p className="text-sm text-text-muted mt-1">
          Start a live session to see your calls and coaching insights here.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-primary/20 text-green-accent border border-green-primary/30 text-sm font-medium hover:bg-green-primary/30 transition-colors"
        >
          Go to Live Session
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-background-surface/60 border border-border/50 overflow-hidden",
        className
      )}
    >
      <div className="px-6 py-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-text-primary">Recent calls</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-text-dim uppercase tracking-wider border-b border-border/50">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3 min-w-[140px]">Transcript preview</th>
              <th className="px-6 py-3 text-right">AI suggestions</th>
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const preview =
                session.transcript_preview?.trim().slice(0, PREVIEW_MAX) ||
                session.title?.trim().slice(0, PREVIEW_MAX) ||
                "—";
              const suggestions = session.suggestions_count ?? 0;
              return (
                <tr
                  key={session.id}
                  className="border-b border-border/30 hover:bg-background-surface/40 transition-colors"
                >
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    {formatDate(session.started_at)}
                    <span className="block text-xs text-text-dim">{formatTime(session.started_at)}</span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary tabular-nums">
                    {formatDuration(session.duration_minutes)}
                  </td>
                  <td className="px-6 py-4 text-text-muted max-w-[200px]">
                    <span className="line-clamp-2">{preview}</span>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-text-secondary">
                    {suggestions}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-primary/10 text-green-accent border border-green-primary/20 text-xs font-medium hover:bg-green-primary/20 transition-colors"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
