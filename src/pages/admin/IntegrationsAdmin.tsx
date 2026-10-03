import { useState } from "react";
import { Eye, EyeOff, Info, Loader2, Mail, MessageSquare, Plus, Slack, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { InsightCard } from "@/components/rq/InsightCard";
import { useAuth } from "@/lib/auth-context";
import { canSeeSecrets } from "@/lib/rabbitqa/perm";
import { useRq } from "@/lib/rabbitqa/store";
import { CONN_STATUS_LABEL, CONTACT_ROLE_LABEL, INSIGHT_KIND_LABEL, fmtDateTime } from "@/lib/rabbitqa/labels";
import type { AiInsight, ChatChannel, ConnStatus, ContactRole, InsightKind, IntegrationConfig } from "@/lib/rabbitqa/types";

const connTone = { connected: "success", disconnected: "muted", error: "danger" } as const;
const StatusPill = ({ s }: { s: ConnStatus }) => <Pill tone={connTone[s]}>{CONN_STATUS_LABEL[s]}</Pill>;

function SecretInput({ value, onChange, field }: { value: string; onChange: (v: string) => void; field: string }) {
  const { logSecretView } = useRq();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  if (!canSeeSecrets(user)) return <Input value="••••••••" disabled />;
  return (
    <div className="flex gap-1">
      <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      <Button type="button" variant="outline" size="icon" aria-label={show ? "Gizle" : "Göster"} onClick={() => { if (!show) logSecretView(field); setShow(!show); }}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const addTag = () => { const t = v.trim().toLowerCase(); if (t && !values.includes(t)) onChange([...values, t]); setV(""); };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">{values.map((x) => <Pill key={x} tone="muted">{x}<button aria-label={`${x} kaldır`} onClick={() => onChange(values.filter((y) => y !== x))}><X className="h-3 w-3" /></button></Pill>)}</div>
      <div className="flex gap-2 max-w-sm"><Input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} /><Button variant="outline" size="sm" onClick={addTag}><Plus className="h-4 w-4" /></Button></div>
    </div>
  );
}

export function IntegrationsAdmin() {
  const { state } = useRq();
  const openCount = state.unmatchedEmails.filter((e) => e.status === "open").length;
  return (
    <Tabs defaultValue="chat" className="space-y-3">
      <TabsList>
        <TabsTrigger value="chat">Sohbet entegrasyonları</TabsTrigger>
        <TabsTrigger value="email">E-posta dinleme{openCount > 0 && <span className="ml-1.5 rounded-full bg-destructive/15 text-destructive px-1.5 text-xs">{openCount}</span>}</TabsTrigger>
        <TabsTrigger value="ai">AI analiz ayarları</TabsTrigger>
      </TabsList>
      <TabsContent value="chat"><ChatSection /></TabsContent>
      <TabsContent value="email"><EmailSection /></TabsContent>
      <TabsContent value="ai"><AiSection /></TabsContent>
    </Tabs>
  );
}

function ChatSection() {
  const { state, setConfig, testConnection, disconnect } = useRq();
  const t = state.integrations.chat.teams;
  const [form, setForm] = useState<null | typeof t>(null);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<ChatChannel[] | null>(t.connected ? state.chatChannels : null);
  const [confirmOff, setConfirmOff] = useState(false);
  const owner = (id: string) => state.projects.find((p) => p.integrations.chat.channelId === id && p.integrations.chat.active)?.customerName;

  const runTest = async () => {
    if (!form) return;
    const next: IntegrationConfig = structuredClone(state.integrations);
    next.chat.teams = { ...form };
    setConfig("integrations", next, "Teams bağlantı ayarları güncellendi");
    setTesting(true);
    const r = await testConnection("teams", next);
    setTesting(false);
    if (r.ok) { toast.success(r.message); setChannels(r.channels ?? []); setForm(null); } else toast.error(r.message);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Microsoft Teams</h3>
            <StatusPill s={t.status} />
          </div>
          <p className="text-xs text-muted-foreground">Son senkron: {t.lastSyncAt ? fmtDateTime(t.lastSyncAt) : "—"} · Bot: {t.botName || "—"} · {t.pollMinutes} dk'da bir</p>
          {t.status === "error" && <p className="text-xs text-destructive">{t.statusMessage}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setForm({ ...t })}>{t.connected ? "Ayarları düzenle" : "Bağlan"}</Button>
            {t.connected && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirmOff(true)}>Bağlantıyı kes</Button>}
          </div>
        </Card>
        <Card className="p-4 space-y-3 opacity-60">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Slack className="h-4 w-4" />Slack</h3>
            <Pill tone="muted">Yakında</Pill>
          </div>
          <p className="text-xs text-muted-foreground">Slack kanalları için dinleme desteği yakında eklenecek.</p>
          <Button size="sm" disabled>Bağlan</Button>
        </Card>
      </div>
      <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs flex gap-2"><Info className="h-4 w-4 shrink-0" />Gerekli Microsoft Graph izinleri: ChannelMessage.Read.All, Team.ReadBasic.All, Channel.ReadBasic.All (uygulama izni, yönetici onayı gerekir).</p>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">Kanallar {channels && <span className="text-muted-foreground font-normal">· {channels.length} kanal bulundu</span>}</h3>
        {testing ? <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Kanallar alınıyor…</p>
          : channels?.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Kanal</TableHead><TableHead>Bağlı proje</TableHead></TableRow></TableHeader>
              <TableBody>{channels.map((c) => <TableRow key={c.id}><TableCell>{c.teamName} › {c.channelName}</TableCell><TableCell>{owner(c.id) ?? <span className="text-muted-foreground">Bağlı değil</span>}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : <EmptyState title="Kanal listesi yok" description="Teams bağlantısını test edince kanallar burada listelenir." />}
      </Card>

      {form && (
        <Dialog open onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Microsoft Teams bağlantısı</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5"><Label>Tenant ID</Label><Input value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Uygulama (Client) ID</Label><Input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Client secret</Label><SecretInput field="Teams client secret" value={form.clientSecret} onChange={(v) => setForm({ ...form, clientSecret: v })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Bot görünen adı</Label><Input value={form.botName} onChange={(e) => setForm({ ...form, botName: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Dinleme sıklığı</Label>
                  <Select value={String(form.pollMinutes)} onValueChange={(v) => setForm({ ...form, pollMinutes: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 5, 15].map((m) => <SelectItem key={m} value={String(m)}>{m} dk</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForm(null)}>Vazgeç</Button>
              <Button onClick={runTest} disabled={testing}>{testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Bağlantıyı test et</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Teams bağlantısı kesilsin mi?</AlertDialogTitle><AlertDialogDescription>Kanallar artık dinlenmez ve yeni AI önerisi üretilmez.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => { disconnect("teams"); setChannels(null); toast.success("Bağlantı kesildi"); }}>Bağlantıyı kes</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmailSection() {
  const { state, setConfig, testConnection } = useRq();
  const [e, setE] = useState(() => structuredClone(state.integrations.email));
  const [testing, setTesting] = useState(false);
  const [assign, setAssign] = useState<string | null>(null);
  const save = (label = "E-posta dinleme ayarları güncellendi") => {
    const next = structuredClone(state.integrations); next.email = { ...e, status: state.integrations.email.status, lastSyncAt: state.integrations.email.lastSyncAt, statusMessage: state.integrations.email.statusMessage };
    setConfig("integrations", next, label); return next;
  };
  const live = state.integrations.email;
  const queue = state.unmatchedEmails.filter((m) => m.status === "open");

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-primary" />E-posta dinleme <Switch checked={e.enabled} onCheckedChange={(c) => setE({ ...e, enabled: c })} /></label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><StatusPill s={live.status} />Son senkron: {live.lastSyncAt ? fmtDateTime(live.lastSyncAt) : "—"}</div>
        </div>
        {live.status === "error" && <p className="text-xs text-destructive">{live.statusMessage}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5"><Label>Posta kutusu</Label><Input value={e.mailbox} onChange={(x) => setE({ ...e, mailbox: x.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Bağlantı tipi</Label>
            <Select value={e.provider} onValueChange={(v) => setE({ ...e, provider: v as "m365" | "imap" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="m365">Microsoft 365</SelectItem><SelectItem value="imap">IMAP</SelectItem></SelectContent>
            </Select>
          </div>
          {e.provider === "m365" ? <>
            <div className="grid gap-1.5"><Label>Tenant ID</Label><Input value={e.tenantId} onChange={(x) => setE({ ...e, tenantId: x.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Client ID</Label><Input value={e.clientId} onChange={(x) => setE({ ...e, clientId: x.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Client secret</Label><SecretInput field="E-posta client secret" value={e.clientSecret} onChange={(v) => setE({ ...e, clientSecret: v })} /></div>
          </> : <>
            <div className="grid gap-1.5"><Label>IMAP sunucusu</Label><Input value={e.imapHost} onChange={(x) => setE({ ...e, imapHost: x.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Port</Label><Input type="number" value={e.imapPort ?? ""} onChange={(x) => setE({ ...e, imapPort: x.target.value ? Number(x.target.value) : null })} /></div>
            <div className="grid gap-1.5"><Label>Kullanıcı adı</Label><Input value={e.username} onChange={(x) => setE({ ...e, username: x.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Şifre</Label><SecretInput field="IMAP şifresi" value={e.password} onChange={(v) => setE({ ...e, password: v })} /></div>
          </>}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><Checkbox checked={e.processIncoming} onCheckedChange={(c) => setE({ ...e, processIncoming: !!c })} />Gelen e-postaları işle</label>
          <label className="flex items-center gap-2"><Checkbox checked={e.processOutgoing} onCheckedChange={(c) => setE({ ...e, processOutgoing: !!c })} />Giden e-postaları işle (CC'de cs@ olanlar)</label>
          <label className="flex items-center gap-2"><Checkbox checked={e.matchByDomain} onCheckedChange={(c) => setE({ ...e, matchByDomain: !!c })} />Domain ile eşleştir</label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label className="mb-1.5 block">Yok sayılan adresler</Label><TagInput values={e.ignoredAddresses} onChange={(v) => setE({ ...e, ignoredAddresses: v })} placeholder="noreply" /></div>
          <div><Label className="mb-1.5 block">Yok sayılan domainler</Label><TagInput values={e.ignoredDomains} onChange={(v) => setE({ ...e, ignoredDomains: v })} placeholder="ornek.com" /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { save(); toast.success("Ayarlar kaydedildi"); }}>Kaydet</Button>
          <Button variant="outline" disabled={testing} onClick={async () => {
            const next = save(); setTesting(true);
            const r = await testConnection("email", next); setTesting(false);
            if (r.ok) toast.success(r.message); else toast.error(r.message);
          }}>{testing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Bağlantıyı test et</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">Eşleşmeyen e-postalar <Pill tone={queue.length ? "warning" : "muted"}>{queue.length} açık</Pill></h3>
        {queue.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Yön</TableHead><TableHead>Kimden</TableHead><TableHead>Konu</TableHead><TableHead>Alıntı</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{queue.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(m.at)}</TableCell>
                <TableCell>{m.direction === "in" ? "Gelen" : "Giden"}</TableCell>
                <TableCell className="text-xs">{m.from}</TableCell>
                <TableCell className="font-medium">{m.subject}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{m.excerpt}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setAssign(m.id)}>Projeye ata</Button>
                  <IgnoreBtn id={m.id} />
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        ) : <EmptyState title="Eşleşmeyen e-posta yok" description="Bir projeyle eşleşmeyen e-postalar burada listelenir." />}
      </Card>
      {assign && <AssignDialog id={assign} onClose={() => setAssign(null)} />}
    </div>
  );
}

function IgnoreBtn({ id }: { id: string }) {
  const { ignoreUnmatchedEmail } = useRq();
  return <Button size="sm" variant="ghost" onClick={() => { ignoreUnmatchedEmail(id); toast.success("Yok sayıldı"); }}>Yok say</Button>;
}

function AssignDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, assignUnmatchedEmail } = useRq();
  const m = state.unmatchedEmails.find((x) => x.id === id)!;
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [addContact, setAddContact] = useState(false);
  const [name, setName] = useState(m.from.split("@")[0].replace(/[._]/g, " "));
  const [role, setRole] = useState<ContactRole>("tech");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Projeye ata — {m.subject}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Proje</Label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{state.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.customerName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={addContact} onCheckedChange={(c) => setAddContact(!!c)} />Göndereni ({m.from}) müşteri kişisi olarak ekle</label>
          {addContact && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Ad soyad</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as ContactRole)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CONTACT_ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button disabled={!projectId} onClick={() => {
            if (addContact && !name.trim()) return toast.error("Ad soyad zorunlu");
            const n = assignUnmatchedEmail(id, projectId, addContact ? { name: name.trim(), role } : undefined);
            toast.success(`Atandı${n ? ` — ${n} AI önerisi oluştu` : ""}`); onClose();
          }}>Ata</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AiSection() {
  const { state, setConfig, simulateIncoming } = useRq();
  const [ai, setAi] = useState(() => structuredClone(state.integrations.ai));
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [source, setSource] = useState<"teams" | "email">("teams");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ list: AiInsight[]; message?: string } | null>(null);
  const toggle = (k: InsightKind, c: boolean) => setAi({ ...ai, enabledKinds: c ? [...ai.enabledKinds, k] : ai.enabledKinds.filter((x) => x !== k) });
  const live = state.insights;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div>
          <Label className="mb-2 block">Önerilebilecek güncelleme türleri</Label>
          <div className="grid gap-2 sm:grid-cols-3">{(Object.keys(INSIGHT_KIND_LABEL) as InsightKind[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm"><Checkbox checked={ai.enabledKinds.includes(k)} onCheckedChange={(c) => toggle(k, !!c)} />{INSIGHT_KIND_LABEL[k]}</label>
          ))}</div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2"><Label>Minimum güven eşiği: %{ai.minConfidence}</Label><Slider min={0} max={100} step={5} value={[ai.minConfidence]} onValueChange={([v]) => setAi({ ...ai, minConfidence: v })} /></div>
          <div className="grid gap-1.5"><Label>Alıntı uzunluğu (karakter)</Label><Input type="number" min={50} value={ai.excerptMaxChars} onChange={(e) => setAi({ ...ai, excerptMaxChars: Math.max(50, Number(e.target.value) || 50) })} /></div>
          <div className="grid gap-1.5"><Label>Bekleyen önerilerin süresi (gün)</Label><Input type="number" min={1} value={ai.autoExpireDays} onChange={(e) => setAi({ ...ai, autoExpireDays: Math.max(1, Number(e.target.value) || 1) })} /></div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3.5 w-3.5" />AI hiçbir değişikliği onaysız uygulamaz.</p>
        <Button onClick={() => { const n = structuredClone(state.integrations); n.ai = ai; setConfig("integrations", n, "AI analiz ayarları güncellendi"); toast.success("Kaydedildi"); }}>Kaydet</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Test et</h3>
        <div className="flex flex-wrap gap-2">
          <Select value={projectId} onValueChange={setProjectId}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{state.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.customerName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={source} onValueChange={(v) => setSource(v as "teams" | "email")}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="teams">Teams</SelectItem><SelectItem value="email">E-posta</SelectItem></SelectContent>
          </Select>
        </div>
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Örn: Kurulum tamamlandı. Test verilerini Sevcan 12.10.2026 tarihine kadar gönderecek. Lisans onayı ertelendi, bu bir risk." />
        <Button disabled={!text.trim()} onClick={() => {
          const r = simulateIncoming(projectId, source, text, { title: source === "teams" ? "Test mesajı" : "Test e-postası", from: "Test kullanıcısı", direction: "in" });
          setResult({ list: r.created, message: r.message });
        }}>Analiz et</Button>
        {result && (result.list.length
          ? <div className="space-y-2">{result.list.map((i) => <InsightCard key={i.id} insight={live.find((x) => x.id === i.id) ?? i} />)}</div>
          : <p className="text-sm text-muted-foreground">{result.message}</p>)}
      </Card>
    </div>
  );
}
