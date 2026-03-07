"use client";

import { useState } from "react";
import { LiveSession } from "@/components/app/LiveSession";
import { DEFAULT_PANEL_VISIBILITY } from "@/components/app/Workspace";

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
