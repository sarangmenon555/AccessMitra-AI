import { ISSUES_URL } from "../lib/content";

export const metadata = {
  title: "Accessibility | AccessMitra AI",
};

export default function Accessibility() {
  return (
    <div className="narrow">
      <h1>Accessibility</h1>
      <p>AccessMitra AI aims to make its information-navigation experience usable by people with different access needs.</p>
      <p>
        The project is reviewing keyboard operation, visible focus, screen-reader labels, readable text, contrast, mobile layouts, clear
        error messages and the accessibility of dynamic chat responses.
      </p>

      <h2>Current status</h2>
      <p>
        <strong>Testing completed:</strong> None recorded yet. Manual testing with a screen reader, keyboard-only navigation and zoom
        has not been completed. Results will be listed here with the date and the device and software used.
      </p>
      <p>
        <strong>Design measures built in:</strong> a skip link, page landmarks, a single main heading per page, labelled form fields,
        visible keyboard focus, answer status given in words and not by colour alone, announcements for loading and new answers, and
        text that resizes with the browser.
      </p>
      <p>
        <strong>Known issues:</strong> None confirmed yet because testing is not complete. Source links open official government sites
        that the project does not control, and their accessibility may vary.
      </p>
      <p>
        <strong>Work in progress:</strong> testing with NVDA, Android TalkBack, keyboard only, browser accessibility tools and zoom at
        200 percent.
      </p>

      <h2>Report an accessibility barrier</h2>
      <p>
        If an interaction is difficult to use, please report the page or feature, what you were trying to do, the assistive technology
        or device involved if you are comfortable sharing it, and what happened. Please do not include sensitive personal information.
      </p>
      <p>
        <a href="/report?type=accessibility">Report an accessibility barrier</a>, or open an issue on{" "}
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <p>This statement describes the project's current testing and limitations. It is not an accessibility certification.</p>
    </div>
  );
}
