"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, FileText, CheckSquare, Briefcase, Shield,
  ChevronRight, ThumbsUp, ThumbsDown, RotateCcw,
  AlertCircle, ExternalLink, User, Sparkles,
  ArrowRight, X, Check, ArrowUpRight, Home as HomeIcon,
} from "lucide-react";
import {
  queryAI, getSchemes, checkEligibility, getRights, getChecklist,
  getJobs, exploreTopic, submitFeedback,
  type Scheme, type EligibilityMatch, type Right,
  type Checklist, type JobResource,
} from "./lib/api";

type Tab = "chat" | "eligibility" | "schemes" | "rights" | "jobs" | "checklist";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  confidence?: number;
  query?: string;
  rated?: boolean;
}

const DISABILITY_TYPES = [
  "locomotor", "visual", "hearing", "intellectual",
  "mental", "autism", "cerebral palsy", "multiple", "speech",
];

const EMPLOYMENT_OPTIONS = [
  "unemployed", "employed", "self-employed", "job-seeking", "student", "retired",
];

const EDUCATION_OPTIONS = [
  "below class 9", "class 9", "class 10", "class 11",
  "class 12", "graduate", "post-graduate", "diploma",
];

const QUICK_QUESTIONS = [
  { q: "What is the UDID card and how do I apply?", cat: "Identity" },
  { q: "What schemes am I eligible for as a person with locomotor disability?", cat: "Schemes" },
  { q: "How does the Niramaya health insurance scheme work?", cat: "Health" },
  { q: "What is the 4% job reservation under RPWD Act 2016?", cat: "Employment" },
  { q: "How do I apply for NHFDC loan?", cat: "Finance" },
  { q: "What scholarships are available for differently-abled students?", cat: "Education" },
  { q: "What are my rights under the RPWD Act 2016?", cat: "Rights" },
  { q: "How do I get free assistive devices like wheelchair or hearing aid?", cat: "Assistive" },
];

const STATS = [
  { value: "2.68Cr", label: "Differently-abled Indians" },
  { value: "21", label: "Recognised disabilities" },
  { value: "10+", label: "Central schemes" },
  { value: "4%", label: "Govt job reservation" },
];

const EXPLORE_TOPICS = [
  { key: "udid", label: "UDID Card" },
  { key: "schemes", label: "All Schemes" },
  { key: "rpwd", label: "RPWD Act" },
  { key: "jobs", label: "Jobs & Reservation" },
  { key: "education", label: "Education" },
  { key: "health", label: "Health Insurance" },
  { key: "finance", label: "Loans & Finance" },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Home", icon: <HomeIcon size={14} /> },
  { id: "eligibility", label: "Check Eligibility", icon: <User size={14} /> },
  { id: "schemes", label: "Schemes", icon: <FileText size={14} /> },
  { id: "rights", label: "Your Rights", icon: <Shield size={14} /> },
  { id: "jobs", label: "Jobs", icon: <Briefcase size={14} /> },
  { id: "checklist", label: "Checklist", icon: <CheckSquare size={14} /> },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const [rights, setRights] = useState<Right[]>([]);
  const [selectedRight, setSelectedRight] = useState<Right | null>(null);

  const [jobs, setJobs] = useState<JobResource[]>([]);

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [checklistScheme, setChecklistScheme] = useState("");

  const [eligibilityForm, setEligibilityForm] = useState({
    disability_type: "",
    age: 25,
    income_lakh: 1.5,
    employment_status: "",
    education_level: "",
    state: "",
  });
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityMatch[] | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [exploreResult, setExploreResult] = useState<(ReturnType<typeof exploreTopic> extends Promise<infer T> ? T : never) | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getSchemes().then((d) => setSchemes(d.schemes)).catch(() => {});
    getRights().then((d) => setRights(d.rights)).catch(() => {});
    getJobs().then((d) => setJobs(d.resources)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuery = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query || loading) return;
    setError(null);
    setTab("chat");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: query }]);
    setInput("");
    setLoading(true);
    try {
      const result = await queryAI(query);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        query,
        rated: false,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleEligibility = async () => {
    if (!eligibilityForm.disability_type || !eligibilityForm.employment_status) return;
    setEligibilityLoading(true);
    setEligibilityResult(null);
    try {
      const result = await checkEligibility({ ...eligibilityForm, state: eligibilityForm.state || "All India" });
      setEligibilityResult(result.matches);
    } catch {
      setError("Eligibility check failed. Please try again.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleChecklist = async (schemeId: string) => {
    setTab("checklist");
    setChecklistScheme(schemeId);
    setChecklist(null);
    try {
      const result = await getChecklist(schemeId);
      setChecklist(result);
    } catch {
      setError("Checklist not available for this scheme.");
    }
  };

  const handleExplore = async (topic: string) => {
    setActiveTopic(topic);
    setExploreResult(null);
    setExploreLoading(true);
    try {
      const result = await exploreTopic(topic);
      setExploreResult(result);
    } catch {
      setError("Failed to load topic.");
    } finally {
      setExploreLoading(false);
    }
  };

  const handleRate = (msg: Message, good: boolean) => {
    if (msg.rated || !msg.query) return;
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, rated: true } : m));
    submitFeedback({ query: msg.query!, answer: msg.content, rating: good ? 5 : 2 }).catch(() => {});
  };

  const filteredSchemes = schemeFilter === "all"
    ? schemes
    : schemes.filter((s) => s.category === schemeFilter);

  const schemeCategories = ["all", ...Array.from(new Set(schemes.map((s) => s.category)))];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-50"
        style={{ background: "rgba(13,51,32,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-black text-sm"
              style={{ background: "var(--amber)", color: "var(--bg)" }}
            >
              AM
            </div>
            <div>
              <p className="font-display font-bold text-base leading-none" style={{ color: "var(--text-primary)" }}>
                AccessMitra AI
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Your AI Companion for Opportunities
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all font-display"
                style={{
                  background: tab === t.id ? "rgba(245,158,11,0.12)" : "transparent",
                  color: tab === t.id ? "var(--amber)" : "var(--text-secondary)",
                  border: tab === t.id ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          <div className="md:hidden flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: tab === t.id ? "rgba(245,158,11,0.12)" : "var(--bg-card)",
                  color: tab === t.id ? "var(--amber)" : "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex gap-8">
        <aside className="hidden xl:flex flex-col gap-5 w-60 shrink-0">
          <div className="card rounded-2xl p-5">
            <p className="font-display font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--amber)" }}>
              Quick Questions
            </p>
            <div className="flex flex-col gap-0.5">
              {QUICK_QUESTIONS.slice(0, 5).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuery(q.q)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg transition-all leading-snug group"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }}
                >
                  {q.q}
                </button>
              ))}
            </div>
          </div>

          <div className="card rounded-2xl p-5">
            <p className="font-display font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--amber)" }}>
              Explore Topics
            </p>
            <div className="flex flex-col gap-0.5">
              {EXPLORE_TOPICS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleExplore(t.key)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTopic === t.key ? "rgba(245,158,11,0.1)" : "transparent",
                    color: activeTopic === t.key ? "var(--amber)" : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTopic !== t.key) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTopic !== t.key) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  {t.label}
                  <ChevronRight size={12} />
                </button>
              ))}
            </div>
          </div>

          <div className="card-amber rounded-2xl p-5">
            <p className="font-display font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--amber)" }}>
              Key Numbers
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATS.map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(245,158,11,0.06)" }}>
                  <p className="font-display font-black text-lg" style={{ color: "var(--amber)" }}>{s.value}</p>
                  <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}>
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {tab === "chat" && (
            <div className="flex flex-col gap-6">
              {messages.length === 0 && (
                <div className="space-y-8">
                  <div className="relative pt-6 pb-2">
                    <div className="hero-glow top-0 left-1/2 -translate-x-1/2" />
                    <div className="relative">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-display mb-6"
                        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--amber)" }}
                      >
                        <Sparkles size={11} />
                        AI-Powered — Verified Government Sources
                      </div>
                      <h1 className="font-display font-black leading-none mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em" }}>
                        <span style={{ color: "var(--text-primary)" }}>Every differently-abled</span>
                        <br />
                        <span className="amber-gradient">deserves their rights.</span>
                        <br />
                        <span className="amber-gradient">Let's find yours.</span>
                      </h1>
                      <p className="text-base max-w-xl" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        Every response is based on verified government sources including MSJE, RPWD Act 2016, and official scheme documents.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STATS.map((s, i) => (
                      <div key={i} className="card-amber rounded-2xl p-4">
                        <p className="font-display font-black text-2xl" style={{ color: "var(--amber)" }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p
                      className="font-display font-bold text-xs uppercase tracking-widest mb-4"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Common questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuery(q.q)}
                          className="card rounded-xl p-4 text-left group transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>{q.q}</p>
                            <ArrowRight
                              size={14}
                              className="shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                              style={{ color: "var(--amber)" }}
                            />
                          </div>
                          <span className="tag tag-amber mt-3 inline-block">{q.cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(exploreLoading || exploreResult) && (
                    <div className="card rounded-2xl p-6">
                      {exploreLoading && (
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full dot-pulse"
                                style={{ background: "var(--amber)", animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            Loading {activeTopic} overview...
                          </span>
                        </div>
                      )}
                      {exploreResult && !exploreLoading && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <p className="font-display font-bold capitalize" style={{ color: "var(--amber)" }}>
                              {activeTopic} Overview
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleQuery(`Tell me more about ${activeTopic} for differently-abled persons in India`)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
                                style={{ background: "rgba(245,158,11,0.1)", color: "var(--amber)", border: "1px solid rgba(245,158,11,0.2)" }}
                              >
                                <Sparkles size={11} /> Ask more
                              </button>
                              <button onClick={() => { setExploreResult(null); setActiveTopic(""); }}>
                                <X size={14} style={{ color: "var(--text-muted)" }} />
                              </button>
                            </div>
                          </div>
                          <div className="prose-mitra text-sm whitespace-pre-wrap">{exploreResult.answer}</div>
                          {exploreResult.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                              {exploreResult.sources.map((s, i) => (
                                <span key={i} className="tag tag-green">{s}</span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-up`}>
                    {msg.role === "user" ? (
                      <div
                        className="max-w-[80%] px-5 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                        style={{ background: "var(--bg-card-hover)", border: "1px solid rgba(245,158,11,0.15)", color: "var(--text-primary)" }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full card rounded-2xl rounded-tl-sm p-5 space-y-4">
                        <div className="prose-mitra text-sm whitespace-pre-wrap">{msg.content}</div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                            <p className="font-display font-bold text-xs uppercase tracking-widest mb-2" style={{ color: "var(--amber)", opacity: 0.7 }}>
                              Sources
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((s, i) => (
                                <span key={i} className="tag tag-green">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.confidence !== undefined && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.round(msg.confidence * 100)}%`, background: "var(--amber)" }}
                                />
                              </div>
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {Math.round(msg.confidence * 100)}% match
                              </span>
                            </div>
                            {!msg.rated ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Helpful?</span>
                                <button onClick={() => handleRate(msg, true)} className="p-1 rounded transition-colors hover:text-green-400" style={{ color: "var(--text-muted)" }}>
                                  <ThumbsUp size={13} />
                                </button>
                                <button onClick={() => handleRate(msg, false)} className="p-1 rounded transition-colors hover:text-red-400" style={{ color: "var(--text-muted)" }}>
                                  <ThumbsDown size={13} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Thanks</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="card rounded-2xl rounded-tl-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full dot-pulse"
                            style={{ background: "var(--amber)", animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Searching verified scheme database...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuery(q.q)}
                      className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      {q.q.length > 45 ? q.q.slice(0, 45) + "…" : q.q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "eligibility" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Check Your <span className="amber-gradient">Eligibility</span>
                </h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  Answer a few questions to instantly see which schemes and benefits you qualify for
                </p>
              </div>

              <div className="card rounded-2xl p-6 space-y-6">
                <div className="space-y-3">
                  <label className="font-display font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    Type of Disability
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DISABILITY_TYPES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setEligibilityForm((f) => ({ ...f, disability_type: d }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                          background: eligibilityForm.disability_type === d ? "rgba(245,158,11,0.15)" : "var(--bg-card-hover)",
                          color: eligibilityForm.disability_type === d ? "var(--amber)" : "var(--text-secondary)",
                          border: eligibilityForm.disability_type === d ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="font-display font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                      Age: <span style={{ color: "var(--amber)" }}>{eligibilityForm.age} years</span>
                    </label>
                    <input
                      type="range" min={5} max={80} value={eligibilityForm.age}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, age: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="font-display font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                      Family Income: <span style={{ color: "var(--amber)" }}>Rs. {eligibilityForm.income_lakh}L/yr</span>
                    </label>
                    <input
                      type="range" min={0} max={10} step={0.5} value={eligibilityForm.income_lakh}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, income_lakh: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-display font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    Employment Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYMENT_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEligibilityForm((f) => ({ ...f, employment_status: e }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                          background: eligibilityForm.employment_status === e ? "rgba(245,158,11,0.15)" : "var(--bg-card-hover)",
                          color: eligibilityForm.employment_status === e ? "var(--amber)" : "var(--text-secondary)",
                          border: eligibilityForm.employment_status === e ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-display font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                    Education Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EDUCATION_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEligibilityForm((f) => ({ ...f, education_level: e }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                          background: eligibilityForm.education_level === e ? "rgba(245,158,11,0.15)" : "var(--bg-card-hover)",
                          color: eligibilityForm.education_level === e ? "var(--amber)" : "var(--text-secondary)",
                          border: eligibilityForm.education_level === e ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleEligibility}
                  disabled={!eligibilityForm.disability_type || !eligibilityForm.employment_status || eligibilityLoading}
                  className="btn-amber w-full py-4 rounded-xl text-sm font-display"
                >
                  {eligibilityLoading ? "Finding your schemes..." : "Find My Eligible Schemes →"}
                </button>
              </div>

              {eligibilityResult && (
                <div className="space-y-3">
                  <p className="font-display font-bold text-sm" style={{ color: "var(--text-secondary)" }}>
                    Found <span style={{ color: "var(--amber)" }}>{eligibilityResult.length} schemes</span> matching your profile
                  </p>
                  {eligibilityResult.map((match) => (
                    <div key={match.id} className="card rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`tag ${match.priority === "high" ? "tag-amber" : "tag-green"} mb-2 inline-block`}>
                            {match.priority === "high" ? "High Priority" : match.priority === "medium" ? "Recommended" : "Relevant"}
                          </span>
                          <h3 className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>{match.name}</h3>
                        </div>
                        <a href={match.portal} target="_blank" rel="noopener noreferrer">
                          <ArrowUpRight size={16} style={{ color: "var(--amber)" }} />
                        </a>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{match.reason}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChecklist(match.id)}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-all"
                          style={{ background: "rgba(245,158,11,0.1)", color: "var(--amber)", border: "1px solid rgba(245,158,11,0.2)" }}
                        >
                          <CheckSquare size={12} /> Documents Needed
                        </button>
                        <button
                          onClick={() => handleQuery(`How do I apply for ${match.name}?`)}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-all"
                          style={{ background: "rgba(255,255,255,0.08)", color: "#bbf7d0", border: "1px solid rgba(255,255,255,0.15)" }}
                        >
                          <Sparkles size={12} /> Ask AI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "schemes" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Government <span className="amber-gradient">Schemes</span>
                </h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  All central government schemes for differently-abled persons in India
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {schemeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSchemeFilter(cat)}
                    className="px-3 py-2 rounded-lg text-xs font-bold shrink-0 capitalize transition-all font-display"
                    style={{
                      background: schemeFilter === cat ? "var(--amber)" : "var(--bg-card)",
                      color: schemeFilter === cat ? "var(--bg)" : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {selectedScheme ? (
                <div className="card rounded-2xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="tag tag-amber mb-3 inline-block capitalize">{selectedScheme.category}</span>
                      <h3 className="font-display font-black text-xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        {selectedScheme.name}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{selectedScheme.ministry}</p>
                    </div>
                    <button onClick={() => setSelectedScheme(null)} className="p-1">
                      <X size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>
                  <hr className="divider" />
                  {[
                    { label: "What is it?", value: selectedScheme.summary },
                    { label: "Who can apply?", value: selectedScheme.eligibility },
                    { label: "What do you get?", value: selectedScheme.benefit },
                    { label: "How to apply", value: selectedScheme.how_to_apply },
                  ].map((item) => item.value && (
                    <div key={item.label}>
                      <p className="font-display font-bold text-xs uppercase tracking-widest mb-2" style={{ color: "var(--amber)", opacity: 0.8 }}>
                        {item.label}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.value}</p>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <a
                      href={selectedScheme.portal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-amber flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                    >
                      {selectedScheme.portal_label || "Apply Now"} <ArrowUpRight size={14} />
                    </a>
                    <button
                      onClick={() => handleChecklist(selectedScheme.id)}
                      className="btn-ghost flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                    >
                      <CheckSquare size={14} /> Documents Needed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSchemes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScheme(s)}
                      className="card rounded-2xl p-5 text-left group transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="tag tag-amber capitalize">{s.category}</span>
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                          style={{ color: "var(--amber)" }}
                        />
                      </div>
                      <h3 className="font-display font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{s.name}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {s.summary.slice(0, 100)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "rights" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Your <span className="amber-gradient">Legal Rights</span>
                </h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  Rights guaranteed to you under the Rights of Persons with Disabilities Act, 2016
                </p>
              </div>

              {selectedRight ? (
                <div className="card rounded-2xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="tag tag-green mb-3 inline-block">{selectedRight.act_section.split("—")[1]?.trim()}</span>
                      <h3 className="font-display font-black text-xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        {selectedRight.title}
                      </h3>
                    </div>
                    <button onClick={() => setSelectedRight(null)}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
                  </div>
                  <hr className="divider" />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selectedRight.summary}</p>
                  <div>
                    <p className="font-display font-bold text-xs uppercase tracking-widest mb-3" style={{ color: "var(--amber)", opacity: 0.8 }}>
                      What this means for you
                    </p>
                    <ul className="space-y-2.5">
                      {selectedRight.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5"
                            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
                          >
                            <Check size={10} style={{ color: "var(--amber)" }} />
                          </div>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="font-display font-bold text-xs uppercase tracking-widest mb-2" style={{ color: "#fca5a5" }}>
                      If this right is violated
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#fca5a5", opacity: 0.8 }}>
                      {selectedRight.what_to_do_if_violated}
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuery(`Explain more about ${selectedRight.title} under RPWD Act 2016`)}
                    className="btn-amber flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                  >
                    <Sparkles size={14} /> Ask AI for more details
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rights.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRight(r)}
                      className="card rounded-2xl p-5 text-left group transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Shield size={16} style={{ color: "var(--amber)" }} />
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                          style={{ color: "var(--amber)" }}
                        />
                      </div>
                      <h3 className="font-display font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{r.title}</h3>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                        {r.summary.slice(0, 90)}...
                      </p>
                      <span className="tag tag-green">{r.act_section.split("—")[1]?.trim()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "jobs" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Jobs &amp; <span className="amber-gradient">Employment</span>
                </h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  Employment resources and reservations for differently-abled persons in India
                </p>
              </div>

              <div className="card-amber rounded-2xl p-5">
                <p className="font-display font-black text-lg" style={{ color: "var(--amber)", letterSpacing: "-0.02em" }}>
                  4% Reservation in All Central Govt Jobs
                </p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Under RPWD Act 2016, every central government establishment must reserve 4% of vacancies for differently-abled persons. You also get 10 years age relaxation and fee waivers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobs.map((j) => (
                  <div key={j.id} className="card rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="tag tag-amber capitalize mb-2 inline-block">{j.type}</span>
                        <h3 className="font-display font-bold text-sm" style={{ color: "var(--text-primary)" }}>{j.name}</h3>
                      </div>
                      <a href={j.url} target="_blank" rel="noopener noreferrer">
                        <ArrowUpRight size={16} style={{ color: "var(--amber)" }} />
                      </a>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{j.description}</p>
                    <button
                      onClick={() => handleQuery(`Tell me more about ${j.name} for differently-abled persons`)}
                      className="text-xs flex items-center gap-1.5 font-semibold transition-all"
                      style={{ color: "var(--amber)" }}
                    >
                      <Sparkles size={11} /> Ask AI about this
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "checklist" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Document <span className="amber-gradient">Checklist</span>
                </h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  Exact documents and step-by-step guide to apply for each scheme
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {["udid", "niramaya", "nhfdc", "scholarship_post_matric", "assistive_devices"].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleChecklist(id)}
                    className="px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all font-display"
                    style={{
                      background: checklistScheme === id ? "var(--amber)" : "var(--bg-card)",
                      color: checklistScheme === id ? "var(--bg)" : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {id.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {!checklist && !checklistScheme && (
                <div className="card rounded-2xl p-12 text-center">
                  <CheckSquare size={40} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                  <p className="font-display font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                    Select a scheme above
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Get the exact documents and steps to apply
                  </p>
                </div>
              )}

              {checklist && (
                <div className="card rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                      {checklist.scheme_name}
                    </h3>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Time: <span style={{ color: "var(--amber)" }}>{checklist.time_required}</span>
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Cost: <span style={{ color: "var(--amber)" }}>{checklist.cost}</span>
                      </span>
                    </div>
                  </div>
                  <hr className="divider" />
                  <div>
                    <p className="font-display font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--amber)", opacity: 0.8 }}>
                      Documents Required
                    </p>
                    <ul className="space-y-2.5">
                      {checklist.documents.map((doc, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="w-6 h-6 rounded shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                          >
                            <FileText size={11} style={{ color: "var(--amber)" }} />
                          </div>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr className="divider" />
                  <div>
                    <p className="font-display font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--amber)", opacity: 0.8 }}>
                      Step-by-Step Application
                    </p>
                    <ol className="space-y-4">
                      {checklist.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-black font-display"
                            style={{ background: "var(--amber)", color: "var(--bg)" }}
                          >
                            {i + 1}
                          </div>
                          <span className="leading-relaxed pt-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <a
                    href={checklist.portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-amber flex items-center justify-center gap-2 py-4 rounded-xl text-sm"
                  >
                    Apply on Official Portal <ArrowUpRight size={14} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="sticky bottom-0"
        style={{ background: "rgba(13,51,32,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery(input);
                  }
                }}
                placeholder="Ask about schemes, eligibility, rights, how to apply..."
                rows={1}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all font-display font-medium"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  maxHeight: "120px",
                }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(245,158,11,0.35)"; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(null); }}
                className="p-3 rounded-xl transition-all"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                title="Clear chat"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={() => handleQuery(input)}
              disabled={!input.trim() || loading}
              className="btn-amber px-6 py-3 rounded-xl text-sm"
            >
              {loading ? "..." : "Ask →"}
            </button>
          </div>
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Powered by verified data from MSJE, RPWD Act 2016, NHFDC, and National Trust official sources.
          </p>
        </div>
      </div>
    </div>
  );
}