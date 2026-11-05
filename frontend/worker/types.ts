export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  ASSETS: Fetcher;
  FEEDBACK: KVNamespace;
  RATE_LIMITER?: RateLimiterBinding;
  GROQ_API_KEY: string;
  PINECONE_API_KEY: string;
  HF_API_KEY: string;
  PINECONE_INDEX_HOST: string;
  GROQ_MODEL?: string;
  HF_MODEL?: string;
  TOP_K?: string;
  MIN_SCORE?: string;
  MAX_QUERY_CHARS?: string;
  MAX_BODY_BYTES?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  ALLOWED_ORIGINS?: string;
  FEEDBACK_TTL_DAYS?: string;
}

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
  sections: string[];
  notes: string;
}

export interface PublicSource extends Omit<SourceRecord, "sections"> {
  marker?: string;
  sections?: string[];
}

export interface Chunk {
  score: number;
  text: string;
  source: SourceRecord;
  section: string;
  marker?: string;
}

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

export interface QueryResult {
  state: AnswerState;
  state_label: string;
  answer: string;
  sources: PublicSource[];
  note: string | null;
}

export class RetrievalError extends Error {}
export class ModelError extends Error {}
