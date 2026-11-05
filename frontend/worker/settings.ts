import type { Env } from "./types";

export interface Settings {
  groqModel: string;
  hfModel: string;
  topK: number;
  minScore: number;
  maxQueryChars: number;
  maxBodyBytes: number;
  rateLimitPerMinute: number;
  allowedOrigins: string[];
  feedbackTtlSeconds: number;
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) ? n : fallback;
}

export function getSettings(env: Env): Settings {
  return {
    groqModel: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    hfModel: env.HF_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
    topK: num(env.TOP_K, 6),
    minScore: num(env.MIN_SCORE, 0.3),
    maxQueryChars: num(env.MAX_QUERY_CHARS, 500),
    maxBodyBytes: num(env.MAX_BODY_BYTES, 8192),
    rateLimitPerMinute: num(env.RATE_LIMIT_PER_MINUTE, 12),
    allowedOrigins: (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean),
    feedbackTtlSeconds: Math.round(num(env.FEEDBACK_TTL_DAYS, 180) * 86400),
  };
}
