import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrRender } from "@/components/QrRender";
import { SiteHeader } from "@/components/SiteHeader";
import { Pill } from "@/components/ui";
import { db } from "@/db";
import { qrCodes, qrScans } from "@/db/schema";
import { toDTO } from "@/lib/server/codes";
import { codeStatus, formatDate, TONE_CLASSES } from "@/lib/status";

export const dynamic = "force-dynamic";

function bucketBy<T extends string>(rows: { [k: string]: unknown }[], key: T) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const value = String(r[key] ?? "unknown");
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function CodeAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!row) notFound();

  const code = toDTO(row);
  const scans = await db
    .select()
    .from(qrScans)
    .where(eq(qrScans.codeId, id))
    .orderBy(desc(qrScans.scannedAt))
    .limit(500);

  const status = codeStatus({
    active: code.active,
    expiresAt: code.expiresAt,
    activeFrom: code.activeFrom,
    maxScans: code.maxScans,
    scanCount: code.scanCount,
  });

  const days: { label: string; key: string; count: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString(undefined, { day: "numeric" }), count: 0 });
  }
  for (const s of scans) {
    const key = new Date(s.scannedAt).toISOString().slice(0, 10);
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.count += 1;
  }
  const peak = Math.max(1, ...days.map((d) => d.count));

  const devices = bucketBy(scans, "device");
  const oses = bucketBy(scans, "os");
  const browsers = bucketBy(scans, "browser");
  const successful = scans.filter((s) => s.outcome === "ok").length;

  return (
    <>
      <SiteHeader active="dashboard" />
      <main className="relative mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <Link href="/dashboard" className="text-xs text-white/40 transition hover:text-white/70">
          ← Back to dashboard
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="glass-strong h-fit rounded-3xl p-5">
            <div className="overflow-hidden rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
              <QrRender design={code.design} data={`/r/${code.slug}`} pixelSize={420} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-white">{code.name}</h1>
            <p className="mt-1 font-mono text-xs text-cyan-300/80">/r/{code.slug}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill className={`ring-1 ${TONE_CLASSES[status.tone]}`}>{status.label}</Pill>
              <Pill>{code.dynamic ? "Dynamic" : "Static"}</Pill>
              <Pill>{code.design.engine === "iso3d" ? "3D" : "Vector"}</Pill>
              {code.hasPassword ? <Pill>🔒 Protected</Pill> : null}
            </div>

            <dl className="mt-5 space-y-2.5 text-xs">
              {[
                ["Destination", code.targetUrl || "—"],
                ["Mode", code.mode],
                ["Expiry", code.expiresAt ? formatDate(new Date(code.expiresAt)) : "Never ♾️"],
                ["Go live", code.activeFrom ? formatDate(new Date(code.activeFrom)) : "Immediately"],
                ["Scan limit", code.maxScans ? `${code.scanCount}/${code.maxScans}` : "Unlimited"],
                ["Created", formatDate(new Date(code.createdAt))],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="shrink-0 text-white/35">{k}</dt>
                  <dd className="truncate text-right text-white/75">{v}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/?id=${code.id}`}
              className="btn-primary mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Edit in studio
            </Link>
            <Link
              href={`/r/${code.slug}`}
              target="_blank"
              className="mt-2 block rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-center text-sm font-semibold text-white/80 transition hover:bg-white/[0.09]"
            >
              Test the scan ↗
            </Link>
          </aside>

          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total scans", value: code.scanCount },
                { label: "Logged events", value: scans.length },
                { label: "Successful", value: successful },
                { label: "Last 14 days", value: days.reduce((a, d) => a + d.count, 0) },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{s.label}</p>
                  <p className="mt-1.5 text-2xl font-black tabular-nums text-white">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white/90">Scans · last 14 days</h2>
              <div className="mt-5 flex h-40 items-end gap-1.5">
                {days.map((d) => (
                  <div key={d.key} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-700/60 to-cyan-400/90 transition-all group-hover:from-blue-600 group-hover:to-cyan-300"
                        style={{ height: `${Math.max(3, (d.count / peak) * 100)}%` }}
                      />
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/60 opacity-0 transition group-hover:opacity-100">
                        {d.count}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/30">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Devices", data: devices },
                { title: "Operating systems", data: oses },
                { title: "Browsers", data: browsers },
              ].map((group) => (
                <div key={group.title} className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white/90">{group.title}</h3>
                  <div className="mt-3 space-y-2.5">
                    {group.data.length === 0 ? (
                      <p className="text-xs text-white/30">No data yet</p>
                    ) : (
                      group.data.slice(0, 5).map(([label, count]) => (
                        <div key={label}>
                          <div className="flex justify-between text-[11px] text-white/60">
                            <span className="capitalize">{label}</span>
                            <span className="tabular-nums">{count}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                              style={{ width: `${(count / Math.max(1, scans.length)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white/90">Recent activity</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/35">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Device</th>
                      <th className="px-3 py-2">OS</th>
                      <th className="px-3 py-2">Browser</th>
                      <th className="px-3 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.slice(0, 12).map((s) => (
                      <tr key={s.id} className="border-t border-white/5 text-white/60">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(new Date(s.scannedAt))}</td>
                        <td className="px-3 py-2 capitalize">{s.device}</td>
                        <td className="px-3 py-2">{s.os}</td>
                        <td className="px-3 py-2">{s.browser}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.outcome === "ok"
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-amber-400/15 text-amber-300"
                            }`}
                          >
                            {s.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-white/30">
                          No scans recorded yet — share your code to see live data.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
