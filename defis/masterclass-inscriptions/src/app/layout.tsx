import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masterclass Inscriptions - Alegria défi n°3",
  description:
    "MVP souverain pour gérer les inscriptions à une masterclass avec envoi automatique d'un email de confirmation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
