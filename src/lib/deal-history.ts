export type DealHistoryEventType =
  | "stage_changed"
  | "status_changed"
  | "deal_updated"
  | "deal_created"
  | "approved"
  | "rejected"
  | "note_added"
  | "note_edited"
  | "note_deleted";

export interface DealHistoryEntry {
  id: string;
  dealId: string;
  type: DealHistoryEventType;
  fromValue?: string | null;
  toValue?: string | null;
  message?: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  at: string; // ISO date
}

const KEY = "deal-history-v1";

function readAll(): Record<string, DealHistoryEntry[]> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, DealHistoryEntry[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DealHistoryEntry[]>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function getDealHistory(dealId: string): DealHistoryEntry[] {
  const data = readAll();
  const list = data[dealId] ?? [];
  return [...list].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function addDealHistoryEntry(entry: Omit<DealHistoryEntry, "id" | "at"> & { at?: string }): DealHistoryEntry {
  const data = readAll();
  const full: DealHistoryEntry = {
    id: newId(),
    at: entry.at ?? new Date().toISOString(),
    ...entry,
  };
  data[entry.dealId] = [...(data[entry.dealId] ?? []), full];
  writeAll(data);
  return full;
}
