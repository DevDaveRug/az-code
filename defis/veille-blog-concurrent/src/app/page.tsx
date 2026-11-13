import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });

export default async function Page({ searchParams }: { searchParams: { source?: string } }) {
  const sourceId = searchParams.source ? Number(searchParams.source) : undefined;
  const [sources, articles, total] = await Promise.all([
    prisma.source.findMany({ orderBy: { nom: "asc" }, include: { _count: { select: { articles: true } } } }),
    prisma.article.findMany({
      where: sourceId ? { sourceId } : undefined,
      orderBy: [{ datePublication: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      take: 200,
      include: { source: true },
    }),
    prisma.article.count(),
  ]);
  const derniere = sources.map((s) => s.releveLe).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Nouveaux articles des blogs suivis</h1>
        <p className="text-sm text-gray-600">
          {total} articles, {sources.length} site(s) suivi(s). Dernier relevé automatique : {derniere ? fmt.format(derniere) : "pas encore"}.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/" className={`px-3 py-1 rounded-full border ${!sourceId ? "bg-gray-900 text-white" : "bg-white"}`}>Toutes</Link>
        {sources.map((s) => (
          <Link key={s.id} href={`/?source=${s.id}`} className={`px-3 py-1 rounded-full border ${sourceId === s.id ? "bg-gray-900 text-white" : "bg-white"}`}>
            {s.nom} ({s._count.articles})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr><th className="p-3">Titre</th><th className="p-3 whitespace-nowrap">Date</th><th className="p-3">Source</th></tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3"><a href={a.lien} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{a.titre}</a></td>
                <td className="p-3 whitespace-nowrap">{a.datePublication ? fmt.format(a.datePublication) : "-"}</td>
                <td className="p-3">{a.source.nom}</td>
              </tr>
            ))}
            {articles.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={3}>Aucun article pour l'instant.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
