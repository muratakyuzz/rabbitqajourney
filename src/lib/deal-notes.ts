export interface DealNote {
  id: string;
  dealId: string;
  content: string;
  authorId: string | null;
  authorName: string;
  authorRole: "admin" | "partner" | string;
  createdAt: string;
  updatedAt: string;
}

const KEY = "deal-notes-v1";

function readAll(): Record<string, DealNote[]> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, DealNote[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DealNote[]>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function listDealNotes(dealId: string): DealNote[] {
  const data = readAll();
  const list = data[dealId] ?? [];
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addDealNote(input: Omit<DealNote, "id" | "createdAt" | "updatedAt">): DealNote {
  const data = readAll();
  const now = new Date().toISOString();
  const note: DealNote = { id: newId(), createdAt: now, updatedAt: now, ...input };
  data[input.dealId] = [...(data[input.dealId] ?? []), note];
  writeAll(data);
  return note;
}

export function updateDealNote(dealId: string, noteId: string, content: string): DealNote | null {
  const data = readAll();
  const list = data[dealId] ?? [];
  const idx = list.findIndex((n) => n.id === noteId);
  if (idx < 0) return null;
  const updated: DealNote = { ...list[idx], content, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  data[dealId] = list;
  writeAll(data);
  return updated;
}

export function deleteDealNote(dealId: string, noteId: string) {
  const data = readAll();
  data[dealId] = (data[dealId] ?? []).filter((n) => n.id !== noteId);
  writeAll(data);
}