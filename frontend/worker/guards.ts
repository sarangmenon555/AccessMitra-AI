import { INDIAN_STATES_AND_UTS } from "./states";
import type { AnswerState, PublicSource } from "./types";

const AADHAAR_RE = /(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/;
const PAN_RE = /\b[A-Za-z]{5}\d{4}[A-Za-z]\b/;
const CARD_RE = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/;
const CONTROL_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
const MARKER_RE = /\[S(\d+)\]/g;
const NUMBER_RE = /\d[\d,]*(?:\.\d+)?/g;
const LIST_MARKER_RE = /^\s*\d{1,2}[.)]\s/gm;

export function cleanText(value: string): string {
  return value.replace(CONTROL_RE, "").trim();
}

export function detectSensitive(text: string): string[] {
  const found: string[] = [];
  if (AADHAAR_RE.test(text)) found.push("aadhaar_like");
  if (PAN_RE.test(text)) found.push("pan_like");
  if (CARD_RE.test(text)) found.push("card_like");
  return found;
}

export function normaliseState(value: string | null | undefined): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  return INDIAN_STATES_AND_UTS.find((s) => s.toLowerCase() === wanted) ?? null;
}

function normaliseNumber(token: string): string {
  return token.replace(/,/g, "").replace(/\.$/, "");
}

export function extractNumbers(text: string): Set<string> {
  const stripped = text.replace(MARKER_RE, " ").replace(LIST_MARKER_RE, " ");
  const out = new Set<string>();
  for (const m of stripped.match(NUMBER_RE) ?? []) out.add(normaliseNumber(m));
  return out;
}

export function ungroundedNumbers(answer: string, context: string, query: string): string[] {
  const allowed = new Set([...extractNumbers(context), ...extractNumbers(query)]);
  return [...extractNumbers(answer)].filter((n) => n && !allowed.has(n)).sort();
}

export function parseModelJson(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/, "").replace(/`+$/, "").trim();
  }
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const data = JSON.parse(s);
      return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(text);
  if (direct) return direct;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return tryParse(text.slice(start, end + 1));
}

export function validateCitations(cited: unknown, validIds: Set<string>): { good: string[]; bad: string[] } {
  const good: string[] = [];
  const bad: string[] = [];
  if (!Array.isArray(cited)) return { good, bad };
  for (const item of cited) {
    const id = String(item).trim().replace(/^\[|\]$/g, "");
    if (validIds.has(id)) {
      if (!good.includes(id)) good.push(id);
    } else {
      bad.push(id);
    }
  }
  return { good, bad };
}

export function stripInvalidMarkers(answer: string, validIds: Set<string>): string {
  return answer.replace(MARKER_RE, (whole, n) => (validIds.has(`S${n}`) ? whole : ""));
}

export function decideState(args: {
  answer: string;
  citedSources: Pick<PublicSource, "status" | "last_checked">[];
  clarification: string | null;
  conflict: boolean;
  supported: boolean;
}): AnswerState {
  if (args.clarification) return "clarification_needed";
  if (!args.supported || args.citedSources.length === 0 || !args.answer.trim()) return "not_verified";
  if (args.conflict) return "conflicting_evidence";
  const allCurrent = args.citedSources.every((s) => s.status === "current" && s.last_checked);
  return allCurrent ? "supported" : "possible_match";
}
