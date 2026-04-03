"use client";

export const MIC_ONBOARDING_STORAGE_KEY = "persuaid_mac_mic_onboarding_v1";

export type PersuaidMicApi = {
  platform?: string;
  getMicStatus?: () => Promise<{ status: string }>;
  requestMicAccess?: () => Promise<{ status: string; granted: boolean }>;
  openMicSettings?: () => Promise<{ ok: boolean }>;
};

export function getPersuaidMicApi(): PersuaidMicApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { persuaid?: PersuaidMicApi }).persuaid;
}

/**
 * Full mic permission path: on macOS Electron, `requestMicAccess` runs `askForMediaAccess` in main,
 * then `getUserMedia` runs the Chromium/media permission path (matches Start Call). Web/other: GUM only.
 */
export async function requestMicrophoneAccessFull(): Promise<{ ok: true } | { ok: false; message: string }> {
  const api = getPersuaidMicApi();
  if (api?.platform === "darwin" && typeof api.requestMicAccess === "function") {
    try {
      await api.requestMicAccess();
    } catch {
      /* still try getUserMedia */
    }
  }
  return warmMicrophoneStream();
}

/** After OS grants access, verify the browser can open a real mic (then stop tracks). */
export async function warmMicrophoneStream(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, message: "Microphone is not available in this environment." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return { ok: false, message: "Access was blocked. Turn on the microphone for Persuaid in System Settings, then restart the app." };
    }
    if (name === "NotFoundError") {
      return { ok: false, message: "No microphone was found. Connect a mic and try again." };
    }
    return { ok: false, message: e instanceof Error ? e.message : "Could not access the microphone." };
  }
}
