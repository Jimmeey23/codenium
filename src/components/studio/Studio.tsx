"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QrPreviewCard } from "@/components/QrRender";
import { defaultContent, payloadWarning } from "@/lib/qr-content";
import { copyPngToClipboard, exportQr } from "@/lib/qr-export";
import { codeStatus, TONE_CLASSES } from "@/lib/status";
import type { ContentType, DesignConfig, ExportFormat, QrCodeDTO } from "@/lib/types";
import { Button, Pill, cx } from "../ui";
import { ContentPanel } from "./ContentPanel";
import { DesignPanel } from "./DesignPanel";
import { ExportPanel } from "./ExportPanel";
import { RulesPanel } from "./RulesPanel";
import {
  encodedData,
  fromDTO,
  initialState,
  payloadOf,
  toPayloadBody,
  type StudioState,
} from "./state";

const TABS = [
  { id: "content", label: "Content", icon: "✎" },
  { id: "design", label: "Design", icon: "◐" },
  { id: "rules", label: "Rules", icon: "⚙" },
  { id: "export", label: "Export", icon: "⬇" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Studio({ initialCode }: { initialCode: QrCodeDTO | null }) {
  const [state, setState] = useState<StudioState>(() =>
    initialCode ? fromDTO(initialCode) : initialState(),
  );
  const [tab, setTab] = useState<TabId>("content");
  const [origin, setOrigin] = useState("");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(2);
  const [filename, setFilename] = useState("codenium-qr");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const patch = (p: Partial<StudioState>) => setState((s) => ({ ...s, ...p }));
  const patchDesign = (p: Partial<DesignConfig>) =>
    setState((s) => ({ ...s, design: { ...s.design, ...p } }));

  const setType = (t: ContentType) =>
    setState((s) => ({ ...s, contentType: t, content: defaultContent(t) }));

  const payload = payloadOf(state);
  const data = encodedData(state, origin || "https://codenium.qr");
  const warning = useMemo(() => payloadWarning(payload, state.design.ecc), [payload, state.design.ecc]);
  const status = codeStatus({
    active: state.active,
    expiresAt: state.expiresAt,
    activeFrom: state.activeFrom,
    maxScans: state.maxScans,
    scanCount: state.scanCount,
  });
  const shortUrl = state.slug && origin ? `${origin}/r/${state.slug}` : null;

  async function save(silent = false): Promise<StudioState | null> {
    setBusy("save");
    try {
      const body = toPayloadBody(state, state.password.length > 0 || !state.hasPassword);
      const res = await fetch(state.id ? `/api/codes/${state.id}` : "/api/codes", {
        method: state.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = (await res.json()) as { code: QrCodeDTO };
      const next: StudioState = {
        ...state,
        id: json.code.id,
        slug: json.code.slug,
        hasPassword: json.code.hasPassword,
        password: "",
        scanCount: json.code.scanCount,
      };
      setState(next);
      if (!silent)
        setToast({ tone: "ok", msg: state.id ? "Changes published ✓" : "Code published — short link is live ✓" });
      return next;
    } catch {
      setToast({ tone: "err", msg: "Could not save. Is the database reachable?" });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function runExport(fmt: ExportFormat = format) {
    setBusy("export");
    try {
      let s = state;
      if (s.dynamic && !s.slug) {
        const saved = await save(true);
        if (saved) s = saved;
      }
      setBusy("export");
      await exportQr({
        design: s.design,
        data: encodedData(s, origin || window.location.origin),
        format: fmt,
        scale,
        filename: filename || "codenium-qr",
      });
      setToast({ tone: "ok", msg: `${fmt.toUpperCase()} downloaded ✓` });
    } catch (e) {
      setToast({ tone: "err", msg: e instanceof Error ? e.message : "Export failed" });
    } finally {
      setBusy(null);
    }
  }

  async function exportAll() {
    setBusy("all");
    try {
      let s = state;
      if (s.dynamic && !s.slug) {
        const saved = await save(true);
        if (saved) s = saved;
      }
      const target = encodedData(s, origin || window.location.origin);
      for (const fmt of ["png", "svg", "pdf", "jpeg", "webp"] as ExportFormat[]) {
        await exportQr({ design: s.design, data: target, format: fmt, scale, filename: filename || "codenium-qr" });
        await new Promise((r) => setTimeout(r, 350));
      }
      setToast({ tone: "ok", msg: "All five formats downloaded ✓" });
    } catch {
      setToast({ tone: "err", msg: "Bulk export failed" });
    } finally {
      setBusy(null);
    }
  }

  async function copyImage() {
    setBusy("copy");
    try {
      await copyPngToClipboard(state.design, data, 1);
      setToast({ tone: "ok", msg: "PNG copied to clipboard ✓" });
    } catch {
      setToast({ tone: "err", msg: "Clipboard blocked by your browser" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
      {/* Stage */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="glass-strong rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Pill className={cx("ring-1", TONE_CLASSES[status.tone])}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {status.label}
              </Pill>
              <Pill>{state.dynamic ? "Dynamic" : "Static"}</Pill>
              <Pill>{state.design.engine === "iso3d" ? "3D" : "Vector"}</Pill>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() =>
                  patchDesign({ engine: state.design.engine === "flat" ? "iso3d" : "flat" })
                }
              >
                {state.design.engine === "flat" ? "🧊 3D view" : "▦ Flat view"}
              </Button>
              <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={copyImage}>
                {busy === "copy" ? "…" : "Copy"}
              </Button>
            </div>
          </div>

          <QrPreviewCard design={state.design} data={data} pixelSize={640} />

          <div className="mt-6 space-y-3">
            {warning ? (
              <p className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90 ring-1 ring-amber-400/20">
                ⚠ {warning}
              </p>
            ) : (
              <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200/90 ring-1 ring-emerald-400/20">
                ✓ Looks great — high contrast, logo-safe, {state.design.ecc}-level redundancy.
              </p>
            )}

            <div className="rounded-xl border border-white/8 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Encoded value</p>
              <p className="mt-1 line-clamp-2 break-all font-mono text-[11px] leading-relaxed text-white/60">
                {data || "—"}
              </p>
              {state.dynamic && !state.slug ? (
                <p className="mt-2 text-[11px] text-cyan-300/80">
                  Publish to mint your permanent short link before printing.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" className="flex-1" onClick={() => save()} disabled={Boolean(busy)}>
                {busy === "save" ? "Publishing…" : state.id ? "Publish changes" : "Publish code"}
              </Button>
              <Button className="flex-1" onClick={() => runExport()} disabled={Boolean(busy)}>
                {busy === "export" ? "Rendering…" : `Download ${format.toUpperCase()}`}
              </Button>
              {shortUrl ? (
                <Link
                  href={`/dashboard/${state.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.09]"
                >
                  Analytics
                </Link>
              ) : null}
            </div>

            {shortUrl ? (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(shortUrl);
                  setToast({ tone: "ok", msg: "Short link copied ✓" });
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2.5 text-left transition hover:bg-cyan-400/10"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
                    Live short link
                  </span>
                  <span className="block truncate font-mono text-xs text-cyan-200">{shortUrl}</span>
                </span>
                <span className="shrink-0 text-xs text-cyan-300/70">copy</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="min-w-0">
        <div className="glass-strong rounded-3xl p-2">
          <div className="grid grid-cols-4 gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cx(
                  "rounded-2xl px-3 py-2.5 text-xs font-semibold transition",
                  tab === t.id
                    ? "bg-gradient-to-br from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-900/40"
                    : "text-white/50 hover:bg-white/5 hover:text-white/85",
                )}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 animate-fade-up">
          {tab === "content" ? (
            <ContentPanel state={state} patch={patch} setType={setType} />
          ) : null}
          {tab === "design" ? <DesignPanel design={state.design} patch={patchDesign} /> : null}
          {tab === "rules" ? <RulesPanel state={state} patch={patch} /> : null}
          {tab === "export" ? (
            <ExportPanel
              design={state.design}
              format={format}
              setFormat={setFormat}
              scale={scale}
              setScale={setScale}
              filename={filename}
              setFilename={setFilename}
              onExport={() => runExport()}
              onCopy={copyImage}
              onExportAll={exportAll}
              busy={busy}
              dataLength={data.length}
              shortUrl={shortUrl}
            />
          ) : null}
        </div>
      </div>

      {toast ? (
        <div
          className={cx(
            "animate-fade-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium shadow-2xl ring-1 backdrop-blur-xl",
            toast.tone === "ok"
              ? "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30"
              : "bg-rose-500/15 text-rose-100 ring-rose-400/30",
          )}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
