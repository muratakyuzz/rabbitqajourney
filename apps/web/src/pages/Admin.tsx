import { useState } from "react";
import { Navigate } from "react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { uid } from "@rabbitqa/shared/domain/seed";
import { QUESTION_TYPE_LABEL, fmtDateTime } from "@rabbitqa/shared/domain/labels";
import { IntegrationsAdmin } from "./admin/IntegrationsAdmin";
import { AlertsAdmin, SalespeopleAdmin } from "./admin/AlertsAdmin";
import { UsersAdmin } from "./admin/UsersAdmin";
import { TemplateEditor } from "./admin/TemplateEditor";
import { canAccessAdmin } from "@/lib/rabbitqa/perm";


export default function Admin() {
  const { user } = useAuth();
  const { state, templateVersion } = useRq();
  if (!canAccessAdmin(user)) return <Navigate to="/app/projects" replace />;
  const configAudit = state.audit.filter((a) => a.entity === "config").slice(-30).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem ayarları</h1>
        <p className="text-sm text-muted-foreground">Şablon değişiklikleri yalnızca yeni açılan projeleri etkiler.</p>
      </div>
      <Tabs defaultValue="template">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="template">Aşama şablonu</TabsTrigger>
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="questions">Keşif soruları</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="salespeople">Satışçılar</TabsTrigger>
          <TabsTrigger value="alerts">Uyarılar</TabsTrigger>
          <TabsTrigger value="log">Değişiklikler</TabsTrigger>
        </TabsList>
        <TabsContent value="template"><TemplateEditor key={templateVersion?.version ?? 0} /></TabsContent>
        <TabsContent value="modules"><ModulesEditor /></TabsContent>
        <TabsContent value="integrations"><IntegrationsAdmin /></TabsContent>
        <TabsContent value="questions"><QuestionsEditor /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="salespeople"><SalespeopleAdmin /></TabsContent>
        <TabsContent value="alerts"><AlertsAdmin /></TabsContent>
        <TabsContent value="log">
          <Card className="p-4">
            {configAudit.length ? <ul className="text-sm space-y-1">{configAudit.map((a) => (
              <li key={a.id}>{fmtDateTime(a.at)} — {state.users.find((u) => u.id === a.userId)?.name ?? a.userId}: {a.label}</li>
            ))}</ul> : <p className="text-sm text-muted-foreground">Henüz ayar değişikliği yok.</p>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


function ModulesEditor() {
  const { state, setConfig } = useRq();
  const [name, setName] = useState("");
  const add = () => {
    const n = name.trim();
    if (!n || state.modules.includes(n)) return toast.error("Geçerli ve benzersiz bir modül adı girin");
    setConfig("modules", [...state.modules, n], `Modül eklendi: ${n}`); setName(""); toast.success("Modül eklendi");
  };
  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2 max-w-md"><Input placeholder="Modül adı" value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={add}><Plus className="h-4 w-4 mr-1" />Ekle</Button></div>
      <div className="grid gap-2 sm:grid-cols-3">{state.modules.map((m) => {
        const used = state.projects.some((p) => p.purchasedModules.includes(m) || p.desiredModules.includes(m));
        return (
          <div key={m} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            {m}
            <Button variant="ghost" size="icon" disabled={used} title={used ? "Projelerde kullanılıyor" : "Sil"} onClick={() => setConfig("modules", state.modules.filter((x) => x !== m), `Modül silindi: ${m}`)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        );
      })}</div>
    </Card>
  );
}

function QuestionsEditor() {
  const { state, setConfig } = useRq();
  const [qs, setQs] = useState(() => structuredClone(state.questions).sort((a, b) => a.order - b.order));
  const set = (i: number, patch: Partial<(typeof qs)[number]>) => setQs((q) => q.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setQs((q) => { const j = i + d; if (j < 0 || j >= q.length) return q; const n = [...q]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <Card className="p-4 space-y-3">
      {qs.length === 0 && <p className="text-sm text-muted-foreground">Keşif sorusu yok.</p>}
      {qs.map((q, i) => (
        <div key={q.id} className="flex flex-wrap items-center gap-2">
          <Input className="w-48" value={q.group} onChange={(e) => set(i, { group: e.target.value })} aria-label="Grup" />
          <Input className="flex-1 min-w-48" value={q.text} onChange={(e) => set(i, { text: e.target.value })} aria-label="Soru" />
          <Select value={q.type ?? "text"} onValueChange={(v) => set(i, { type: v as "text" | "modules" })}>
            <SelectTrigger className="w-48" aria-label="Tip"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(QUESTION_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={q.required} onCheckedChange={(c) => set(i, { required: !!c })} />Zorunlu</label>
          <Button variant="ghost" size="icon" disabled={i === 0} aria-label="Yukarı taşı" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" disabled={i === qs.length - 1} aria-label="Aşağı taşı" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Sil" onClick={() => setQs((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setQs((x) => [...x, { id: uid("q"), group: "Diğer", text: "Yeni soru", required: false, type: "text", order: x.length }])}><Plus className="h-4 w-4 mr-1" />Soru ekle</Button>
        <Button onClick={() => { setConfig("questions", qs.filter((q) => q.text.trim()).map((q, i) => ({ ...q, order: i })), "Keşif soruları güncellendi"); toast.success("Sorular kaydedildi"); }}>Kaydet</Button>
      </div>
    </Card>
  );
}
