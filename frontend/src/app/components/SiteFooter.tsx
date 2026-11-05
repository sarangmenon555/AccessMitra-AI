import Link from "next/link";
import { FOOTER_TEXT, REPO_URL } from "../lib/content";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>{FOOTER_TEXT}</p>
        <nav aria-label="Footer">
          <ul className="footer-links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/sources">Sources</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
            <li><Link href="/report">Report an Issue</Link></li>
            <li>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                GitHub<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
