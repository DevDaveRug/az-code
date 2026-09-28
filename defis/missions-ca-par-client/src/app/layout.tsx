import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Missions et CA par client",
  description: "Suivi des missions avec le chiffre d'affaires facturé, à facturer et en cours, client par client.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <nav className="bg-white border-b">
          <div className="mx-auto max-w-6xl px-8 py-3 flex gap-6 text-sm">
            <Link href="/" className="font-semibold">CA par client</Link>
            <Link href="/missions/nouvelle">Ajouter une mission</Link>
            <Link href="/avant-apres">Avant / après</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
