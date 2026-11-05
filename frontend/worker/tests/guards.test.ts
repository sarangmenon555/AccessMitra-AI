import { describe, expect, it } from "vitest";
import * as g from "../guards";

describe("sensitive detection", () => {
  it("detects aadhaar-like numbers", () => {
    expect(g.detectSensitive("my number is 1234 5678 9012 which scheme applies")).toContain("aadhaar_like");
  });
  it("detects pan and card like values", () => {
    expect(g.detectSensitive("ABCDE1234F")).toContain("pan_like");
    expect(g.detectSensitive("4111 1111 1111 1111")).toContain("card_like");
  });
  it("leaves a normal question alone", () => {
    expect(g.detectSensitive("Where can I read the RPwD Act, 2016?")).toEqual([]);
  });
});

describe("state and text cleaning", () => {
  it("normalises states", () => {
    expect(g.normaliseState("kerala")).toBe("Kerala");
    expect(g.normaliseState("Atlantis")).toBeNull();
    expect(g.normaliseState(null)).toBeNull();
  });
  it("removes control characters", () => {
    expect(g.cleanText("a\x00b\x07c ")).toBe("abc");
  });
});

describe("figure grounding", () => {
  const context = "Loans up to Rs. 1,00,000 are described. Notification dated 05.05.2021.";
  it("accepts figures present in the evidence", () => {
    expect(g.ungroundedNumbers("Coverage is Rs. 1,00,000 [S1].", context, "")).toEqual([]);
  });
  it("flags figures absent from the evidence", () => {
    expect(g.ungroundedNumbers("Coverage is Rs. 5,00,000 [S1].", context, "")).toEqual(["500000"]);
  });
  it("ignores list and citation markers", () => {
    expect(g.ungroundedNumbers("1. First [S1]\n2. Second [S2]", "no digits", "")).toEqual([]);
  });
});

describe("citations", () => {
  it("rejects unknown ids", () => {
    const r = g.validateCitations(["S1", "S9", "[S2]"], new Set(["S1", "S2"]));
    expect(r.good).toEqual(["S1", "S2"]);
    expect(r.bad).toEqual(["S9"]);
  });
  it("strips invalid markers", () => {
    const out = g.stripInvalidMarkers("A [S1] B [S7]", new Set(["S1"]));
    expect(out).toContain("[S1]");
    expect(out).not.toContain("[S7]");
  });
});

describe("model json parsing", () => {
  it("handles plain, fenced and wrapped json", () => {
    expect(g.parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(g.parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(g.parseModelJson('text {"a":1} tail')).toEqual({ a: 1 });
    expect(g.parseModelJson("not json")).toBeNull();
    expect(g.parseModelJson("")).toBeNull();
  });
});

describe("state decision", () => {
  const unverified = { status: "needs_human_verification", last_checked: null };
  const verified = { status: "current", last_checked: "2026-10-01" };
  const base = { answer: "x", conflict: false, supported: true, clarification: null };
  it("covers the matrix", () => {
    expect(g.decideState({ ...base, citedSources: [unverified] })).toBe("possible_match");
    expect(g.decideState({ ...base, citedSources: [verified] })).toBe("supported");
    expect(g.decideState({ ...base, citedSources: [{ status: "current", last_checked: null }] })).toBe("possible_match");
    expect(g.decideState({ ...base, citedSources: [] })).toBe("not_verified");
    expect(g.decideState({ ...base, supported: false, citedSources: [unverified] })).toBe("not_verified");
    expect(g.decideState({ ...base, conflict: true, citedSources: [unverified] })).toBe("conflicting_evidence");
    expect(g.decideState({ ...base, clarification: "Which state?", citedSources: [unverified] })).toBe("clarification_needed");
  });
});
