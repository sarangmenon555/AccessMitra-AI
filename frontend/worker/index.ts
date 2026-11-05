import { handleFeedback, handleQuery, handleSources, handleStates } from "./handlers";
import { errorJson, json, originDecision, preflight, readLimitedBody, withCors } from "./http";
import { allowRequest } from "./ratelimit";
import { getSettings } from "./settings";
import type { Env } from "./types";

const LIMITED_PATHS = new Set(["/api/query", "/api/feedback"]);

export async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);

  const origin = originDecision(request, env);
  if (!origin.allowed) return errorJson(403, "invalid_input", "This origin is not allowed.");

  if (request.method === "OPTIONS") return preflight(origin.echo);

  let response: Response;
  if (request.method === "GET") {
    if (path === "/api/health") response = json({ status: "ok", service: "accessmitra-ai" });
    else if (path === "/api/sources") response = handleSources();
    else if (path === "/api/states") response = handleStates();
    else response = errorJson(404, "invalid_input", "Not found.");
    return withCors(response, origin.echo);
  }

  if (request.method === "POST" && LIMITED_PATHS.has(path)) {
    const body = await readLimitedBody(request, getSettings(env).maxBodyBytes);
    if (!body.ok) return withCors(errorJson(body.status, "invalid_input", "The request is too large."), origin.echo);

    if (!(await allowRequest(env, request))) {
      return withCors(
        errorJson(429, "rate_limited", "Too many requests. Please wait a moment and try again.", { "Retry-After": "30" }),
        origin.echo,
      );
    }
    response = path === "/api/query" ? await handleQuery(env, body.text) : await handleFeedback(env, body.text);
    return withCors(response, origin.echo);
  }

  return withCors(errorJson(405, "invalid_input", "Method not allowed."), origin.echo);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (err) {
      console.error("unhandled", err instanceof Error ? err.name : "unknown");
      return errorJson(500, "error", "Something went wrong. Please try again later.");
    }
  },
};
