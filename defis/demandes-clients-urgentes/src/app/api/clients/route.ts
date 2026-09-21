import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { demandes: true } } },
    orderBy: [{ dateCreation: "desc" }],
  });
  return NextResponse.json({ clients });
}
