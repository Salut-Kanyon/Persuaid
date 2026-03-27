"use client";

import { useState } from "react";
import { LiveSession } from "@/components/app/LiveSession";

const DEFAULT_PANEL_VISIBILITY = { followUp: true, transcript: false, notes: true };

export default function DashboardPage() {
  const [panelVisibility, setPanelVisibility] = useState(DEFAULT_PANEL_VISIBILITY);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden overscroll-none">
      <div className="min-h-0 flex-1 overflow-hidden">
        <LiveSession panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
      </div>
    </div>
  );
}
