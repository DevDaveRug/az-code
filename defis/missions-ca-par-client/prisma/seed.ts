import { PrismaClient, Prisma } from "@prisma/client";
import { donneesAvant } from "../src/lib/donnees-avant";
import { nettoyerBase } from "../src/lib/nettoyage";

// Le seed EST la migration : il part de la base "en vrille" (donnees-avant.ts)
// et la convertit avec les regles testees de src/lib/nettoyage.ts.
const prisma = new PrismaClient();

async function main() {
  // Wipe pour idempotence (demo)
  await prisma.mission.deleteMany();
  await prisma.client.deleteMany();

  const base = nettoyerBase(donneesAvant);
  const ids = new Map<string, number>();

  for (const [i, c] of base.clients.entries()) {
    const cree = await prisma.client.create({
      data: {
        nom: c.nom,
        contact: c.contact,
        email: c.email || `a-completer-${i + 1}@missions.example`,
        notesMigration: c.alertes.join(" ; ") || null,
      },
    });
    ids.set(c.cle, cree.id);
  }

  for (const m of base.missions) {
    await prisma.mission.create({
      data: {
        intitule: m.intitule,
        clientId: ids.get(m.cleClient)!,
        statut: m.statut,
        // Montant illisible : 0 + alerte deja presente dans notesMigration
        montant: new Prisma.Decimal((m.montant ?? 0).toFixed(2)),
        dateFin: m.dateFin,
        facture: m.facture,
        notesMigration: m.alertes.join(" ; ") || null,
      },
    });
  }

  const aVerifier = base.missions.filter((m) => m.alertes.length > 0).length;
  console.log(`Migration OK : ${donneesAvant.length} lignes -> ${base.clients.length} clients + ${base.missions.length} missions (${aVerifier} à vérifier)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
