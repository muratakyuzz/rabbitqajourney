import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth-context";
import { useRq } from "@/lib/rabbitqa/store";
import { uid } from "@/lib/rabbitqa/seed";
import { BALL_LABEL, ROLE_LABEL, fmtDateTime } from "@/lib/rabbitqa/labels";
import type { Ball, PhaseTpl } from "@/lib/rabbitqa/types";

export default function Admin() {
  const { user } = useAuth();
  const { state } = useRq();
  if (user?.role !== "admin") return <Navigate to="/app/projects" replace />;
  const configAudit = state.audit.filter((a) => a.entity === "config").slice(-10).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sistem ayarları</h1>
        <p className="text-sm text-muted-foreground">Şablon değişiklikleri yalnızca yeni açılan projeleri etkiler.</p>
      </div>
      <Tabs defaultValue="template">
        <TabsList>
          <TabsTrigger value="template">Aşama şablonu</TabsTrigger>
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="questions">Keşif soruları</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="log">Değişiklikler</TabsTrigger>
        </TabsList>
        <TabsContent value="template"><TemplateEditor /></TabsContent>
        <TabsContent value="modules"><ModulesEditor /></TabsContent>
        <TabsContent value="questions"><QuestionsEditor /></TabsContent>
        <TabsContent value="users">
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>E-posta</TableHead><TableHead>Rol</TableHead></TableRow></TableHeader>
              <TableBody>{state.users.map((u) => (
                <TableRow key={u.id}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{ROLE_LABEL[u.role]}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">Demo sürümde kullanıcılar sabittir; gerçek kullanıcı yönetimi canlı sürümde eklenir.</p>
          </Card>
        </TabsContent>
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

function TemplateEditor() {
  const { state, setConfig } = useRq();
  const [tpl, setTpl] = useState<PhaseTpl[]>(() => structuredClone(state.template));
  const upd = (pi: number, fn: (p: PhaseTpl) => void) => setTpl((t) => { const n = structuredClone(t); fn(n[pi]); return n; });

  return (
    <Card className="p-4 space-y-3">
      <Accordion type="multiple">
        {tpl.map((p, pi) => (
          <AccordionItem key={p.code} value={p.code}>
            <AccordionTrigger>{p.code} — {p.name} <span className="ml-auto mr-2 text-xs text-muted-foreground">{p.steps.length} adım</span></AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Input value={p.name} onChange={(e) => upd(pi, (x) => { x.name = e.target.value; })} className="max-w-xs" aria-label="Aşama adı" />
              {p.code === "05" && <p className="text-xs text-muted-foreground">Uyarlama adımları takım eklendikçe otomatik oluşur.</p>}
              {p.steps.map((s, si) => (
                <div key={si} className="flex items-center gap-2">
                  <Input value={s.title} onChange={(e) => upd(pi, (x) => { x.steps[si].title = e.target.value; })} />
                  <Select value={s.ball} onValueChange={(v) => upd(pi, (x) => { x.steps[si].ball = v as Ball; })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(BALL_LABEL) as Ball[]).map((b) => <SelectItem key={b} value={b}>{BALL_LABEL[b]}</SelectItem>)}</SelectContent>
                  </Select>
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={s.required} onCheckedChange={(c) => upd(pi, (x) => { x.steps[si].required = !!c; })} />Zorunlu</label>
                  <Button variant="ghost" size="icon" disabled={!!s.key} title={s.key ? "Otomatik kurala bağlı adım silinemez" : "Sil"} onClick={() => upd(pi, (x) => { x.steps.splice(si, 1); })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {p.code !== "05" && <Button variant="outline" size="sm" onClick={() => upd(pi, (x) => { x.steps.push({ title: "Yeni adım", ball: "csm", required: false }); })}><Plus className="h-4 w-4 mr-1" />Adım ekle</Button>}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button onClick={() => { setConfig("template", tpl, "Aşama/adım şablonu güncellendi"); toast.success("Şablon kaydedildi"); }}>Şablonu kaydet</Button>
    </Card>
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
  const [qs, setQs] = useState(() => structuredClone(state.questions));
  const set = (i: number, patch: Partial<(typeof qs)[number]>) => setQs((q) => q.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <Card className="p-4 space-y-3">
      {qs.map((q, i) => (
        <div key={q.id} className="flex items-center gap-2">
          <Input className="w-56" value={q.group} onChange={(e) => set(i, { group: e.target.value })} aria-label="Grup" />
          <Input value={q.text} onChange={(e) => set(i, { text: e.target.value })} aria-label="Soru" />
          <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={q.required} onCheckedChange={(c) => set(i, { required: !!c })} />Zorunlu</label>
          <Button variant="ghost" size="icon" onClick={() => setQs((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setQs((x) => [...x, { id: uid("q"), group: "Diğer", text: "Yeni soru", required: false }])}><Plus className="h-4 w-4 mr-1" />Soru ekle</Button>
        <Button onClick={() => { setConfig("questions", qs.filter((q) => q.text.trim()), "Keşif soruları güncellendi"); toast.success("Sorular kaydedildi"); }}>Kaydet</Button>
      </div>
    </Card>
  );
}
