"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LiveSession = dynamic(
  () => import("@/components/app/LiveSession").then((m) => m.LiveSession),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-text-muted text-sm">Loading…</div> }
);

const DEFAULT_PANEL_VISIBILITY = { followUp: true, transcript: true, notes: true };

export default function DashboardPage() {
  const [panelVisibility, setPanelVisibility] = useState(DEFAULT_PANEL_VISIBILITY);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <LiveSession panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
      </div>
    </div>
  );
}
