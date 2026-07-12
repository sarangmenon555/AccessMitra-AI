const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface QueryResponse {
  answer: string;
  sources: string[];
  categories: string[];
  confidence: number;
  chunks_used: number;
}

export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: string;
  tags: string[];
  summary: string;
  eligibility?: string;
  benefit?: string;
  how_to_apply?: string;
  portal: string;
  portal_label?: string;
  disability_types?: string[];
}

export interface EligibilityRequest {
  disability_type: string;
  age: number;
  income_lakh: number;
  employment_status: string;
  education_level: string;
  state: string;
}

export interface EligibilityMatch {
  id: string;
  name: string;
  summary: string;
  reason: string;
  priority: string;
  portal: string;
}

export interface Right {
  id: string;
  title: string;
  act_section: string;
  summary: string;
  details: string[];
  what_to_do_if_violated: string;
}

export interface Checklist {
  scheme_name: string;
  documents: string[];
  steps: string[];
  time_required: string;
  cost: string;
  portal: string;
}

export interface JobResource {
  id: string;
  name: string;
  type: string;
  description: string;
  url: string;
}

export async function queryAI(query: string): Promise<QueryResponse> {
  const res = await fetch(`${API_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: 6 }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Query failed");
  return res.json();
}

export async function getSchemes(): Promise<{ schemes: Scheme[]; categories: string[]; disability_types: string[] }> {
  const res = await fetch(`${API_URL}/api/schemes`);
  if (!res.ok) throw new Error("Failed to load schemes");
  return res.json();
}

export async function checkEligibility(data: EligibilityRequest): Promise<{ matches: EligibilityMatch[]; total: number }> {
  const res = await fetch(`${API_URL}/api/eligibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Eligibility check failed");
  return res.json();
}

export async function getRights(): Promise<{ rights: Right[] }> {
  const res = await fetch(`${API_URL}/api/rights`);
  if (!res.ok) throw new Error("Failed to load rights");
  return res.json();
}

export async function getChecklist(schemeId: string): Promise<Checklist> {
  const res = await fetch(`${API_URL}/api/checklist/${schemeId}`);
  if (!res.ok) throw new Error("Checklist not found");
  return res.json();
}

export async function getJobs(): Promise<{ resources: JobResource[] }> {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) throw new Error("Failed to load jobs");
  return res.json();
}

export async function exploreTopic(topic: string): Promise<QueryResponse & { topic: string }> {
  const res = await fetch(`${API_URL}/api/explore/${topic}`);
  if (!res.ok) throw new Error("Failed to explore topic");
  return res.json();
}

export async function submitFeedback(payload: { query: string; answer: string; rating: number }): Promise<void> {
  await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}