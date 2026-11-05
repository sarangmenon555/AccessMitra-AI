"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, submitFeedback, type FeedbackPayload } from "../lib/api";
import { ISSUES_URL } from "../lib/content";

type ReportType = FeedbackPayload["report_type"];

const TYPE_LABELS: Record<ReportType, string> = {
  incorrect_answer: "Report an incorrect or outdated answer",
  broken_link: "Report a broken official link",
  accessibility: "Report an accessibility barrier",
  other: "Something else",
};

export default function ReportForm() {
  const [type, setType] = useState<ReportType>("incorrect_answer");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("type");
    if (wanted && wanted in TYPE_LABELS) setType(wanted as ReportType);
  }, []);

  useEffect(() => {
    if (done || error) resultRef.current?.focus();
  }, [done, error]);

  const submit = async () => {
    setError("");
    if (message.trim().length < 5) {
      setError("Please describe the issue in at least a few words.");
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ report_type: type, message: message.trim(), context: context.trim() });
      setDone(true);
      setMessage("");
      setContext("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The report could not be sent. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="status-box" role="status" tabIndex={-1} ref={resultRef}>
        <h2>Report received</h2>
        <p>Thank you. Your report has been saved for review. You can send another report if needed.</p>
        <button type="button" className="btn btn-secondary" onClick={() => setDone(false)}>
          Send another report
        </button>
      </div>
    );
  }

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && (
        <div className="alert-box" role="alert" tabIndex={-1} ref={resultRef}>
          <p>{error}</p>
        </div>
      )}
      <div className="field">
        <label htmlFor="report-type">What would you like to report?</label>
        <select id="report-type" value={type} onChange={(e) => setType(e.target.value as ReportType)}>
          {(Object.keys(TYPE_LABELS) as ReportType[]).map((k) => (
            <option key={k} value={k}>
              {TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="report-context">Page, question or link concerned (optional)</label>
        <input
          id="report-context"
          type="text"
          maxLength={300}
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="report-message">Describe the issue</label>
        <p id="report-hint" className="hint">
          For accessibility reports, include the page or feature, what you were trying to do, and the assistive technology or device if you are comfortable sharing it. Please do not include Aadhaar numbers, medical documents, disability certificate numbers or other sensitive personal data.
        </p>
        <textarea
          id="report-message"
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="report-hint"
        />
      </div>
      <div className="button-row">
        <button type="submit" className="btn" disabled={sending}>
          {sending ? "Sending report" : "Send report"}
        </button>
      </div>
      <p className="hint">
        You can also open a public issue on{" "}
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        . Public issues are visible to everyone, so do not include personal information there.
      </p>
    </form>
  );
}
