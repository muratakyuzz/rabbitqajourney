import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, Pencil, Send, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/auth-context";
import { addDealNote, deleteDealNote, listDealNotes, updateDealNote, type DealNote } from "@/lib/deal-notes";
import { addDealHistoryEntry } from "@/lib/deal-history";
import { cn } from "@/lib/utils";

interface Props {
  dealId: string;
  readOnly?: boolean;
}

function initials(name: string) {
  const parts = name.split(/[@\s.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatAbsolute(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

const MAX = 2000;

export function DealNotesPanel({ dealId, readOnly = false }: Props) {
  const { user, role } = useAuth();
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = () => setNotes(listDealNotes(dealId));
  useEffect(refresh, [dealId]);

  const authorName = user?.email ?? "Unknown";
  const authorId = user?.id ?? null;

  const canMutate = (n: DealNote) => !readOnly && (n.authorId === authorId || (authorId == null && n.authorName === authorName));

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    addDealNote({ dealId, content, authorId, authorName, authorRole: role ?? "partner" });
    addDealHistoryEntry({
      dealId,
      type: "note_added",
      message: content.slice(0, 140),
      actorId: authorId,
      actorName: authorName,
      actorRole: role,
    });
    setDraft("");
    refresh();
    toast.success("Note added");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const startEdit = (n: DealNote) => {
    setEditingId(n.id);
    setEditingText(n.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const content = editingText.trim();
    if (!content) return;
    updateDealNote(dealId, editingId, content);
    addDealHistoryEntry({
      dealId,
      type: "note_edited",
      message: content.slice(0, 140),
      actorId: authorId,
      actorName: authorName,
      actorRole: role,
    });
    setEditingId(null);
    setEditingText("");
    refresh();
    toast.success("Note updated");
  };

  const doDelete = () => {
    if (!confirmDeleteId) return;
    deleteDealNote(dealId, confirmDeleteId);
    addDealHistoryEntry({
      dealId,
      type: "note_deleted",
      actorId: authorId,
      actorName: authorName,
      actorRole: role,
    });
    setConfirmDeleteId(null);
    refresh();
    toast.success("Note deleted");
  };

  const composerInitials = useMemo(() => initials(authorName), [authorName]);

  return (
    <div className="space-y-6">
      {/* Composer */}
      {!readOnly ? (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground inline-flex items-center justify-center text-sm font-semibold ring-2 ring-background shadow-sm">
              {composerInitials}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
                onKeyDown={onKeyDown}
                rows={3}
                placeholder="Share an update, decision, or context for this deal…"
                className="resize-y border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘</kbd>{" "}
                  <span>+</span>{" "}
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Enter</kbd>{" "}
                  to post · <span className="tabular-nums">{draft.length}/{MAX}</span>
                </div>
                <Button type="button" size="sm" onClick={submit} disabled={!draft.trim()}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Post note
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Feed header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </h3>
        </div>
      </div>

      {/* Feed */}
      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted inline-flex items-center justify-center mb-3">
            <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No notes yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {readOnly ? "Notes added by the team will appear here." : "Be the first to add context, a decision, or a meeting summary."}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {notes.map((n) => {
            const isEditing = editingId === n.id;
            const edited = n.updatedAt !== n.createdAt;
            return (
              <li
                key={n.id}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">
                    {initials(n.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-foreground truncate">{n.authorName}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          n.authorRole === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {n.authorRole}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground" title={formatAbsolute(n.createdAt)}>
                        {relativeTime(n.createdAt)}
                      </span>
                      {edited ? (
                        <span className="text-[11px] text-muted-foreground italic" title={`Edited ${formatAbsolute(n.updatedAt)}`}>
                          (edited)
                        </span>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value.slice(0, MAX))}
                          rows={3}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                          <Button type="button" size="sm" onClick={saveEdit} disabled={!editingText.trim()}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    )}
                  </div>

                  {canMutate(n) && !isEditing ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(n)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(n.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete this note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={doDelete}
      />

      {/* Subtle bottom spacer */}
      <Separator className="opacity-0" />
    </div>
  );
}