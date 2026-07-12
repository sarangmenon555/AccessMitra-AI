import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccessMitra AI — Your AI Companion for Opportunities",
  description: "Helping differently-abled individuals in India discover government schemes, jobs, legal rights, and opportunities. Powered by AI, grounded in verified sources.",
  keywords: "disability schemes India, differently abled government schemes, RPWD Act, UDID card, NHFDC, Niramaya",
  openGraph: {
    title: "AccessMitra AI",
    description: "Your AI Companion for Opportunities — for differently-abled individuals in India.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}