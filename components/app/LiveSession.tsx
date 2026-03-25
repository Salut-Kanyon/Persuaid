"use client";

import { Workspace } from "./Workspace";
import type { PanelId } from "./Workspace";

interface LiveSessionProps {
  panelVisibility: Record<PanelId, boolean>;
  setPanelVisibility: React.Dispatch<React.SetStateAction<Record<PanelId, boolean>>>;
}

export function LiveSession({ panelVisibility, setPanelVisibility }: LiveSessionProps) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden overscroll-none bg-background-near-black">
      <Workspace panelVisibility={panelVisibility} setPanelVisibility={setPanelVisibility} />
    </div>
  );
}
