import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Souverain",
  description: "MVP CRM prospects avec relance 7 jours (défi Alegria)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="border-b" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              CRM Prospects
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Tous
              </Link>
              <Link href="/?vue=relance" className="hover:underline">
                À relancer
              </Link>
              <Link href="/nouveau" className="hover:underline font-medium">
                + Nouveau prospect
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-8 text-xs" style={{ color: "var(--muted)" }}>
          crm-souverain v0.1 - défi Alegria - MVP souverain Next.js + Neon + Prisma
        </footer>
      </body>
    </html>
  );
}
