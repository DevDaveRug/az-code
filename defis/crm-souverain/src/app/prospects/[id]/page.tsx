import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { prochaineRelance, joursRestants, couleurUrgence } from "@/lib/relance";
import {
  derniereInteractionAt,
  LIBELLE_TYPE_INTERACTION,
  COULEUR_TYPE_INTERACTION
} from "@/lib/interactions";
import type { Statut } from "@prisma/client";
import { TypeInteraction } from "@prisma/client";

export const dynamic = "force-dynamic";

const LIBELLE_STATUT: Record<Statut, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  GAGNE: "Gagné",
  PERDU: "Perdu"
};

async function ajouterInteraction(prospectId: number, formData: FormData) {
  "use server";
  const type = String(formData.get("type") ?? "AUTRE") as TypeInteraction;
  const dateStr = String(formData.get("date") ?? "").trim();
  const resume = String(formData.get("resume") ?? "").trim();
  const resultat = String(formData.get("resultat") ?? "").trim() || null;
  const nextStep = String(formData.get("nextStep") ?? "").trim() || null;

  if (!resume || !dateStr) throw new Error("date et résumé sont requis");
  if (!Object.values(TypeInteraction).includes(type)) throw new Error("type invalide");
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) throw new Error("date invalide");

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { id: true, dernierContact: true }
  });
  if (!prospect) throw new Error("prospect introuvable");

  await prisma.$transaction([
    prisma.interaction.create({
      data: { prospectId, type, date, resume, resultat, nextStep }
    }),
    prisma.prospect.update({
      where: { id: prospectId },
      data: { dernierContact: date > prospect.dernierContact ? date : prospect.dernierContact }
    })
  ]);

  redirect(`/prospects/${prospectId}`);
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function DetailProspect({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      entreprise: true,
      interactions: { orderBy: { date: "desc" } }
    }
  });
  if (!prospect) notFound();

  const derniereInter = derniereInteractionAt(prospect, prospect.interactions);
  const pr = prochaineRelance({ statut: prospect.statut, dernierContact: derniereInter });
  const jr = joursRestants(pr);
  const couleur = couleurUrgence(jr);

  const ajouterAction = ajouterInteraction.bind(null, id);

  return (
    <div className="max-w-4xl">
      <a href="/" className="text-sm text-blue-600 underline">← Retour à la liste</a>
      <h1 className="text-2xl font-bold mt-3 mb-1">{prospect.prenom} {prospect.nom}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        <span>Statut : <strong>{LIBELLE_STATUT[prospect.statut]}</strong></span>
        <span className="mx-3">·</span>
        <span>Source : {prospect.source}</span>
        <span className="mx-3">·</span>
        <span>Entré le : {formatDate(prospect.dateEntree)}</span>
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Section titre="Coordonnées">
          <Ligne libelle="Email"><a className="underline" href={`mailto:${prospect.email}`}>{prospect.email}</a></Ligne>
          {prospect.telephone && <Ligne libelle="Téléphone">{prospect.telephone}</Ligne>}
          {prospect.montantPotentiel && <Ligne libelle="Montant potentiel">{Number(prospect.montantPotentiel).toLocaleString("fr-FR")} EUR</Ligne>}
        </Section>

        <Section titre="Entreprise">
          {prospect.entreprise ? (
            <>
              <Ligne libelle="Nom"><strong>{prospect.entreprise.nom}</strong></Ligne>
              {prospect.entreprise.secteur && <Ligne libelle="Secteur">{prospect.entreprise.secteur}</Ligne>}
              {prospect.entreprise.taille && <Ligne libelle="Taille">{prospect.entreprise.taille}</Ligne>}
              {prospect.entreprise.site && <Ligne libelle="Site"><a className="underline" href={prospect.entreprise.site} target="_blank" rel="noreferrer">{prospect.entreprise.site}</a></Ligne>}
              {prospect.entreprise.adresse && <Ligne libelle="Adresse">{prospect.entreprise.adresse}</Ligne>}
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Aucune entreprise associée.</p>
          )}
        </Section>
      </div>

      <div className={`p-4 rounded mb-6 ${couleur}`}>
        <p className="text-sm">
          <strong>Dernière interaction :</strong> {formatDate(derniereInter)}
          {pr && (
            <>
              {" · "}
              <strong>Prochaine relance :</strong> {formatDate(pr)}
              {jr !== null && <> ({jr <= 0 ? `en retard de ${Math.abs(jr)} j` : `dans ${jr} j`})</>}
            </>
          )}
        </p>
      </div>

      {prospect.notes && (
        <Section titre="Notes">
          <p className="text-sm whitespace-pre-wrap">{prospect.notes}</p>
        </Section>
      )}

      <h2 className="text-xl font-bold mt-8 mb-3">Interactions ({prospect.interactions.length})</h2>
      {prospect.interactions.length === 0 ? (
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Aucune interaction pour l'instant. Ajoute la première ci-dessous.</p>
      ) : (
        <ul className="space-y-3 mb-8">
          {prospect.interactions.map((i) => (
            <li key={i.id} className="border rounded p-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${COULEUR_TYPE_INTERACTION[i.type]}`}>{LIBELLE_TYPE_INTERACTION[i.type]}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(i.date)}</span>
              </div>
              <p className="text-sm mb-1"><strong>Résumé :</strong> {i.resume}</p>
              {i.resultat && <p className="text-sm mb-1"><strong>Résultat :</strong> {i.resultat}</p>}
              {i.nextStep && <p className="text-sm text-blue-700"><strong>Prochaine étape :</strong> {i.nextStep}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="border rounded p-4" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-medium mb-3">+ Ajouter une interaction</h3>
        <form action={ajouterAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select name="type" required defaultValue="EMAIL" className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                {Object.entries(LIBELLE_TYPE_INTERACTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" name="date" required defaultValue={formatDateInputValue(new Date())} className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Résumé *</label>
            <input type="text" name="resume" required placeholder="Ex : Envoi maquette + proposition financière" className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Résultat</label>
            <input type="text" name="resultat" placeholder="Ex : Accusé de réception, attend une réponse" className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prochaine étape</label>
            <input type="text" name="nextStep" placeholder="Ex : Relancer sous 8 jours si pas de réponse" className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          </div>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700">Enregistrer l'interaction</button>
        </form>
      </div>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-4" style={{ borderColor: "var(--border)" }}>
      <h3 className="font-medium mb-2">{titre}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Ligne({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <p className="text-sm">
      <span style={{ color: "var(--muted)" }}>{libelle} : </span>
      {children}
    </p>
  );
}
