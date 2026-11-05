import SourceRegister from "../components/SourceRegister";
import { OFFICIAL_LINKS } from "../lib/officialLinks";

export const metadata = {
  title: "Sources and information standards | AccessMitra AI",
};

export default function Sources() {
  return (
    <div>
      <div className="narrow">
        <h1>Sources and information standards</h1>
        <p>AccessMitra AI is designed to help users find and understand information, not to replace the official source.</p>

        <h2>Source priority</h2>
        <p>Where possible, the project prioritises:</p>
        <ol>
          <li>Official legislation, rules, notifications and government orders.</li>
          <li>Official scheme guidelines, application portals and department publications.</li>
          <li>Official government FAQs and explanatory pages.</li>
          <li>Reputable specialist organisations for additional context, clearly labelled as non-government sources.</li>
        </ol>
        <p>
          Search snippets, social-media posts and general encyclopaedia entries should not be treated as primary evidence for legal
          rights, eligibility rules or application requirements.
        </p>

        <h2>How to read an answer</h2>
        <p>
          An answer may summarise or explain a source. A summary is not the legal text itself. Open the cited source and check the
          relevant section before making an important decision.
        </p>
        <p>
          Where possible, answers identify the issuing authority, source title, direct link, relevant section or page, and the date the
          source was last checked. A last-checked date is shown only when a person has actually checked the source.
        </p>

        <h2>Uncertainty and conflicting sources</h2>
        <p>
          If a source is missing, unclear, outdated or inconsistent with another source, AccessMitra AI should say so. It should not
          silently guess which condition applies. Users should confirm the current rule with the responsible authority.
        </p>

        <h2>Coverage limitations</h2>
        <p>
          The project may not include every scheme, state rule, local service, application window or recent amendment. The absence of a
          result does not mean that no support is available.
        </p>

        <h2>Corrections</h2>
        <p>
          Please report the question or answer, the source link if known, and a short description of the issue through the{" "}
          <a href="/report">Report an issue</a> page. Do not include Aadhaar numbers, medical documents, disability certificate numbers
          or other sensitive personal data.
        </p>

        <h2>Official starting points</h2>
        <ul className="source-list">
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.url} className="source-item">
              <p className="source-title">{l.title}</p>
              <p className="source-meta">
                {l.authority}. {l.use}.
              </p>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                Open {l.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h2>Source register</h2>
        <SourceRegister />
      </div>
    </div>
  );
}
