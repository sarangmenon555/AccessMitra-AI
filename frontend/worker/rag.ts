import * as guards from "./guards";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompts";
import { getSource, publicSource } from "./registry";
import { getSettings } from "./settings";
import {
  MODEL_UNAVAILABLE_TEXT,
  NOT_VERIFIED_TEXT,
  RETRIEVAL_FAILURE_TEXT,
  STATE_LABELS,
  UNVERIFIED_SOURCE_NOTE,
} from "./states";
import { Chunk, Env, ModelError, PublicSource, QueryResult, AnswerState, RetrievalError, SourceRecord } from "./types";

export async function embedText(env: Env, text: string): Promise<number[]> {
  const s = getSettings(env);
  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${s.hfModel}/pipeline/feature-extraction`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.HF_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) throw new Error(`embedding_http_${res.status}`);
  const result = (await res.json()) as unknown;
  if (Array.isArray(result) && Array.isArray(result[0])) {
    const first = result[0] as unknown[];
    if (Array.isArray(first[0])) {
      const rows = first as number[][];
      return rows[0].map((_, i) => rows.reduce((sum, row) => sum + row[i], 0) / rows.length);
    }
    return first as number[];
  }
  if (Array.isArray(result) && typeof result[0] === "number") return result as number[];
  throw new Error("embedding_unexpected_shape");
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function retrieve(env: Env, question: string, state: string | null): Promise<Chunk[]> {
  const s = getSettings(env);
  let matches: PineconeMatch[];
  try {
    const vector = await embedText(env, question);
    const geography = ["central"];
    if (state) geography.push(`state:${state}`);
    const res = await fetch(`${env.PINECONE_INDEX_HOST.replace(/\/$/, "")}/query`, {
      method: "POST",
      headers: {
        "Api-Key": env.PINECONE_API_KEY,
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2024-07",
      },
      body: JSON.stringify({
        vector,
        topK: s.topK,
        includeMetadata: true,
        filter: { geography: { $in: geography } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`pinecone_http_${res.status}`);
    const body = (await res.json()) as { matches?: PineconeMatch[] };
    matches = body.matches ?? [];
  } catch (err) {
    console.warn("retrieval_failed", err instanceof Error ? err.message : "unknown");
    throw new RetrievalError();
  }

  const chunks: Chunk[] = [];
  for (const m of matches) {
    if (m.score < s.minScore) continue;
    const meta = m.metadata ?? {};
    const source = getSource(String(meta.source_id ?? ""));
    const text = String(meta.text ?? "").trim();
    if (!source || !text) continue;
    chunks.push({ score: m.score, text, source, section: String(meta.section ?? "") });
  }
  return chunks;
}

export function assignMarkers(chunks: Chunk[]): Map<string, { source: SourceRecord; sections: string[] }> {
  const order: string[] = [];
  for (const c of chunks) if (!order.includes(c.source.source_id)) order.push(c.source.source_id);
  const markerFor = new Map(order.map((id, i) => [id, `S${i + 1}`]));
  const byMarker = new Map<string, { source: SourceRecord; sections: string[] }>();
  for (const c of chunks) {
    const marker = markerFor.get(c.source.source_id)!;
    c.marker = marker;
    const entry = byMarker.get(marker) ?? { source: c.source, sections: [] };
    if (c.section && !entry.sections.includes(c.section)) entry.sections.push(c.section);
    byMarker.set(marker, entry);
  }
  return byMarker;
}

export function formatEvidence(chunks: Chunk[]): string {
  return chunks
    .map((c) => {
      let header = `[${c.marker}] ${c.source.title} | ${c.source.authority} | geography: ${c.source.geography} | review status: ${c.source.status}`;
      if (c.section) header += ` | section: ${c.section}`;
      return `${header}\n${c.text}`;
    })
    .join("\n\n");
}

export async function callModel(
  env: Env,
  question: string,
  state: string | null,
  evidence: string,
): Promise<Record<string, unknown>> {
  const s = getSettings(env);
  let raw: string | null = null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: s.groqModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(question, state, evidence) },
        ],
        temperature: 0.1,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`groq_http_${res.status}`);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    raw = body.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("model_failed", err instanceof Error ? err.message : "unknown");
    throw new ModelError();
  }
  const parsed = guards.parseModelJson(raw);
  if (!parsed) {
    console.warn("model_output_unparseable");
    throw new ModelError();
  }
  return parsed;
}

export function buildResult(
  state: AnswerState,
  answer: string,
  sources: PublicSource[] = [],
  note: string | null = null,
): QueryResult {
  return { state, state_label: STATE_LABELS[state], answer, sources, note };
}

export function failureResult(kind: "retrieval" | "model"): QueryResult {
  return kind === "retrieval"
    ? buildResult("retrieval_failure", RETRIEVAL_FAILURE_TEXT)
    : buildResult("model_unavailable", MODEL_UNAVAILABLE_TEXT);
}

export async function answerQuestion(env: Env, question: string, state: string | null): Promise<QueryResult> {
  const chunks = await retrieve(env, question, state);
  if (chunks.length === 0) return buildResult("not_verified", NOT_VERIFIED_TEXT);

  const byMarker = assignMarkers(chunks);
  const validIds = new Set(byMarker.keys());
  const evidence = formatEvidence(chunks);
  const parsed = await callModel(env, question, state, evidence);

  let answer = String(parsed.answer ?? "").trim();
  const clarification = parsed.clarification ? String(parsed.clarification).trim() : null;
  const supported = parsed.supported === true;
  const conflict = parsed.conflict === true;

  const { good, bad } = guards.validateCitations(parsed.cited, validIds);
  if (bad.length) console.warn("invalid_citation_ids", bad.length);
  answer = guards.stripInvalidMarkers(answer, validIds);
  if (clarification && !answer) answer = clarification;

  if (supported && good.length === 0) return buildResult("not_verified", NOT_VERIFIED_TEXT);

  if (supported && !clarification) {
    const bad_numbers = guards.ungroundedNumbers(answer, evidence, question);
    if (bad_numbers.length) {
      console.warn("ungrounded_numbers", bad_numbers.length);
      return buildResult("not_verified", NOT_VERIFIED_TEXT);
    }
  }

  const citedSources: PublicSource[] = good.map((marker) => {
    const entry = byMarker.get(marker)!;
    return { ...publicSource(entry.source), marker, sections: entry.sections };
  });

  const finalState = guards.decideState({ answer, citedSources, clarification, conflict, supported });
  if (finalState === "not_verified") return buildResult("not_verified", NOT_VERIFIED_TEXT);
  const note = finalState === "possible_match" ? UNVERIFIED_SOURCE_NOTE : null;
  return buildResult(finalState, answer, citedSources, note);
}
