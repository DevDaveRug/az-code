import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lireFlux } from "@/lib/rss";
import { telechargerFlux } from "@/lib/veille";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await prisma.source.findMany({ orderBy: { nom: "asc" }, include: { _count: { select: { articles: true } } } }));
}

// Ajoute un site suivi. Le flux est lu avant l'enregistrement : une adresse qui n'est pas un flux est refusee.
export async function POST(req: Request) {
  const { nom, fluxRss, usage } = (await req.json()) as { nom?: string; fluxRss?: string; usage?: string };
  if (!nom?.trim() || !fluxRss?.trim()) return NextResponse.json({ erreur: "Nom et adresse du flux obligatoires" }, { status: 400 });
  let url: URL;
  try {
    url = new URL(fluxRss.trim());
  } catch {
    return NextResponse.json({ erreur: "Adresse du flux invalide" }, { status: 400 });
  }
  let articles;
  try {
    articles = lireFlux(await telechargerFlux(url.toString()));
  } catch (e) {
    return NextResponse.json({ erreur: `Flux illisible : ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }
  const existante = await prisma.source.findUnique({ where: { fluxRss: url.toString() } });
  if (existante) return NextResponse.json({ erreur: "Ce flux est deja suivi" }, { status: 409 });
  const source = await prisma.source.create({ data: { nom: nom.trim(), fluxRss: url.toString(), usage: usage?.trim() || null } });
  // Premier releve tout de suite : la source arrive dans le tableau sans attendre le passage automatique.
  const r = await prisma.article.createMany({
    data: articles.map((a) => ({ titre: a.titre || a.lien, datePublication: a.date, lien: a.lien, sourceId: source.id })),
    skipDuplicates: true,
  });
  await prisma.source.update({ where: { id: source.id }, data: { releveLe: new Date() } });
  return NextResponse.json({ source, ajoutes: r.count }, { status: 201 });
}
