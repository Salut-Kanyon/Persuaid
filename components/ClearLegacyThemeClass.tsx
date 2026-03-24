"use client";

import { useEffect } from "react";

/** Removes legacy in-app light theme class so the app uses default dark tokens. */
export function ClearLegacyThemeClass() {
  useEffect(() => {
    document.documentElement.classList.remove("theme-light");
  }, []);
  return null;
}
