"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type PersuaidApi = {
  frameless?: boolean;
  windowAction?: (a: "minimize" | "close" | "toggle-maximize") => Promise<unknown>;
};

const dragStyle = { WebkitAppRegion: "drag" } as CSSProperties;
const noDragStyle = { WebkitAppRegion: "no-drag" } as CSSProperties;

/**
 * macOS frameless window: in-app traffic lights + top drag strip.
 * Hidden during an active call — the call pill provides the drag region instead.
 */
export function ElectronFramelessChrome() {
  const [show, setShow] = useState(false);
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const api = (window as Window & { persuaid?: PersuaidApi }).persuaid;
    if (api?.frameless) {
      setShow(true);
      document.documentElement.classList.add("electron-frameless");
    }
    return () => {
      document.documentElement.classList.remove("electron-frameless");
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const el = document.documentElement;
    const sync = () => setCallActive(el.dataset.callActive === "1");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-call-active"] });
    return () => mo.disconnect();
  }, [show]);

  if (!show || callActive) return null;

  const action = (a: "minimize" | "close" | "toggle-maximize") => {
    const api = (window as Window & { persuaid?: PersuaidApi }).persuaid;
    void api?.windowAction?.(a);
  };

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[99999] flex h-10 items-center border-b border-white/[0.06] bg-[#0a0a0a]/85 px-3 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-xl"
      style={dragStyle}
    >
      <div className="flex items-center gap-2" style={noDragStyle}>
        <button
          type="button"
          aria-label="Close window"
          onClick={() => action("close")}
          className="h-3 w-3 rounded-full bg-[#ff5f57] transition-opacity hover:opacity-90"
        />
        <button
          type="button"
          aria-label="Minimize"
          onClick={() => action("minimize")}
          className="h-3 w-3 rounded-full bg-[#febc2e] transition-opacity hover:opacity-90"
        />
        <button
          type="button"
          aria-label="Zoom"
          onClick={() => action("toggle-maximize")}
          className="h-3 w-3 rounded-full bg-[#28c840] transition-opacity hover:opacity-90"
        />
      </div>
    </div>
  );
}
