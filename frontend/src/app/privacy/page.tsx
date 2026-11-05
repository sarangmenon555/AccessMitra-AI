import { ISSUES_URL, PRIVACY_LAST_UPDATED } from "../lib/content";

export const metadata = {
  title: "Privacy notice | AccessMitra AI",
};

export default function Privacy() {
  return (
    <div className="narrow">
      <h1>Privacy notice</h1>
      <p>
        <strong>Last updated:</strong> {PRIVACY_LAST_UPDATED}. This notice describes what the current version of the application code
        does.
      </p>
      <p>
        <strong>Project contact:</strong> use the <a href="/report">Report an issue</a> page, or open an issue on{" "}
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        . Public GitHub issues are visible to everyone, so do not include personal information there.
      </p>
      <p>AccessMitra AI is an independent, student-developed project. This notice explains how information is handled when you use the application.</p>

      <h2>Information processed</h2>
      <ul>
        <li>The question you type and the optional state or Union Territory you choose, which are sent to the project's server to produce an answer.</li>
        <li>Reports you submit through the Report an issue page: the report type, your description, any page or link you mention, and the time received.</li>
        <li>Technical request data that Cloudflare processes to deliver the service, such as IP address and request time. The server uses the IP address only to limit repeated requests and does not store it.</li>
      </ul>
      <p>The application has no user accounts, no sign-in, no file uploads and no conversation history stored on the server. Your conversation is kept in your browser window only and is cleared when you choose Clear conversation or close the page.</p>

      <h2>AI and third-party services</h2>
      <p>To answer a question, the server sends it to the following services:</p>
      <ul>
        <li>Hugging Face, to convert your question into a numerical representation used for searching.</li>
        <li>Pinecone, to search the project's collection of source summaries using that numerical representation.</li>
        <li>Groq, which runs the language model that writes the answer. It receives your question, your optional state, and the retrieved source passages.</li>
      </ul>
      <p>Each of these providers handles data under its own terms. The project does not send names, accounts or uploaded documents to them because it does not collect those.</p>

      <h2>Storage and retention</h2>
      <p>Questions are not written to the project's storage or log files by the application code. Reports from the Report an issue page are saved in Cloudflare's key-value storage and are deleted automatically after 180 days, or earlier if a maintainer removes them. This version of the code includes no analytics or error-tracking tools. Cloudflare hosts the website and the server code and may keep its own technical logs.</p>

      <h2>Sensitive information</h2>
      <p>Please avoid entering Aadhaar numbers, disability certificate numbers, medical records, financial account details or other sensitive personal information. AccessMitra AI should not need such details to answer general information-navigation questions. If a question or report appears to contain a number that looks like an Aadhaar, PAN or card number, the server does not process or save it.</p>

      <h2>Children and consent</h2>
      <p>The project is a public information tool and has not been designed or tested for use with children. It does not collect ages. Before any pilot involving children or sensitive data, appropriate guidance, informed consent and suitable oversight would be put in place.</p>

      <h2>Your choices and requests</h2>
      <p>To ask a question about data handling, or to request correction or deletion of a report you submitted, contact the project through the Report an issue page and describe the report. Because reports are not linked to an account, a request can only be matched to a report by its content and approximate date.</p>

      <h2>Security</h2>
      <p>The server limits request size and request rate, accepts requests only from the project's own website, and does not show internal error details to users. API keys are held as encrypted secrets on the server and are never sent to your browser. No online service can promise absolute security.</p>

      <h2>Changes</h2>
      <p>This notice may change as the application evolves. The current version and its last-updated date are shown at the top of this page.</p>
    </div>
  );
}
