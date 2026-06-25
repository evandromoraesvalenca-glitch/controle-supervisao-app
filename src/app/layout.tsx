import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checklist Pre-Abertura Linha 6",
  description: "Checklist digital operacional de pre-abertura de estacoes da Linha 6"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
