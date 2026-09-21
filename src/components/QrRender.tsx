"use client";

import { useEffect, useRef, useState } from "react";
import { flatSvg, paintIso } from "@/lib/qr-export";
import type { DesignConfig } from "@/lib/types";
import { cx } from "./ui";

type Props = {
  design: DesignConfig;
  data: string;
  pixelSize?: number;
  className?: string;
};

/** Renders the QR with the flat (vector) engine or the isometric 3D engine. */
export function QrRender({ design, data, pixelSize = 520, className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          if (design.engine === "iso3d") {
            if (!canvasRef.current) return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            await paintIso(canvasRef.current, design, data, Math.round(pixelSize * dpr));
            if (!cancelled) setError(null);
            return;
          }
          const host = hostRef.current;
          if (!host) return;
          const svg = await flatSvg(design, data, pixelSize);
          if (cancelled) return;
          host.innerHTML = svg;
          setError(null);
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Render failed");
        }
      })();
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [design, data, pixelSize]);

  return (
    <div className={cx("relative aspect-square w-full", className)}>
      {design.engine === "iso3d" ? (
        <canvas ref={canvasRef} className="h-full w-full rounded-[inherit]" />
      ) : (
        <div
          ref={hostRef}
          className="h-full w-full overflow-hidden rounded-[inherit] [&>svg]:h-full [&>svg]:w-full"
        />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-rose-950/80 p-4 text-center text-xs text-rose-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/** Frame + interactive tilt wrapper used in the studio stage. */
export function QrPreviewCard({
  design,
  data,
  pixelSize = 560,
  interactive = true,
}: Props & { interactive?: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!interactive || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 16, y: px * 18 });
  };

  const frame = design.frame;
  const caption = (frame.text || "SCAN ME").toUpperCase();
  const captionOnTop = frame.style === "badge";
  const radius = frame.style === "ribbon" ? "1rem" : "1.75rem";

  const qr = (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: frame.enabled ? (frame.style === "ribbon" ? "0.5rem" : "1.1rem") : radius,
        background: design.bgTransparent ? "transparent" : undefined,
      }}
    >
      <QrRender design={design} data={data} pixelSize={pixelSize} />
    </div>
  );

  return (
    <div className="stage w-full">
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="tilt-card shine relative mx-auto w-full max-w-[420px]"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
          borderRadius: radius,
        }}
      >
        <div
          className="absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${
              design.engine === "iso3d" ? design.iso.topFrom : design.dotGradient.from
            }66, transparent 70%)`,
          }}
        />
        <div
          className={cx(
            "relative overflow-hidden transition-shadow",
            design.bgTransparent && !frame.enabled
              ? "bg-[repeating-conic-gradient(#ffffff12_0%_25%,transparent_0%_50%)] bg-[length:22px_22px]"
              : "",
          )}
          style={{
            borderRadius: radius,
            padding: frame.enabled ? "7%" : 0,
            background: frame.enabled ? frame.bg : undefined,
            boxShadow:
              "0 40px 80px -30px rgba(8,4,25,0.95), 0 0 0 1px rgba(255,255,255,0.07) inset",
          }}
        >
          {frame.enabled && captionOnTop ? (
            <p
              className="pb-3 text-center text-[13px] font-extrabold tracking-[0.25em]"
              style={{ color: frame.textColor }}
            >
              {caption}
            </p>
          ) : null}
          {qr}
          {frame.enabled && !captionOnTop ? (
            <p
              className="pt-3 text-center text-[13px] font-extrabold tracking-[0.25em]"
              style={{ color: frame.textColor }}
            >
              {caption}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
