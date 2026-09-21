"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QrRender } from "@/components/QrRender";
import { Button, Pill, cx } from "@/components/ui";
import { codeStatus, TONE_CLASSES } from "@/lib/status";
import type { QrCodeDTO } from "@/lib/types";

function bodyFrom(code: QrCodeDTO, overrides: Partial<QrCodeDTO> = {}) {
  const merged = { ...code, ...overrides };
  return {
    name: merged.name,
    contentType: merged.contentType,
    content: merged.content,
    staticPayload: merged.staticPayload,
    dynamic: merged.dynamic,
    mode: merged.mode,
    targetUrl: merged.targetUrl,
    landing: merged.landing,
    routing: merged.routing,
    design: merged.design,
    expiresAt: merged.expiresAt,
    activeFrom: merged.activeFrom,
    maxScans: merged.maxScans,
    active: merged.active,
    expiredUrl: merged.expiredUrl,
  };
}

export function DashboardClient({ codes }: { codes: QrCodeDTO[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const filtered = codes.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.slug.includes(query.toLowerCase()) ||
      c.targetUrl.toLowerCase().includes(query.toLowerCase()),
  );

  const totals = {
    codes: codes.length,
    scans: codes.reduce((a, c) => a + c.scanCount, 0),
    live: codes.filter(
      (c) =>
        codeStatus({
          active: c.active,
          expiresAt: c.expiresAt,
          activeFrom: c.activeFrom,
          maxScans: c.maxScans,
          scanCount: c.scanCount,
        }).tone === "live",
    ).length,
    evergreen: codes.filter((c) => !c.expiresAt).length,
  };

  async function toggle(code: QrCodeDTO) {
    setPending(code.id);
    await fetch(`/api/codes/${code.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bodyFrom(code, { active: !code.active })),
    });
    setPending(null);
    router.refresh();
  }

  async function remove(code: QrCodeDTO) {
    if (!window.confirm(`Delete “${code.name}”? Printed codes will stop working.`)) return;
    setPending(code.id);
    await fetch(`/api/codes/${code.id}`, { method: "DELETE" });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Codes", value: totals.codes, icon: "🔳" },
          { label: "Total scans", value: totals.scans, icon: "📈" },
          { label: "Live now", value: totals.live, icon: "🟢" },
          { label: "No expiry", value: totals.evergreen, icon: "♾️" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              {s.icon} {s.label}
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug or destination…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
        />
        <Link href="/" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
          + New code
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-14 text-center">
          <p className="text-4xl">🛰️</p>
          <h3 className="mt-4 text-lg font-bold text-white">No codes yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
            Publish your first code in the studio and it will show up here with live scan
            analytics.
          </p>
          <Link
            href="/"
            className="btn-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open the studio
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((code) => {
            const status = codeStatus({
              active: code.active,
              expiresAt: code.expiresAt,
              activeFrom: code.activeFrom,
              maxScans: code.maxScans,
              scanCount: code.scanCount,
            });
            const shortUrl = `${origin}/r/${code.slug}`;
            return (
              <article
                key={code.id}
                className="glass group flex flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/20"
              >
                <div className="flex gap-4">
                  <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-white/5 p-1.5 ring-1 ring-white/10">
                    <QrRender design={code.design} data={shortUrl || code.staticPayload} pixelSize={220} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-white">{code.name}</h3>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-cyan-300/80">/r/{code.slug}</p>
                    <p className="mt-1 truncate text-[11px] text-white/40">{code.targetUrl || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill className={cx("ring-1", TONE_CLASSES[status.tone])}>{status.label}</Pill>
                      <Pill>{code.scanCount} scans</Pill>
                      {code.hasPassword ? <Pill>🔒</Pill> : null}
                      {code.mode !== "redirect" ? (
                        <Pill>{code.mode === "landing" ? "🪄 Landing" : "🧭 Routing"}</Pill>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-white/35">{status.detail}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                  <Button
                    variant="subtle"
                    className="px-2 py-1.5 text-[11px]"
                    onClick={() => navigator.clipboard.writeText(shortUrl)}
                  >
                    Copy link
                  </Button>
                  <Link
                    href={`/dashboard/${code.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white/[0.06] px-2 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.12]"
                  >
                    Analytics
                  </Link>
                  <Link
                    href={`/?id=${code.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white/[0.06] px-2 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.12]"
                  >
                    Edit design
                  </Link>
                  <Button
                    variant="subtle"
                    className="px-2 py-1.5 text-[11px]"
                    disabled={pending === code.id}
                    onClick={() => toggle(code)}
                  >
                    {code.active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="danger"
                    className="col-span-2 px-2 py-1.5 text-[11px]"
                    disabled={pending === code.id}
                    onClick={() => remove(code)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
