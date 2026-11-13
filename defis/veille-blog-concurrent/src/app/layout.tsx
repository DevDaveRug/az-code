import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veille des blogs",
  description: "Les nouveaux articles des blogs suivis arrivent tout seuls dans un tableau : titre, date, lien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <nav className="bg-white border-b">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-3 flex gap-6 text-sm">
            <Link href="/" className="font-semibold">Articles</Link>
            <Link href="/sources">Sites suivis</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
