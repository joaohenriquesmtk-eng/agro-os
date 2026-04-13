import type { Metadata, Viewport } from "next"; // Adicionamos a importação do Viewport
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A PONTE DO PWA E A IDENTIDADE DO ECOSSISTEMA
export const metadata: Metadata = {
  title: "Agro OS | Edge Computing",
  description: "Sistema Integrado de Diagnóstico Agronômico e Viabilidade Financeira.",
  manifest: "/manifest.json", // O CEP que o Chrome vai ler para instalar o app
};

// A COR DA BARRA DO NAVEGADOR E DO CELULAR
export const viewport: Viewport = {
  themeColor: "#10b981", // O nosso Verde Esmeralda corporativo
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR" // Alterado para o nosso idioma padrão
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}