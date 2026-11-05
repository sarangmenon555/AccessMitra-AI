import Link from "next/link";
import { ISSUES_URL } from "../lib/content";

export const metadata = {
  title: "About | AccessMitra AI",
};

export default function About() {
  return (
    <div className="narrow">
      <h1>About AccessMitra AI</h1>
      <p>
        AccessMitra AI is an independent, student-developed project exploring how AI-assisted information retrieval can make
        disability-related public information easier to navigate in India.
      </p>
      <p>
        Information about schemes, rights, education, employment and support services may be spread across different departments,
        portals and documents. AccessMitra AI aims to help users discover relevant information, understand it in plain language and
        follow links to the sources responsible for it.
      </p>
      <p>
        The project is a technology prototype under development. Its usefulness depends on the quality, relevance and currency of its
        source material and on how reliably the system represents that material.
      </p>
      <p>
        AccessMitra AI does not make official decisions, certify disability status, guarantee eligibility or replace government
        authorities or qualified professionals. It is not affiliated with or endorsed by a government department unless explicitly
        documented.
      </p>
      <p>
        We welcome specific feedback about incorrect information, inaccessible interactions, broken links or missing official sources.
        Please do not send sensitive personal documents or identifiers when reporting an issue.
      </p>
      <p>
        <Link href="/report">Report an issue</Link>, read how <Link href="/sources">sources are used</Link>, or open a public issue on{" "}
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </div>
  );
}
