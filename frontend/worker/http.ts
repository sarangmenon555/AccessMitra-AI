import { getSettings } from "./settings";
import { STATE_LABELS } from "./states";
import type { AnswerState, Env } from "./types";

export function securityHeaders(headers: Headers): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cache-Control", "no-store");
}

export function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", ...extra });
  securityHeaders(headers);
  return new Response(JSON.stringify(body), { status, headers });
}

export function errorJson(status: number, state: AnswerState, detail: string, extra?: Record<string, string>): Response {
  return json({ state, state_label: STATE_LABELS[state], detail }, status, extra);
}

export function originDecision(request: Request, env: Env): { allowed: boolean; echo: string | null } {
  const origin = request.headers.get("Origin");
  if (!origin) return { allowed: true, echo: null };
  const own = new URL(request.url).origin;
  if (origin === own) return { allowed: true, echo: null };
  const list = getSettings(env).allowedOrigins;
  if (list.includes(origin)) return { allowed: true, echo: origin };
  return { allowed: false, echo: null };
}

export function withCors(response: Response, echo: string | null): Response {
  if (!echo) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", echo);
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

export function preflight(echo: string | null): Response {
  const headers = new Headers();
  if (echo) {
    headers.set("Access-Control-Allow-Origin", echo);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "600");
    headers.set("Vary", "Origin");
  }
  securityHeaders(headers);
  return new Response(null, { status: 204, headers });
}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const declared = request.headers.get("Content-Length");
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) return { ok: false, status: 413 };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return { ok: false, status: 413 };
  return { ok: true, text };
}
