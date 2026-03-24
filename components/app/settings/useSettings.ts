"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppSettings } from "@/lib/settings";
import { applyMotionQuality, loadSettings, saveSettings } from "@/lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    applyMotionQuality(settings.animationQuality);
    saveSettings(settings);
  }, [settings]);

  const api = useMemo(
    () => ({
      settings,
      setSettings,
      update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
      },
    }),
    [settings]
  );

  return api;
}

