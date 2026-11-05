import ReportForm from "../components/ReportForm";

export const metadata = {
  title: "Report an issue | AccessMitra AI",
};

export default function Report() {
  return (
    <div className="narrow">
      <h1>Report an issue</h1>
      <p>
        Tell us about an incorrect or outdated answer, a broken official link, an accessibility barrier or any other problem. Please do
        not include Aadhaar numbers, medical documents, disability certificate numbers or other sensitive personal data.
      </p>
      <ReportForm />
    </div>
  );
}
