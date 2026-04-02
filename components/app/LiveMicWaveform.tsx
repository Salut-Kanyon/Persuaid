"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/app/contexts/SessionContext";
import { cn } from "@/lib/utils";

const BAR_COUNT = 7;

/**
 * Live mic level indicator for the call HUD — reads `inputAudioLevelRef` (AnalyserNode) on rAF.
 */
export function LiveMicWaveform({ className }: { className?: string }) {
  const { inputAudioLevelRef } = useSession();
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.18));

  useEffect(() => {
    let id = 0;
    const tick = () => {
      const raw = inputAudioLevelRef.current;
      const t = performance.now() * 0.0045;
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const phase = t + i * 0.88;
        const wobble = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(phase));
        if (raw < 0.035) {
          return 0.1 + 0.11 * (0.5 + 0.5 * Math.sin(phase * 1.25));
        }
        return Math.max(0.12, Math.min(1, raw * 2.35 * wobble));
      });
      setHeights(next);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [inputAudioLevelRef]);

  return (
    <div
      className={cn("flex h-7 shrink-0 items-end justify-center gap-[3px]", className)}
      role="img"
      aria-label="Microphone level"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-green-primary/90 shadow-[0_0_10px_rgba(34,197,94,0.35)]"
          style={{ height: `${Math.max(3, Math.round(h * 22))}px` }}
        />
      ))}
    </div>
  );
}
