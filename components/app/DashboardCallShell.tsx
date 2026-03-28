"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/app/contexts/SessionContext";
import { Sidebar } from "@/components/app/Sidebar";
import { Header } from "@/components/app/Header";
import { CallSessionOverlay } from "@/components/app/CallSessionOverlay";
import { PostCallSaveModal } from "@/components/app/PostCallSaveModal";
import { MicMacOnboardingGate } from "@/components/app/MicMacOnboardingGate";

export function DashboardCallShell({ children }: { children: React.ReactNode }) {
  const { isRecording } = useSession();

  useEffect(() => {
    document.documentElement.dataset.callActive = isRecording ? "1" : "0";
    return () => {
      document.documentElement.dataset.callActive = "0";
    };
  }, [isRecording]);

  useEffect(() => {
    document.documentElement.dataset.dashboardShell = "1";
    return () => {
      delete document.documentElement.dataset.dashboardShell;
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = "transparent";
    body.style.backgroundColor = "transparent";
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, [isRecording]);

  useEffect(() => {
    const api = (
      typeof window !== "undefined"
        ? (window as Window & {
            persuaid?: {
              frameless?: boolean;
              setCallHudMode?: (v: boolean) => Promise<unknown>;
              setVibrancyEnabled?: (v: boolean) => Promise<unknown>;
            };
          }).persuaid
        : undefined
    );
    if (!api?.setCallHudMode) return;
    void api.setCallHudMode(isRecording);
    return () => {
      void api.setCallHudMode?.(false);
    };
  }, [isRecording]);

  useEffect(() => {
    const api = (
      typeof window !== "undefined"
        ? (window as Window & { persuaid?: { frameless?: boolean; setVibrancyEnabled?: (v: boolean) => Promise<unknown> } })
            .persuaid
        : undefined
    );
    if (!api?.frameless || !api.setVibrancyEnabled) return;
    void api.setVibrancyEnabled(isRecording);
    return () => {
      void api.setVibrancyEnabled?.(false);
    };
  }, [isRecording]);

  return (
    <>
      <MicMacOnboardingGate />
    <div
      className={cn(
        "relative flex h-screen w-full overflow-hidden shadow-none",
        /* Column when recording so the fixed HUD isn’t a stretched row flex item (was adding phantom height). */
        isRecording ? "flex-col bg-transparent" : "bg-background-near-black"
      )}
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 transition-opacity duration-200 ease-out",
          /* display:none so the dashboard subtree is not painted (opacity-0 still composites on some GPUs). */
          isRecording && "pointer-events-none hidden"
        )}
        aria-hidden={isRecording}
      >
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-none">
          <Header />
          <main className="relative z-10 min-h-0 flex-1 overflow-hidden overscroll-none">{children}</main>
        </div>
      </div>

      {isRecording && <CallSessionOverlay />}
      {/* Must stay mounted so it can detect recording true→false transition. */}
      <PostCallSaveModal />
    </div>
    </>
  );
}
