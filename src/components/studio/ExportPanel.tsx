"use client";

import type { DesignConfig, ExportFormat } from "@/lib/types";
import { Button, Field, Panel, Slider, TextInput, cx } from "../ui";

const FORMATS: { id: ExportFormat; label: string; note: string; icon: string }[] = [
  { id: "png", label: "PNG", note: "Transparent-ready raster", icon: "🖼️" },
  { id: "svg", label: "SVG", note: "Infinite vector scale", icon: "🧬" },
  { id: "pdf", label: "PDF", note: "Print-ready document", icon: "📄" },
  { id: "jpeg", label: "JPG", note: "Smallest file size", icon: "📷" },
  { id: "webp", label: "WEBP", note: "Modern web format", icon: "🌐" },
];

export function ExportPanel({
  design,
  format,
  setFormat,
  scale,
  setScale,
  filename,
  setFilename,
  onExport,
  onCopy,
  onExportAll,
  busy,
  dataLength,
  shortUrl,
}: {
  design: DesignConfig;
  format: ExportFormat;
  setFormat: (f: ExportFormat) => void;
  scale: number;
  setScale: (s: number) => void;
  filename: string;
  setFilename: (v: string) => void;
  onExport: () => void;
  onCopy: () => void;
  onExportAll: () => void;
  busy: string | null;
  dataLength: number;
  shortUrl: string | null;
}) {
  const px = Math.round(design.size * (format === "svg" ? 1 : scale));

  return (
    <div className="space-y-4">
      <Panel title="Format" subtitle="Every format keeps your centre logo and styling.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={cx(
                "rounded-xl border p-3 text-left transition",
                format === f.id
                  ? "border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-900/30"
                  : "border-white/8 bg-white/[0.03] hover:border-white/20",
              )}
            >
              <span className="text-base">{f.icon}</span>
              <span className="mt-1 block text-sm font-semibold text-white/90">{f.label}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-white/40">{f.note}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Resolution">
        {format !== "svg" ? (
          <Field label="Scale" hint={`${px} × ${px}px`}>
            <Slider value={scale} min={1} max={4} step={1} onChange={setScale} suffix="×" />
          </Field>
        ) : (
          <p className="text-xs text-white/45">
            SVG is resolution independent — it stays razor sharp at billboard size.
          </p>
        )}
        <Field label="File name">
          <TextInput value={filename} onChange={setFilename} placeholder="prism-qr" />
        </Field>
      </Panel>

      <Panel title="Download">
        <Button variant="primary" className="w-full py-3" onClick={onExport} disabled={Boolean(busy)}>
          {busy === "export" ? "Rendering…" : `⬇ Download ${format.toUpperCase()}`}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onCopy} disabled={Boolean(busy)}>
            {busy === "copy" ? "Copying…" : "Copy PNG"}
          </Button>
          <Button onClick={onExportAll} disabled={Boolean(busy)}>
            {busy === "all" ? "Packing…" : "Export all 5"}
          </Button>
        </div>
        {shortUrl ? (
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/40">Short link</p>
            <p className="mt-1 truncate font-mono text-xs text-cyan-300">{shortUrl}</p>
          </div>
        ) : null}
        <p className="text-[11px] leading-relaxed text-white/35">
          Payload: {dataLength} characters · engine {design.engine === "iso3d" ? "3D isometric" : "flat vector"} ·
          ECC {design.ecc}
        </p>
      </Panel>
    </div>
  );
}
