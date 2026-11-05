import { getSettings } from "./settings";
import type { Env } from "./types";

const memory = new Map<string, number[]>();

export function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || "unknown";
}

function memoryLimit(key: string, limit: number, windowMs: number, now: number): boolean {
  const hits = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 2000) {
    for (const [k, v] of memory) if (!v.length || now - v[v.length - 1] > windowMs) memory.delete(k);
  }
  return true;
}

export async function allowRequest(env: Env, request: Request): Promise<boolean> {
  const key = clientKey(request);
  if (env.RATE_LIMITER) {
    try {
      const { success } = await env.RATE_LIMITER.limit({ key });
      return success;
    } catch {
      return memoryLimit(key, getSettings(env).rateLimitPerMinute, 60000, Date.now());
    }
  }
  return memoryLimit(key, getSettings(env).rateLimitPerMinute, 60000, Date.now());
}

export function resetMemoryLimiter(): void {
  memory.clear();
}
