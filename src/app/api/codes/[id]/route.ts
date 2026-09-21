import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { normalizeInput, toDTO } from "@/lib/server/codes";
import type { QrConfigPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const [row] = await db.select().from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ code: toDTO(row) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<QrConfigPayload> & { togglePassword?: boolean };
    const input = normalizeInput(body);

    const values: Record<string, unknown> = {
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
      expiresAt: input.expiresAt,
      activeFrom: input.activeFrom,
      maxScans: input.maxScans,
      active: input.active,
      expiredUrl: input.expiredUrl,
      updatedAt: new Date(),
    };
    if (input.password !== undefined) values.password = input.password;

    const [row] = await db.update(qrCodes).set(values).where(eq(qrCodes.id, id)).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ code: toDTO(row) });
  } catch (error) {
    console.error("PATCH /api/codes/[id]", error);
    return NextResponse.json({ error: "Could not update code" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  await db.delete(qrCodes).where(eq(qrCodes.id, id));
  return NextResponse.json({ ok: true });
}
