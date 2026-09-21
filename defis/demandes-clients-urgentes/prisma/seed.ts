import { PrismaClient, Urgence, Statut } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Wipe pour idempotence dev
  await prisma.demande.deleteMany();
  await prisma.client.deleteMany();

  const alice = await prisma.client.create({
    data: { nom: "Alice Martin", email: "alice.martin@legrand.example", telephone: "+33 6 00 00 00 11" },
  });
  const bob = await prisma.client.create({
    data: { nom: "Bob Durand", email: "bob.durand@techflow.example", telephone: "+33 6 00 00 00 12" },
  });
  const chloe = await prisma.client.create({
    data: { nom: "Chloe Dubois", email: "chloe.dubois@studio-zenith.example", telephone: "+33 6 00 00 00 13" },
  });
  const emma = await prisma.client.create({
    data: { nom: "Emma Petit", email: "emma.petit@marketpro.example", telephone: "+33 6 00 00 00 14" },
  });
  const fabien = await prisma.client.create({
    data: { nom: "Fabien Roux", email: "fabien.roux@atelier-nord.example", telephone: "+33 6 00 00 00 15" },
  });

  await prisma.demande.createMany({
    data: [
      { clientId: alice.id, description: "Changer le logo dans le header du site, la nouvelle version est en pj.", urgenceClient: Urgence.BASSE, urgenceReelle: Urgence.BASSE, statut: Statut.FAIT, nomClientTemp: alice.nom, emailClientTemp: alice.email, telephoneClientTemp: alice.telephone },
      { clientId: bob.id, description: "Ajouter un bouton Contact dans le menu mobile, il manque depuis la refonte.", urgenceClient: Urgence.MOYENNE, urgenceReelle: Urgence.MOYENNE, statut: Statut.EN_COURS, nomClientTemp: bob.nom, emailClientTemp: bob.email, telephoneClientTemp: bob.telephone },
      { clientId: chloe.id, description: "Corriger la fonte du prix sur la landing, elle passe en Comic Sans en prod.", urgenceClient: Urgence.HAUTE, urgenceReelle: Urgence.HAUTE, statut: Statut.NOUVEAU, nomClientTemp: chloe.nom, emailClientTemp: chloe.email, telephoneClientTemp: chloe.telephone },
      { clientId: alice.id, description: "Le formulaire de contact ne renvoie plus d email, urgent avant demain.", urgenceClient: Urgence.CRITIQUE, urgenceReelle: Urgence.CRITIQUE, statut: Statut.EN_COURS, nomClientTemp: alice.nom, emailClientTemp: alice.email, telephoneClientTemp: alice.telephone },
      { clientId: emma.id, description: "Retirer un ancien post du blog qui reference un partenariat termine.", urgenceClient: Urgence.BASSE, urgenceReelle: Urgence.MOYENNE, statut: Statut.NOUVEAU, nomClientTemp: emma.nom, emailClientTemp: emma.email, telephoneClientTemp: emma.telephone },
      { clientId: fabien.id, description: "Ajouter un lien vers ma nouvelle chaine YouTube dans le footer.", urgenceClient: Urgence.MOYENNE, urgenceReelle: Urgence.BASSE, statut: Statut.NOUVEAU, nomClientTemp: fabien.nom, emailClientTemp: fabien.email, telephoneClientTemp: fabien.telephone },
      { clientId: bob.id, description: "Peux tu me faire une version anglaise de la page tarifs ?", urgenceClient: Urgence.HAUTE, urgenceReelle: Urgence.MOYENNE, statut: Statut.BLOQUE, nomClientTemp: bob.nom, emailClientTemp: bob.email, telephoneClientTemp: bob.telephone },
      { clientId: chloe.id, description: "Refresh du menu principal, on veut inverser l ordre de 2 items.", urgenceClient: Urgence.BASSE, urgenceReelle: Urgence.BASSE, statut: Statut.FAIT, nomClientTemp: chloe.nom, emailClientTemp: chloe.email, telephoneClientTemp: chloe.telephone },
      { clientId: emma.id, description: "La photo hero est pixellisee sur mobile, elle prend toute la largeur mal.", urgenceClient: Urgence.HAUTE, urgenceReelle: Urgence.HAUTE, statut: Statut.NOUVEAU, nomClientTemp: emma.nom, emailClientTemp: emma.email, telephoneClientTemp: emma.telephone },
      { clientId: alice.id, description: "Ajouter un pop up cookie conforme RGPD, on a un audit dans 15 jours.", urgenceClient: Urgence.CRITIQUE, urgenceReelle: Urgence.HAUTE, statut: Statut.EN_COURS, nomClientTemp: alice.nom, emailClientTemp: alice.email, telephoneClientTemp: alice.telephone },
    ],
  });

  console.log("Seed OK : 5 clients + 10 demandes");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
