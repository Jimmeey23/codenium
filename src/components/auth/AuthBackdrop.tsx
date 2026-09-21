"use client";

import { useMemo } from "react";

/** Animated aurora field + a QR-like cell grid that breathes behind the auth card. */
export function AuthBackdrop() {
  // Deterministic pseudo-QR pattern: stable between server and client renders.
  const cells = useMemo(
    () =>
      Array.from({ length: 144 }, (_, i) => {
        const h = (i * 2654435761) % 1013;
        return { on: h % 7 > 2, delay: `${(h % 320) / 100}s` };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="auth-aurora h-[42rem] w-[42rem] -left-40 -top-56 bg-cyan-400/20"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="auth-aurora h-[36rem] w-[36rem] -right-32 top-10 bg-blue-600/20"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="auth-aurora h-[32rem] w-[32rem] left-1/3 -bottom-56 bg-pink-500/12"
        style={{ animationDelay: "-11s" }}
      />

      <div className="grid-overlay absolute inset-0 opacity-60" />

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <div className="relative h-[30rem] w-[30rem] animate-float opacity-[0.18]">
          <div className="grid h-full w-full grid-cols-12 gap-2">
            {cells.map((cell, i) => (
              <span
                key={i}
                className={cell.on ? "auth-cell" : "rounded bg-white/5"}
                style={cell.on ? { animationDelay: cell.delay } : undefined}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 h-px auth-scan bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_6px_rgba(0,229,255,0.45)]" />
        </div>
      </div>
    </div>
  );
}
