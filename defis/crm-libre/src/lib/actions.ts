"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const texte = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
const entier = (f: FormData, k: string) => {
  const v = texte(f, k);
  const n = v === null ? NaN : Number(v);
  return Number.isInteger(n) ? n : null;
};
const date = (f: FormData, k: string) => {
  const v = texte(f, k);
  return v ? new Date(v) : null;
};

export async function creerProspect(f: FormData) {
  const prenom = texte(f, "prenom");
  const nom = texte(f, "nom");
  if (!prenom || !nom) throw new Error("Prénom et nom obligatoires");
  const montant = texte(f, "montantPotentiel");
  await prisma.prospect.create({
    data: {
      prenom,
      nom,
      entreprise: texte(f, "entreprise"),
      email: texte(f, "email")?.toLowerCase() ?? null,
      telephone: texte(f, "telephone"),
      source: (texte(f, "source") as never) ?? "AUTRE",
      montantPotentiel: montant ? montant : null,
      notes: texte(f, "notes"),
      dernierContact: new Date()
    }
  });
  revalidatePath("/");
  redirect("/");
}

export async function creerRdv(f: FormData) {
  const titre = texte(f, "titre");
  if (!titre) throw new Error("Titre obligatoire");
  await prisma.rdv.create({
    data: {
      titre,
      prospectId: entier(f, "prospectId"),
      dateRdv: date(f, "dateRdv"),
      contexte: (texte(f, "contexte") as never) ?? "DECOUVERTE",
      notesBrutes: texte(f, "notesBrutes"),
      compteRendu: texte(f, "compteRendu")
    }
  });
  revalidatePath("/rdv");
}

export async function creerSuivi(f: FormData) {
  const tache = texte(f, "tache");
  if (!tache) throw new Error("Tâche obligatoire");
  await prisma.suivi.create({
    data: {
      tache,
      description: texte(f, "description"),
      echeance: date(f, "echeance"),
      priorite: (texte(f, "priorite") as never) ?? "MOYENNE",
      prospectId: entier(f, "prospectId"),
      rdvId: entier(f, "rdvId")
    }
  });
  revalidatePath("/suivis");
}

export async function terminerSuivi(f: FormData) {
  const id = entier(f, "id");
  if (id === null) return;
  await prisma.suivi.update({ where: { id }, data: { statut: "FAIT" } });
  revalidatePath("/suivis");
}

export async function marquerContact(f: FormData) {
  const id = entier(f, "id");
  if (id === null) return;
  await prisma.prospect.update({ where: { id }, data: { dernierContact: new Date() } });
  revalidatePath("/");
}
