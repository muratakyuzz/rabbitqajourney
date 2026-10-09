import { useState } from "react";
import { useSearchParams } from "react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { DEFAULT_FILTER, InsightCard, InsightFilters, RejectDialog, SelectableInsight, applyFilter, type InsightFilter } from "@/components/rq/InsightCard";
import { useAuth } from "@/lib/auth-context";
import { visibleInsights, visibleProjects } from "@/lib/rabbitqa/perm";
import { useRq } from "@/lib/rabbitqa/store";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";

export default function Insights() {
  const { state } = useRq();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [f, setF] = useState<InsightFilter>({ ...DEFAULT_FILTER, project: params.get("project") ?? "all" });
  const [sel, setSel] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const all = visibleInsights(state, user);
  const pending = applyFilter(all.filter((i) => effectiveStatus(state, i) === "pending"), f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const history = applyFilter(all.filter((i) => effectiveStatus(state, i) !== "pending"), f).sort((a, b) => (b.reviewedAt ?? b.createdAt).localeCompare(a.reviewedAt ?? a.createdAt));
  const validSel = sel.filter((id) => pending.some((p) => p.id === id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Insight</h1>
        <p className="text-sm text-muted-foreground">Teams kanallarından ve e-postalardan çıkarılan güncelleme önerileri. AI hiçbir değişikliği onaysız uygulamaz.</p>
      </div>
      <InsightFilters f={f} setF={setF} projects={visibleProjects(state, user)} />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Bekleyen ({pending.length})</TabsTrigger>
          <TabsTrigger value="history">Geçmiş ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-3">
          {pending.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <Button size="sm" variant="ghost" onClick={() => setSel(validSel.length === pending.length ? [] : pending.map((p) => p.id))}>
                {validSel.length === pending.length ? "Seçimi kaldır" : "Tümünü seç"}
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" disabled={!validSel.length} onClick={() => setRejecting(true)}>Seçilenleri reddet ({validSel.length})</Button>
            </div>
          )}
          {pending.length ? pending.map((i) => (
            <SelectableInsight key={i.id} insight={i} checked={validSel.includes(i.id)} onCheck={(c) => setSel((s) => (c ? [...s, i.id] : s.filter((x) => x !== i.id)))} />
          )) : <Card><EmptyState title="İncelenecek AI önerisi yok" description="Yeni mesajlar geldikçe öneriler burada görünür." /></Card>}
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {history.length ? history.map((i) => <InsightCard key={i.id} insight={i} />) : <Card><EmptyState title="Geçmiş kayıt yok" description="Onaylanan, reddedilen ve süresi dolan öneriler burada listelenir." /></Card>}
        </TabsContent>
      </Tabs>
      {rejecting && <RejectDialog ids={validSel} onClose={() => setRejecting(false)} onDone={() => setSel([])} />}
    </div>
  );
}
