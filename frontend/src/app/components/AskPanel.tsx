"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import { ApiError, getStates, queryAI, type QueryResult } from "../lib/api";
import { EXPLORE_TILES, PRIVACY_HINT, SAMPLE_QUESTIONS } from "../lib/content";

interface Exchange {
  id: number;
  question: string;
  result?: QueryResult;
  error?: { message: string; retryable: boolean };
}

const MAX_CHARS = 500;

export default function AskPanel() {
  const [question, setQuestion] = useState("");
  const [region, setRegion] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [validation, setValidation] = useState("");
  const nextId = useRef(1);
  const lastAnswerHeading = useRef<HTMLHeadingElement | null>(null);
  const lastErrorRef = useRef<HTMLDivElement | null>(null);
  const [focusTarget, setFocusTarget] = useState<"answer" | "error" | null>(null);

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === "answer") lastAnswerHeading.current?.focus();
    if (focusTarget === "error") lastErrorRef.current?.focus();
    setFocusTarget(null);
  }, [focusTarget, exchanges]);

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (loading) return;
      if (text.length < 3) {
        setValidation("Please enter a question of at least three characters.");
        return;
      }
      setValidation("");
      const id = nextId.current++;
      setExchanges((prev) => [...prev, { id, question: text }]);
      setQuestion("");
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

  return (
    <>
      <section id="ask" aria-labelledby="ask-heading" className="section">
        <h2 id="ask-heading">Ask a question</h2>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <div className="field">
            <label htmlFor="question">Ask about a scheme, right or opportunity…</label>
            <p id="question-hint" className="hint">
              {PRIVACY_HINT}
            </p>
            <textarea
              id="question"
              name="question"
              value={question}
              maxLength={MAX_CHARS}
              onChange={(e) => setQuestion(e.target.value)}
              aria-describedby="question-hint question-count question-error"
              aria-invalid={validation ? true : undefined}
            />
            <p id="question-count" className="counter">
              {question.length} of {MAX_CHARS} characters
            </p>
            <p id="question-error" role="alert" className={validation ? "alert-box" : "sr-only"}>
              {validation}
            </p>
          </div>
          {states.length > 0 && (
            <div className="field">
              <label htmlFor="region">State or Union Territory (optional)</label>
              <p id="region-hint" className="hint">
                Choose one if your question depends on where you live.
              </p>
              <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} aria-describedby="region-hint">
                <option value="">Not specified</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="button-row">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Searching official sources" : "Ask"}
            </button>
            {exchanges.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setExchanges([]);
                  setValidation("");
                  setAnnouncement("Conversation cleared.");
                }}
              >
                Clear conversation
              </button>
            )}
          </div>
        </form>

        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        <div className="section" aria-label="Conversation">
          {exchanges.map((ex) => (
            <div key={ex.id} className="exchange">
              <div className="question-bubble">
                <span className="who">Your question</span>
                {ex.question}
              </div>
              {!ex.result && !ex.error && (
                <div className="status-box">
                  <p>Searching official sources. This can take up to a minute if the service is starting up.</p>
                </div>
              )}
              {ex.error && (
                <div
                  className="alert-box"
                  role="alert"
                  tabIndex={-1}
                  ref={ex.id === lastId ? lastErrorRef : undefined}
                >
                  <p>
                    <strong>Could not get an answer.</strong> {ex.error.message}
                  </p>
                  <p>
                    You can also check the official sources listed on the <a href="/sources">Sources page</a>.
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
                  ref={ex.id === lastId ? lastAnswerHeading : undefined}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="samples-heading" className="section">
        <h2 id="samples-heading">Sample questions</h2>
        <p>These questions use public information only. You do not need to share any personal documents.</p>
        <ul className="sample-list">
          {SAMPLE_QUESTIONS.map((q) => (
            <li key={q}>
              <button type="button" className="sample-btn" disabled={loading} onClick={() => ask(q)}>
                {q}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="explore-heading" className="section">
        <h2 id="explore-heading">What you can explore</h2>
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
    </>
  );
}
