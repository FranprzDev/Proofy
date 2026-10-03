import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk, Comfortaa } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofy — Entregas verificadas. Pagos automáticos.",
  description:
    "Plataforma sobre Solana que conecta contratación, verificación de calidad por IA y pago automático de hitos para freelancers y software factories.",
  keywords: [
    "Solana",
    "freelance",
    "escrow",
    "smart contract",
    "verificación",
    "pagos automáticos",
    "Proofy",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${comfortaa.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
