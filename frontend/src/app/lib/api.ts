const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export type AnswerState =
  | "supported"
  | "possible_match"
  | "clarification_needed"
  | "conflicting_evidence"
  | "not_verified"
  | "retrieval_failure"
  | "sensitive_input"
  | "model_unavailable"
  | "rate_limited"
  | "invalid_input"
  | "error";

export interface SourceRecord {
  source_id: string;
  title: string;
  authority: string;
  url: string;
  type: string;
  geography: string;
  published_date: string | null;
  last_checked: string | null;
  next_review: string | null;
  status: string;
  notes?: string | null;
  marker?: string;
  sections?: string[];
}

export interface QueryResult {
  state: AnswerState;
  state_label: string;
  answer: string;
  sources: SourceRecord[];
  note: string | null;
}

export class ApiError extends Error {
  state: AnswerState;
  label: string;
  retryable: boolean;

  constructor(message: string, state: AnswerState, label: string, retryable: boolean) {
    super(message);
    this.state = state;
    this.label = label;
    this.retryable = retryable;
  }
}

async function request(path: string, init?: RequestInit, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      timedOut
        ? "The request took too long. The service may be starting up. Please try again in a moment."
        : "The service could not be reached. Please check your connection and try again.",
      "error",
      "Something went wrong. Please try again later.",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function readError(res: Response): Promise<ApiError> {
  let body: { state?: AnswerState; state_label?: string; detail?: string; answer?: string } = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  const state: AnswerState = body.state || (res.status === 429 ? "rate_limited" : "error");
  const label = body.state_label || "Something went wrong. Please try again later.";
  const detail = body.answer || body.detail || label;
  return new ApiError(detail, state, label, res.status >= 500 || res.status === 429);
}

export async function queryAI(query: string, state: string): Promise<QueryResult> {
  const res = await request("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, state: state || null }),
  });
  if (!res.ok) throw await readError(res);
  return res.json();
}

export async function getStates(): Promise<string[]> {
  try {
    const res = await request("/api/states", undefined, 15000);
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body.states) ? body.states : [];
  } catch {
    return [];
  }
}

export async function getSources(): Promise<{ sources: SourceRecord[]; total: number; verified_count: number }> {
  const res = await request("/api/sources", undefined, 30000);
  if (!res.ok) throw await readError(res);
  return res.json();
}

export interface FeedbackPayload {
  report_type: "incorrect_answer" | "broken_link" | "accessibility" | "other";
  message: string;
  context: string;
  source_id?: string | null;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const res = await request("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await readError(res);
}
