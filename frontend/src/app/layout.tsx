import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export const metadata: Metadata = {
  title: "AccessMitra AI | Disability Schemes, Rights and Opportunities in India",
  description:
    "An independent student-developed project helping people navigate official information about disability-related schemes, rights, education, employment and support services in India.",
  openGraph: {
    title: "AccessMitra AI",
    description:
      "An independent student-developed project helping people navigate official information about disability-related schemes, rights, education, employment and support services in India.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          <div className="container">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
