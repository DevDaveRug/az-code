import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CR-RDV Souverain",
  description: "Formatage automatique de comptes rendus de RDV en 2 colonnes -- souverain, sans SaaS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
