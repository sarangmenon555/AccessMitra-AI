import sourcesFile from "./data/sources.json";
import type { PublicSource, SourceRecord } from "./types";

const SOURCES: Record<string, SourceRecord> = Object.fromEntries(
  (sourcesFile.sources as SourceRecord[]).map((s) => [s.source_id, s]),
);

export function getSource(id: string): SourceRecord | null {
  return SOURCES[id] ?? null;
}

export function publicSource(s: SourceRecord): PublicSource {
  return {
    source_id: s.source_id,
    title: s.title,
    authority: s.authority,
    url: s.url,
    type: s.type,
    geography: s.geography,
    published_date: s.published_date,
    last_checked: s.last_checked,
    next_review: s.next_review,
    status: s.status,
    notes: s.notes,
  };
}

export function listPublicSources(): PublicSource[] {
  return Object.values(SOURCES).map(publicSource);
}
