"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AnswerCard from "./AnswerCard";
import { ApiError, getStates, queryAI, type QueryResult } from "../lib/api";
import {
  COMMON_QUESTIONS,
  EXPLORE_TILES,
  IMPORTANT_NOTICE_1,
  IMPORTANT_NOTICE_2,
  IMPORTANT_NOTICE_3,
  PRIVACY_HINT,
  REMEMBER_POINTS,
  SAMPLE_QUESTIONS,
} from "../lib/content";
import { OFFICIAL_LINKS } from "../lib/officialLinks";

interface Exchange {
  id: number;
  question: string;
  result?: QueryResult;
  error?: { message: string; retryable: boolean };
}

const MAX_CHARS = 500;

export default function HomeShell() {
  const [question, setQuestion] = useState("");
  const [region, setRegion] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [focusTarget, setFocusTarget] = useState<"answer" | "error" | null>(null);
  const nextId = useRef(1);
  const answerHeading = useRef<HTMLHeadingElement | null>(null);
  const errorBox = useRef<HTMLDivElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === "answer") answerHeading.current?.focus();
    if (focusTarget === "error") errorBox.current?.focus();
    setFocusTarget(null);
  }, [focusTarget, exchanges]);

  const resize = () => {
    const t = textarea.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  };

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (text.length < 3 || loading) return;
      const id = nextId.current++;
      setExchanges((prev) => [...prev, { id, question: text }]);
      setQuestion("");
      requestAnimationFrame(resize);
      setLoading(true);
      setAnnouncement("Searching official sources. Please wait.");
      try {
        const result = await queryAI(text, region);
        setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, result } : e)));
        setAnnouncement(`Answer ready. ${result.state_label}`);
        setFocusTarget("answer");
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again later.";
        const retryable = err instanceof ApiError ? err.retryable : true;
        setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, error: { message, retryable } } : e)));
        setAnnouncement("There was a problem getting an answer.");
        setFocusTarget("error");
      } finally {
        setLoading(false);
      }
    },
    [loading, region],
  );

  const retry = (ex: Exchange) => {
    setExchanges((prev) => prev.filter((e) => e.id !== ex.id));
    ask(ex.question);
  };

  const lastId = exchanges.length ? exchanges[exchanges.length - 1].id : -1;
  const started = exchanges.length > 0;

  const tiles = [
    { value: "Independent", label: "Student-developed project" },
    { value: "Official links", label: "Shown with every answer" },
    { value: "Not official", label: "Not a government service" },
  ];

  return (
    <>
      <div className="shell">
        <aside className="sidebar" aria-label="Quick links">
          <div className="side-card">
            <h2 className="side-title">Quick questions</h2>
            <div className="side-list">
              {SAMPLE_QUESTIONS.map((q) => (
                <button key={q} type="button" className="side-btn" disabled={loading} onClick={() => ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="side-card">
            <h2 className="side-title">Explore topics</h2>
            <div className="side-list">
              {EXPLORE_TILES.map((t) => (
                <button key={t.key} type="button" className="side-btn" disabled={loading} onClick={() => ask(t.question)}>
                  {t.title}
                </button>
              ))}
            </div>
          </div>
          <div className="side-card-amber">
            <h2 className="side-title">Remember</h2>
            <ul>
              {REMEMBER_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="main-col">
          {!started && (
            <>
              <section className="hero-block" aria-labelledby="hero-heading">
                <div className="hero-glow" aria-hidden="true" />
                <div className="hero-inner">
                  <p className="badge-pill">Independent student project. Not a government service.</p>
                  <h1 id="hero-heading" className="hero-title">
                    <span>A clearer path to</span>
                    <span className="amber-gradient">disability-related schemes,</span>
                    <span className="amber-gradient">rights and opportunities in India</span>
                  </h1>
                  <p className="hero-text">
                    AccessMitra AI is an independent, student-developed project designed to help persons with disabilities and their
                    families navigate information about government schemes, rights, education, employment and support services in India.
                  </p>
                  <p className="hero-text">
                    Ask a question in everyday language, explore relevant information, and follow links to official sources to understand
                    possible next steps.
                  </p>
                  <p className="goal">
                    <strong>Our goal:</strong> Make complex information easier to find and understand, while helping people verify
                    important details with the responsible authorities.
                  </p>
                  <div className="button-row">
                    <a href="#common" className="btn">
                      Explore information
                    </a>
                    <Link href="/sources" className="btn btn-secondary">
                      How sources are used
                    </Link>
                  </div>
                </div>
              </section>

              <section aria-label="Project facts">
                <div className="stat-grid">
                  {tiles.map((t) => (
                    <div key={t.label} className="stat-tile">
                      <p className="stat-value">{t.value}</p>
                      <p className="stat-label">{t.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="important-heading" className="callout">
                <h2 id="important-heading">Important information</h2>
                <p>{IMPORTANT_NOTICE_1}</p>
                <p>{IMPORTANT_NOTICE_2}</p>
                <p>{IMPORTANT_NOTICE_3}</p>
              </section>

              <section id="common" aria-labelledby="common-heading">
                <h2 id="common-heading" className="section-label">
                  Common questions
                </h2>
                <div className="common-grid">
                  {COMMON_QUESTIONS.map((c) => (
                    <button key={c.q} type="button" className="q-card" disabled={loading} onClick={() => ask(c.q)}>
                      {c.q}
                      <span className="tag">{c.cat}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section aria-labelledby="explore-heading">
                <h2 id="explore-heading" className="section-label">
                  What you can explore
                </h2>
                <div className="card-grid">
                  {EXPLORE_TILES.map((tile) => (
                    <div key={tile.key} className="card">
                      <h3>{tile.title}</h3>
                      <p>{tile.body}</p>
                      <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => ask(tile.question)}>
                        {tile.action}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="official-heading">
                <h2 id="official-heading" className="section-label">
                  Official starting points
                </h2>
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
              </section>
            </>
          )}

          {started && (
            <section aria-label="Conversation">
              {exchanges.map((ex) => (
                <div key={ex.id} className="exchange">
                  <div className="bubble-row">
                    <div className="bubble-user">
                      <span className="who">Your question</span>
                      {ex.question}
                    </div>
                  </div>
                  {!ex.result && !ex.error && (
                    <div className="card">
                      <div className="dots">
                        <span className="dot-group" aria-hidden="true">
                          <span className="dot" />
                          <span className="dot" style={{ animationDelay: "0.2s" }} />
                          <span className="dot" style={{ animationDelay: "0.4s" }} />
                        </span>
                        <span>Searching official sources. This can take up to a minute if the service is starting up.</span>
                      </div>
                    </div>
                  )}
                  {ex.error && (
                    <div className="alert-box" role="alert" tabIndex={-1} ref={ex.id === lastId ? errorBox : undefined}>
                      <p>
                        <strong>Could not get an answer.</strong> {ex.error.message}
                      </p>
                      <p>
                        You can also check the official sources listed on the <Link href="/sources">Sources page</Link>.
                      </p>
                      {ex.error.retryable && (
                        <button type="button" className="btn" onClick={() => retry(ex)}>
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                  {ex.result && (
                    <AnswerCard
                      result={ex.result}
                      headingId={`answer-${ex.id}`}
                      ref={ex.id === lastId ? answerHeading : undefined}
                    />
                  )}
                </div>
              ))}
              <div className="chips-row" role="group" aria-label="More questions to try">
                {SAMPLE_QUESTIONS.slice(0, 3).map((q) => (
                  <button key={q} type="button" className="chip" disabled={loading} onClick={() => ask(q)}>
                    {q.length > 45 ? q.slice(0, 45) + "..." : q}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <form
        className="ask-bar"
        aria-label="Ask a question"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <div className="ask-inner">
          <div className="ask-row">
            {states.length > 0 && (
              <div className="ask-state">
                <label htmlFor="region" className="sr-only">
                  State or Union Territory (optional)
                </label>
                <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">State or UT (optional)</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="ask-field">
              <label htmlFor="question" className="sr-only">
                Your question about a scheme, right or opportunity
              </label>
              <textarea
                id="question"
                ref={textarea}
                rows={1}
                value={question}
                maxLength={MAX_CHARS}
                placeholder="Ask about a scheme, right or opportunity…"
                aria-describedby="ask-note"
                onChange={(e) => setQuestion(e.target.value)}
                onInput={resize}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(question);
                  }
                }}
              />
            </div>
            {started && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setExchanges([]);
                  setAnnouncement("Conversation cleared.");
                }}
              >
                Clear conversation
              </button>
            )}
            <button type="submit" className="btn" disabled={question.trim().length < 3 || loading}>
              {loading ? "Searching" : "Ask"}
            </button>
          </div>
          <p id="ask-note" className="ask-note">
            <span>{PRIVACY_HINT}</span>
            <span aria-hidden="true">
              {question.length}/{MAX_CHARS}
            </span>
          </p>
        </div>
      </form>
    </>
  );
}
