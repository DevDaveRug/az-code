import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM libre",
  description: "CRM vide : prospects, rendez-vous et suivis. Version code, sans abonnement."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="border-b" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <Link href="/" className="font-semibold text-lg">
              CRM libre
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/" className="hover:underline">Prospects</Link>
              <Link href="/?vue=relance" className="hover:underline">À relancer</Link>
              <Link href="/rdv" className="hover:underline">RDV</Link>
              <Link href="/suivis" className="hover:underline">Suivis</Link>
              <Link href="/nouveau" className="hover:underline font-medium">+ Nouveau prospect</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
