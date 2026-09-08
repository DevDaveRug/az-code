import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { BoutonImprimer } from "@/components/BoutonImprimer";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CrDetailPage({ params }: Props) {
  const { id } = await params;
  const cr = await prisma.cr.findUnique({ where: { id } });
  if (!cr) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav className="mb-6">
        <Link href="/" className="text-or text-sm hover:underline">
          &larr; Retour
        </Link>
      </nav>

      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            {cr.interlocuteur ?? "CR de RDV"}
          </h1>
          {cr.sujet && <p className="mt-1 text-slate-400">{cr.sujet}</p>}
        </div>
        <div className="text-xs text-slate-500 text-right">
          {cr.dateRdv && (
            <div>RDV : {new Date(cr.dateRdv).toLocaleDateString("fr-FR")}</div>
          )}
          <div>Créé : {new Date(cr.createdAt).toLocaleString("fr-FR")}</div>
          {cr.modeleLlm && <div className="text-slate-600">{cr.modeleLlm}</div>}
        </div>
      </header>

      <article className="prose-cr rounded-lg border border-slate-800 bg-slate-900 p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cr.crFormate}</ReactMarkdown>
      </article>

      <div className="mt-6 flex gap-3">
        <BoutonImprimer />
      </div>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-600">
        <details>
          <summary className="cursor-pointer text-slate-400">Notes brutes source</summary>
          <pre className="mt-2 whitespace-pre-wrap text-slate-500">{cr.notesBrutes}</pre>
        </details>
      </footer>
    </main>
  );
}
