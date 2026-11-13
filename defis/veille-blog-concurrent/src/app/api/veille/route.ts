import { NextResponse } from "next/server";
import { releverSources } from "@/lib/veille";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Appelee par Vercel Cron (Authorization: Bearer CRON_SECRET), ou a la main avec le meme en-tete.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });
  }
  return NextResponse.json({ bilan: await releverSources() });
}
