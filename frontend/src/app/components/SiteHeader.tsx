"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TAGLINE } from "../lib/content";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/report", label: "Report an issue" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand-block" aria-label="AccessMitra AI home">
          <span className="monogram" aria-hidden="true">
            AM
          </span>
          <span>
            <span className="brand">AccessMitra AI</span>
            <span className="tagline">{TAGLINE}</span>
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            {LINKS.map((link) => {
              const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link href={link.href} className="nav-link" aria-current={current ? "page" : undefined}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
