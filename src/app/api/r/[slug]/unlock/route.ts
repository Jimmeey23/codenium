import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { verifyPassword } from "@/lib/server/codes";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { password } = (await request.json()) as { password?: string };
  const [row] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyPassword(password ?? "", row.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(`qr_unlock_${row.id}`, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return NextResponse.json({ ok: true });
}
