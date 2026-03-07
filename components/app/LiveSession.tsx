"use client";

import { Workspace } from "./Workspace";

export function LiveSession() {
  return (
    <div className="h-full w-full bg-background-near-black/40 backdrop-blur-md">
      <Workspace />
    </div>
  );
}
