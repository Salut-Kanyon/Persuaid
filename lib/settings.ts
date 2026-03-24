export type AnimationQuality = "low" | "medium" | "high";
export type ExportFormat = "txt" | "md";

export interface AppSettings {
  notificationsEnabled: boolean;
  animationQuality: AnimationQuality;
  autoSaveEnabled: boolean;
  defaultExportFormat: ExportFormat;
  experimentalFeaturesEnabled: boolean;
}

const STORAGE_KEY = "persuaid_settings_v1";

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  animationQuality: "medium",
  autoSaveEnabled: true,
  defaultExportFormat: "txt",
  experimentalFeaturesEnabled: false,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { theme?: unknown };
    const { theme: _legacyTheme, ...rest } = parsed;
    return { ...DEFAULT_SETTINGS, ...rest };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function applyMotionQuality(q: AnimationQuality): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.motion = q;
}

export function getExperimentalEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const s = loadSettings();
    return !!s.experimentalFeaturesEnabled;
  } catch {
    return false;
  }
}

