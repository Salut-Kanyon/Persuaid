"use client";

import { useState } from "react";
import { LiveSession } from "@/components/app/LiveSession";
import { WorkspacePanelsControl, DEFAULT_PANEL_VISIBILITY } from "@/components/app/Workspace";

export default function DashboardPage() {
  const [panelVisibility, setPanelVisibility] = useState(DEFAULT_PANEL_VISIBILITY);

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Home</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Your live session and AI copilot
          </p>
        </div>
        <WorkspacePanelsControl panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
      </header>
      <div className="flex-1 min-h-0">
        <LiveSession panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
      </div>
    </div>
  );
}
