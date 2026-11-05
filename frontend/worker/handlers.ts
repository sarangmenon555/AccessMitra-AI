import * as guards from "./guards";
import { errorJson, json } from "./http";
import { answerQuestion, failureResult } from "./rag";
import { getSource, listPublicSources } from "./registry";
import { getSettings } from "./settings";
import { INDIAN_STATES_AND_UTS, SENSITIVE_TEXT, STATE_LABELS } from "./states";
import { Env, ModelError, RetrievalError } from "./types";

const REPORT_TYPES = ["incorrect_answer", "broken_link", "accessibility", "other"];

function parseObject(text: string): Record<string, unknown> | null {
  try {
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function handleQuery(env: Env, bodyText: string): Promise<Response> {
  const s = getSettings(env);
  const body = parseObject(bodyText);
  if (!body || typeof body.query !== "string") return errorJson(422, "invalid_input", "A question is required.");

  const query = guards.cleanText(body.query);
  if (query.length < 3) return errorJson(422, "invalid_input", "Question is too short.");
  if (query.length > s.maxQueryChars) return errorJson(422, "invalid_input", "Question is too long.");

  let state: string | null = null;
  if (body.state !== undefined && body.state !== null && body.state !== "") {
    state = typeof body.state === "string" ? guards.normaliseState(body.state) : null;
    if (!state) return errorJson(422, "invalid_input", "Unknown state or Union Territory.");
  }

  if (guards.detectSensitive(query).length) {
    return json({
      state: "sensitive_input",
      state_label: STATE_LABELS.sensitive_input,
      answer: SENSITIVE_TEXT,
      sources: [],
      note: null,
    });
  }

  try {
    return json(await answerQuestion(env, query, state));
  } catch (err) {
    if (err instanceof RetrievalError) return json(failureResult("retrieval"), 503);
    if (err instanceof ModelError) return json(failureResult("model"), 503);
    console.error("unexpected_query_error", err instanceof Error ? err.name : "unknown");
    return errorJson(500, "error", "Something went wrong. Please try again later.");
  }
}

export function handleSources(): Response {
  const sources = listPublicSources();
  return json({
    sources,
    total: sources.length,
    verified_count: sources.filter((x) => x.status === "current" && x.last_checked).length,
  });
}

export function handleStates(): Response {
  return json({ states: INDIAN_STATES_AND_UTS });
}

export async function handleFeedback(env: Env, bodyText: string): Promise<Response> {
  const body = parseObject(bodyText);
  if (!body) return errorJson(422, "invalid_input", "Invalid report.");

  const reportType = String(body.report_type ?? "");
  if (!REPORT_TYPES.includes(reportType)) return errorJson(422, "invalid_input", "Unknown report type.");

  const message = guards.cleanText(String(body.message ?? ""));
  if (message.length < 5) return errorJson(422, "invalid_input", "Please describe the issue in a few words.");
  if (message.length > 1000) return errorJson(422, "invalid_input", "Message is too long.");

  const context = guards.cleanText(String(body.context ?? ""));
  if (context.length > 300) return errorJson(422, "invalid_input", "Context is too long.");

  let sourceId: string | null = null;
  if (body.source_id) {
    sourceId = String(body.source_id);
    if (!getSource(sourceId)) return errorJson(422, "invalid_input", "Unknown source.");
  }

  if (guards.detectSensitive(message).length || guards.detectSensitive(context).length) {
    return errorJson(400, "sensitive_input", "The report appears to contain a sensitive identifier. Please remove it and submit again.");
  }

  const record = {
    received_at: new Date().toISOString(),
    report_type: reportType,
    message,
    context,
    source_id: sourceId,
  };
  try {
    await env.FEEDBACK.put(`fb:${record.received_at}:${crypto.randomUUID()}`, JSON.stringify(record), {
      expirationTtl: getSettings(env).feedbackTtlSeconds,
    });
  } catch (err) {
    console.error("feedback_write_failed", err instanceof Error ? err.name : "unknown");
    return errorJson(500, "error", "The report could not be saved. Please try again later.");
  }
  return json({ status: "received" });
}
