import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

// GET /api/cr/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const cr = await prisma.cr.findUnique({ where: { id } });
  if (!cr) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(cr);
}
