import { prisma } from "@/lib/prisma";
import AjoutSource from "./ajout-source";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Sources() {
  const sources = await prisma.source.findMany({ orderBy: { nom: "asc" }, include: { _count: { select: { articles: true } } } });
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sites suivis</h1>
        <p className="text-sm text-gray-600">Ajouter un site, c'est donner l'adresse de son flux RSS. Ses articles arrivent tout de suite, puis à chaque relevé automatique.</p>
      </header>
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr><th className="p-3">Site</th><th className="p-3">Usage</th><th className="p-3">Articles</th><th className="p-3">Dernier relevé</th></tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3"><div className="font-medium">{s.nom}</div><div className="text-xs text-gray-500 break-all">{s.fluxRss}</div></td>
                <td className="p-3">{s.usage ?? "-"}</td>
                <td className="p-3">{s._count.articles}</td>
                <td className="p-3">{s.releveLe ? fmt.format(s.releveLe) : "-"}{s.erreur && <div className="text-xs text-red-700">{s.erreur}</div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AjoutSource />
    </main>
  );
}
