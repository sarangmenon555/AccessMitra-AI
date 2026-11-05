import { forwardRef } from "react";
import Link from "next/link";
import type { QueryResult } from "../lib/api";

interface Props {
  result: QueryResult;
  headingId: string;
}

const AnswerCard = forwardRef<HTMLHeadingElement, Props>(function AnswerCard({ result, headingId }, ref) {
  const paragraphs = result.answer.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <article className="answer-card" aria-labelledby={headingId}>
      <h3 id={headingId} ref={ref} tabIndex={-1}>
        Answer
      </h3>
      <p className={`state-line state-${result.state}`}>
        <span>Answer status: </span>
        {result.state_label}
      </p>
      <div className="answer-body">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {result.note && <p className="note-box">{result.note}</p>}
      {result.sources.length > 0 && (
        <section aria-label="Official sources used">
          <h4>Official sources used</h4>
          <ul className="source-list">
            {result.sources.map((s) => (
              <li key={s.source_id} className="source-item">
                <p className="source-title">
                  {s.marker ? `[${s.marker}] ` : ""}
                  {s.title}
                </p>
                <p className="source-meta">
                  Issuing authority: {s.authority}. Type: {s.type.replace(/_/g, " ")}. Scope: {s.geography.replace("state:", "State: ")}.
                  {s.sections && s.sections.length > 0 ? ` Section or page: ${s.sections.join("; ")}.` : ""}
                  {s.last_checked ? ` Source last checked: ${s.last_checked}.` : " Not yet checked by a human reviewer."}
                </p>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  Open official source: {s.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="answer-actions">
        <Link href="/report?type=incorrect_answer">Report an incorrect or outdated answer</Link>
        <Link href="/report?type=broken_link">Report a broken official link</Link>
      </div>
    </article>
  );
});

export default AnswerCard;
