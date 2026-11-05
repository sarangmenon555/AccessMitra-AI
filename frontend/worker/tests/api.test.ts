import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../index";
import { resetMemoryLimiter } from "../ratelimit";
import type { Env } from "../types";

const HOST = "https://index.example.pinecone.io";

function makeEnv(over: Partial<Env> = {}) {
  const store = new Map<string, string>();
  const env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) } as unknown as Fetcher,
    FEEDBACK: {
      put: async (k: string, v: string) => {
        store.set(k, v);
      },
    } as unknown as KVNamespace,
    GROQ_API_KEY: "g",
    PINECONE_API_KEY: "p",
    HF_API_KEY: "h",
    PINECONE_INDEX_HOST: HOST,
    ALLOWED_ORIGINS: "http://localhost:3000",
    ...over,
  } as Env;
  return { env, store };
}

interface Mock {
  matches?: { id: string; score: number; metadata: Record<string, unknown> }[];
  model?: Record<string, unknown> | "fail";
  embed?: "fail";
  pinecone?: "fail";
}

function chunk(text = "Loans up to Rs. 1,00,000 are described.", sourceId = "SRC-008") {
  return { id: "1", score: 0.8, metadata: { text, source_id: sourceId, section: "Project summary" } };
}

function mockFetch(m: Mock) {
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("huggingface")) {
      if (m.embed === "fail") return new Response("no", { status: 500 });
      return new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200 });
    }
    if (url.startsWith(HOST)) {
      if (m.pinecone === "fail") return new Response("no", { status: 500 });
      return new Response(JSON.stringify({ matches: m.matches ?? [] }), { status: 200 });
    }
    if (url.includes("groq.com")) {
      if (m.model === "fail" || !m.model) return new Response("no", { status: 500 });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(m.model) } }] }), { status: 200 });
    }
    return new Response("unexpected", { status: 500 });
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://site.example${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const good = { answer: "Loans up to Rs. 1,00,000 are described [S1].", cited: ["S1"], supported: true, conflict: false, clarification: null };

beforeEach(() => resetMemoryLimiter());
afterEach(() => vi.unstubAllGlobals());

describe("routing", () => {
  it("serves health", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(new Request("https://site.example/api/health"), env);
    expect((await r.json() as { status: string }).status).toBe("ok");
  });
  it("passes non-api paths to assets", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(new Request("https://site.example/about/"), env);
    expect(await r.text()).toBe("asset");
  });
  it("returns 404 for unknown api path", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(new Request("https://site.example/api/nothing"), env);
    expect(r.status).toBe(404);
  });
  it("sets security headers", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(new Request("https://site.example/api/health"), env);
    expect(r.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("origin and cors", () => {
  it("blocks an unlisted origin", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(post("/api/query", { query: "UDID info" }, { Origin: "https://evil.example" }), env);
    expect(r.status).toBe(403);
  });
  it("allows the site's own origin", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [] });
    const r = await worker.fetch(post("/api/query", { query: "UDID info" }, { Origin: "https://site.example" }), env);
    expect(r.status).toBe(200);
  });
  it("allows a listed dev origin with cors headers", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(
      new Request("https://site.example/api/sources", { headers: { Origin: "http://localhost:3000" } }),
      env,
    );
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });
});

describe("input validation", () => {
  it("rejects short, long and malformed input", async () => {
    const { env } = makeEnv();
    expect((await worker.fetch(post("/api/query", { query: "  " }), env)).status).toBe(422);
    expect((await worker.fetch(post("/api/query", { query: "a".repeat(600) }), env)).status).toBe(422);
    expect((await worker.fetch(post("/api/query", "not json"), env)).status).toBe(422);
    expect((await worker.fetch(post("/api/query", { query: 5 }), env)).status).toBe(422);
  });
  it("rejects an oversized body", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(post("/api/query", { query: "a".repeat(20000) }), env);
    expect(r.status).toBe(413);
  });
  it("rejects an unknown state", async () => {
    const { env } = makeEnv();
    const r = await worker.fetch(post("/api/query", { query: "UDID info", state: "Atlantis" }), env);
    expect(r.status).toBe(422);
  });
});

describe("sensitive input", () => {
  it("does not call any service or echo the number", async () => {
    const { env } = makeEnv();
    const spy = mockFetch({});
    const r = await worker.fetch(post("/api/query", { query: "1234 5678 9012 which scheme applies to me" }), env);
    const text = await r.text();
    expect(JSON.parse(text).state).toBe("sensitive_input");
    expect(text).not.toContain("1234");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("answer pipeline", () => {
  it("returns possible_match for unverified sources", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: good });
    const body = await (await worker.fetch(post("/api/query", { query: "What do NHFDC loans offer?" }), env)).json() as any;
    expect(body.state).toBe("possible_match");
    expect(body.sources[0].marker).toBe("S1");
    expect(body.note).toBeTruthy();
  });
  it("abstains on an invented citation id", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: { ...good, answer: "Something [S9].", cited: ["S9"] } });
    const body = await (await worker.fetch(post("/api/query", { query: "Tell me about a scheme" }), env)).json() as any;
    expect(body.state).toBe("not_verified");
  });
  it("abstains on an invented figure", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: { ...good, answer: "Loans up to Rs. 9,99,999 [S1]." } });
    const body = await (await worker.fetch(post("/api/query", { query: "What is the loan limit?" }), env)).json() as any;
    expect(body.state).toBe("not_verified");
  });
  it("does not call the model when nothing is retrieved", async () => {
    const { env } = makeEnv();
    const spy = mockFetch({ matches: [] });
    const body = await (await worker.fetch(post("/api/query", { query: "Tell me about a made up scheme" }), env)).json() as any;
    expect(body.state).toBe("not_verified");
    expect(spy.mock.calls.some((c) => String(c[0]).includes("groq.com"))).toBe(false);
  });
  it("ignores vectors whose source is not registered", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk("Old wiki text", "WIKI-1")], model: good });
    const body = await (await worker.fetch(post("/api/query", { query: "Anything about disability" }), env)).json() as any;
    expect(body.state).toBe("not_verified");
  });
  it("returns clarification_needed", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: { answer: "", cited: [], supported: false, conflict: false, clarification: "Which state or Union Territory?" } });
    const body = await (await worker.fetch(post("/api/query", { query: "Which authority handles my issue?" }), env)).json() as any;
    expect(body.state).toBe("clarification_needed");
    expect(body.answer.toLowerCase()).toContain("state");
  });
  it("returns conflicting_evidence", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: { ...good, conflict: true } });
    const body = await (await worker.fetch(post("/api/query", { query: "Two sources differ, which applies?" }), env)).json() as any;
    expect(body.state).toBe("conflicting_evidence");
  });
});

describe("failures", () => {
  it("retrieval failure returns a safe 503", async () => {
    const { env } = makeEnv();
    mockFetch({ pinecone: "fail" });
    const r = await worker.fetch(post("/api/query", { query: "Where can I read the RPwD Act?" }), env);
    expect(r.status).toBe(503);
    expect((await r.json() as any).state).toBe("retrieval_failure");
  });
  it("embedding failure counts as retrieval failure", async () => {
    const { env } = makeEnv();
    mockFetch({ embed: "fail" });
    const r = await worker.fetch(post("/api/query", { query: "Where can I read the RPwD Act?" }), env);
    expect((await r.json() as any).state).toBe("retrieval_failure");
  });
  it("model failure returns a safe 503 with no answer text from the model", async () => {
    const { env } = makeEnv();
    mockFetch({ matches: [chunk()], model: "fail" });
    const r = await worker.fetch(post("/api/query", { query: "Where can I read the RPwD Act?" }), env);
    const body = await r.json() as any;
    expect(r.status).toBe(503);
    expect(body.state).toBe("model_unavailable");
    expect(JSON.stringify(body)).not.toMatch(/stack|Error:/);
  });
});

describe("rate limiting", () => {
  it("uses the binding when present", async () => {
    const { env } = makeEnv({ RATE_LIMITER: { limit: async () => ({ success: false }) } });
    const r = await worker.fetch(post("/api/query", { query: "UDID info" }), env);
    expect(r.status).toBe(429);
    expect(r.headers.get("Retry-After")).toBeTruthy();
  });
  it("falls back to the in-memory limiter", async () => {
    const { env } = makeEnv({ RATE_LIMIT_PER_MINUTE: "2" });
    mockFetch({ matches: [] });
    const codes: number[] = [];
    for (let i = 0; i < 4; i++) codes.push((await worker.fetch(post("/api/query", { query: "UDID info" }, { "CF-Connecting-IP": "1.2.3.4" }), env)).status);
    expect(codes).toEqual([200, 200, 429, 429]);
  });
});

describe("sources and feedback", () => {
  it("lists sources with no verified entries", async () => {
    const { env } = makeEnv();
    const body = await (await worker.fetch(new Request("https://site.example/api/sources"), env)).json() as any;
    expect(body.total).toBeGreaterThanOrEqual(10);
    expect(body.verified_count).toBe(0);
  });
  it("stores a report", async () => {
    const { env, store } = makeEnv();
    const r = await worker.fetch(post("/api/feedback", { report_type: "broken_link", message: "The UDID link does not open", source_id: "SRC-001" }), env);
    expect(r.status).toBe(200);
    expect(store.size).toBe(1);
    expect(JSON.parse([...store.values()][0]).report_type).toBe("broken_link");
  });
  it("rejects sensitive identifiers and bad types", async () => {
    const { env, store } = makeEnv();
    expect((await worker.fetch(post("/api/feedback", { report_type: "other", message: "my aadhaar is 1234 5678 9012" }), env)).status).toBe(400);
    expect((await worker.fetch(post("/api/feedback", { report_type: "spam", message: "hello there" }), env)).status).toBe(422);
    expect(store.size).toBe(0);
  });
  it("hides storage errors", async () => {
    const { env } = makeEnv({ FEEDBACK: { put: async () => { throw new Error("kv secret"); } } as unknown as KVNamespace });
    const r = await worker.fetch(post("/api/feedback", { report_type: "other", message: "something is wrong" }), env);
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("kv secret");
  });
});
