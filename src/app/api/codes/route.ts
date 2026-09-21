import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { generateSlug, normalizeInput, toDTO } from "@/lib/server/codes";
import type { QrConfigPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt)).limit(200);
    return NextResponse.json({ codes: rows.map(toDTO) });
  } catch (error) {
    console.error("GET /api/codes", error);
    return NextResponse.json({ codes: [], error: "Database unavailable" }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<QrConfigPayload>;
    const input = normalizeInput(body);

    let slug = generateSlug();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await db
        .select({ id: qrCodes.id })
        .from(qrCodes)
        .where(eq(qrCodes.slug, slug))
        .limit(1);
      if (clash.length === 0) break;
      slug = generateSlug(8);
    }

    const [row] = await db
      .insert(qrCodes)
      .values({
        slug,
        name: input.name,
        contentType: input.contentType,
        content: input.content,
        staticPayload: input.staticPayload,
        dynamic: input.dynamic,
        mode: input.mode,
        targetUrl: input.targetUrl,
        landing: input.landing,
        routing: input.routing,
        design: input.design,
        password: input.password ?? null,
        expiresAt: input.expiresAt,
        activeFrom: input.activeFrom,
        maxScans: input.maxScans,
        active: input.active,
        expiredUrl: input.expiredUrl,
      })
      .returning();

    slug = row.slug;
    return NextResponse.json({ code: toDTO(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/codes", error);
    return NextResponse.json({ error: "Could not save code" }, { status: 500 });
  }
}
