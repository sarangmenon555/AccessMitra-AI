"use client";

import { useEffect, useState } from "react";
import { getSources, type SourceRecord } from "../lib/api";

const STATUS_TEXT: Record<string, string> = {
  current: "Current",
  needs_human_verification: "Needs human verification",
  needs_review: "Needs review",
  outdated: "Outdated",
  conflicting: "Conflicting",
  broken: "Broken",
};

export default function SourceRegister() {
  const [sources, setSources] = useState<SourceRecord[] | null>(null);
  const [verified, setVerified] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getSources()
      .then((d) => {
        setSources(d.sources);
        setVerified(d.verified_count);
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="alert-box" role="alert">
        <p>The source register could not be loaded right now. The official links above still work.</p>
      </div>
    );
  }
  if (!sources) {
    return (
      <div className="status-box" role="status">
        <p>Loading the source register.</p>
      </div>
    );
  }
  return (
    <>
      <p>
        {verified} of {sources.length} registered sources have been checked by a human reviewer. Sources not yet checked are still
        listed so that you can see what the project is built on.
      </p>
      <div className="table-wrap">
        <table>
          <caption>Source register</caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Issuing authority</th>
              <th scope="col">Type</th>
              <th scope="col">Scope</th>
              <th scope="col">Review status</th>
              <th scope="col">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.source_id}>
                <th scope="row">
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </th>
                <td>{s.authority}</td>
                <td>{s.type.replace(/_/g, " ")}</td>
                <td>{s.geography.replace("state:", "State: ")}</td>
                <td>{STATUS_TEXT[s.status] || s.status}</td>
                <td>{s.last_checked || "Not yet checked"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
