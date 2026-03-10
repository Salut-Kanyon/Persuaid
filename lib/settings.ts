export type ThemePreference = "system" | "dark" | "light";
export type AnimationQuality = "low" | "medium" | "high";
export type ExportFormat = "txt" | "md";

export interface AppSettings {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  animationQuality: AnimationQuality;
  autoSaveEnabled: boolean;
  defaultExportFormat: ExportFormat;
  experimentalFeaturesEnabled: boolean;
}

const STORAGE_KEY = "persuaid_settings_v1";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
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
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
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

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  const useLight = theme === "light" || (theme === "system" && prefersLight);
  root.classList.toggle("theme-light", useLight);
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

