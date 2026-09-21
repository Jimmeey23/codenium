import { eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { qrCodes, qrScans } from "@/db/schema";
import { detectClient, ensureAbsolute, resolveTarget } from "@/lib/server/codes";
import { codeStatus } from "@/lib/status";
import { DEFAULT_LANDING } from "@/lib/types";
import { Landing, StatusScreen, UnlockScreen } from "./parts";

export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [row] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug)).limit(1);

  if (!row) {
    return (
      <StatusScreen
        icon="🛰️"
        title="Code not found"
        subtitle="This short link doesn't exist (or was deleted)."
      />
    );
  }

  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const referrer = h.get("referer");
  const client = detectClient(ua);
  const status = codeStatus({
    active: row.active,
    expiresAt: row.expiresAt,
    activeFrom: row.activeFrom,
    maxScans: row.maxScans,
    scanCount: row.scanCount,
  });

  const log = async (outcome: string) => {
    try {
      await db.insert(qrScans).values({
        codeId: row.id,
        device: client.device,
        os: client.os,
        browser: client.browser,
        referrer: referrer ?? null,
        outcome,
      });
    } catch (error) {
      console.error("scan log failed", error);
    }
  };

  if (status.tone !== "live") {
    await log(status.tone);
    if (row.expiredUrl) redirect(ensureAbsolute(row.expiredUrl));
    const copy: Record<string, { icon: string; title: string; subtitle: string }> = {
      expired: { icon: "⌛", title: "This code has expired", subtitle: row.name },
      paused: { icon: "⏸️", title: "This code is paused", subtitle: row.name },
      limit: { icon: "🎟️", title: "Scan limit reached", subtitle: row.name },
      scheduled: { icon: "🕒", title: "Not live yet", subtitle: row.name },
    };
    const c = copy[status.tone] ?? copy.expired;
    return <StatusScreen {...c} detail={status.detail} />;
  }

  if (row.password) {
    const jar = await cookies();
    if (jar.get(`qr_unlock_${row.id}`)?.value !== "ok") {
      await log("locked");
      return <UnlockScreen slug={row.slug} name={row.name} />;
    }
  }

  await log("ok");
  try {
    await db
      .update(qrCodes)
      .set({ scanCount: sql`${qrCodes.scanCount} + 1` })
      .where(eq(qrCodes.id, row.id));
  } catch (error) {
    console.error("scan count failed", error);
  }

  const target = resolveTarget(row, client.os);

  if (row.mode !== "landing") {
    redirect(ensureAbsolute(target || row.staticPayload || "/"));
  }

  return (
    <Landing
      config={{ ...DEFAULT_LANDING, ...(row.landing ?? {}) }}
      target={target ? ensureAbsolute(target) : ""}
      slug={row.slug}
    />
  );
}
