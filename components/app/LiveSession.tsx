"use client";

import { Workspace } from "./Workspace";
import type { PanelId } from "./Workspace";

interface LiveSessionProps {
  panelVisibility: Record<PanelId, boolean>;
  setPanelVisibility: React.Dispatch<React.SetStateAction<Record<PanelId, boolean>>>;
}

export function LiveSession({ panelVisibility, setPanelVisibility }: LiveSessionProps) {
  return (
    <div className="h-full w-full bg-background-near-black/40 backdrop-blur-md">
      <Workspace panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
    </div>
  );
}
