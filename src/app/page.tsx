import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { Studio } from "@/components/studio/Studio";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { toDTO } from "@/lib/server/codes";
import type { QrCodeDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "🧊", title: "True 3D engine", body: "Isometric extrusion with real geometry, lighting and shadows — not a filter." },
  { icon: "🎨", title: "Pixel-level styling", body: "Dot shapes, eye styles, gradients, frames and your logo locked in the centre." },
  { icon: "♾️", title: "No expiry by default", body: "Codes live forever unless you set a window, a scan cap or a password." },
  { icon: "🧭", title: "Smart landings", body: "Device routing, hosted link pages, countdowns and fallbacks per scan." },
  { icon: "📦", title: "Five export formats", body: "PNG, SVG, PDF, JPG and WEBP up to 4× resolution — one click each." },
  { icon: "📈", title: "Live analytics", body: "Every scan logged with device, OS and browser breakdowns." },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let initialCode: QrCodeDTO | null = null;
  if (id) {
    try {
      const [row] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
      if (row) initialCode = toDTO(row);
    } catch {
      initialCode = null;
    }
  }

  return (
    <>
      <SiteHeader active="studio" />
      <main className="relative overflow-hidden">
        <div className="grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

        <section className="relative mx-auto max-w-[1600px] px-4 pb-6 pt-12 sm:px-8 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(0,229,255,0.8)]" />
              Studio · 3D engine · dynamic links
            </span>
            <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              <span className="text-gradient">QR codes that look</span>
              <br />
              <span className="text-gradient">like brand assets</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/55 sm:text-lg">
              Craft beautiful, scannable codes with a logo baked into the centre, extrude them into
              real 3D, attach advanced landing logic and export anywhere — with{" "}
              <span className="font-semibold text-white/80">no expiry by default</span>.
            </p>
          </div>
        </section>

        <section id="studio" className="relative mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-8">
          <Studio initialCode={initialCode} />
        </section>

        <section className="relative mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/20"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl ring-1 ring-white/10 transition group-hover:scale-110">
                  {f.icon}
                </span>
                <h3 className="mt-3.5 text-sm font-bold text-white/90">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/45">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="relative border-t border-white/5 py-10 text-center text-xs text-white/30">
          Codenium Studio · designed for print, web and everything in between.
          <span className="mt-1.5 block text-[11px] tracking-[0.18em] text-white/20">
            By Jimmeey Gondaa
          </span>
        </footer>
      </main>
    </>
  );
}
