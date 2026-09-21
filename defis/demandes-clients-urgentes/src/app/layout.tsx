import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demandes clients urgentes",
  description: "Centralise les demandes clients et affiche les urgentes en premier.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
