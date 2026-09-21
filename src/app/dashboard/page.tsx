import { desc } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { toDTO } from "@/lib/server/codes";
import type { QrCodeDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let codes: QrCodeDTO[] = [];
  try {
    const rows = await db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt)).limit(120);
    codes = rows.map(toDTO);
  } catch (error) {
    console.error("dashboard load failed", error);
  }

  return (
    <>
      <SiteHeader active="dashboard" />
      <main className="relative">
        <div className="grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
          <header className="mb-8">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              <span className="text-gradient">Your codes</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Every dynamic code can be re-pointed, paused, expired or password-protected at any
              time — the printed artwork never changes.
            </p>
          </header>
          <DashboardClient codes={codes} />
        </div>
      </main>
    </>
  );
}
