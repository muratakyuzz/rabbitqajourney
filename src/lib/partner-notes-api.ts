import { delay, nextId, nowIso, partnerNotes } from "@/lib/mock-store";

export interface PartnerNote {
  id: string;
  partnerId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerNoteInput {
  content: string;
}

export async function listPartnerNotes(_token: string, partnerId: string) {
  await delay();
  return [...(partnerNotes[partnerId] ?? [])];
}

export async function createPartnerNote(_token: string, partnerId: string, input: CreatePartnerNoteInput) {
  await delay();
  const note: PartnerNote = {
    id: nextId("pn"),
    partnerId,
    content: input.content,
    createdBy: "current.user@example.com",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  partnerNotes[partnerId] = [note, ...(partnerNotes[partnerId] ?? [])];
  return note;
}

export async function deletePartnerNote(_token: string, partnerId: string, noteId: string) {
  await delay();
  const list = partnerNotes[partnerId] ?? [];
  partnerNotes[partnerId] = list.filter((n) => n.id !== noteId);
  return undefined as unknown as void;
}
