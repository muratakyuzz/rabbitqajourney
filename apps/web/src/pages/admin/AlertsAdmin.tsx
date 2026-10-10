import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRq } from "@/lib/rabbitqa/store";
import { uid } from "@rabbitqa/shared/domain/seed";
import { fmtDate } from "@rabbitqa/shared/domain/labels";
import type { AlertThresholds, Holiday, Salesperson } from "@rabbitqa/shared/domain/types";

const THRESHOLD_ROWS: { key: keyof AlertThresholds; label: string; unit: string }[] = [
  { key: "phaseRiskDays", label: "Aşama risk altında — plan bitişine kalan", unit: "iş günü" },
  { key: "dueSoonDays", label: "Termin yaklaşıyor — terminine kalan", unit: "iş günü" },
  { key: "customerWaitDays", label: "Müşteride bekleyen adım — Sarı", unit: "iş günü" },
  { key: "customerWaitRedDays", label: "Müşteride bekleyen adım — Kırmızı", unit: "iş günü" },
  { key: "reqDocDays", label: "Gereksinim dokümanı — Kick-off sonrası", unit: "iş günü" },
  { key: "goLiveCommitDays", label: "Açık taahhüt — Go-Live'a kalan", unit: "iş günü" },
  { key: "credentialDays", label: "Erişim bilgisi süresi — dolmasına kalan", unit: "gün" },
  { key: "silentDays", label: "Sessiz proje — kayıtsız geçen", unit: "iş günü" },
];
const FIXED_RULES = [
  "Aşama gecikti (Kırmızı) — plan bitişi geçti", "Aksiyon/adım gecikti (Kırmızı) — termini geçti", "Satış devri eksik — teklif veya sözleşme yok",
  "Keşif eksik — zorunlu soru cevapsız", "KPI ölçülemez — başlangıç/hedef yok", "Lisans uyumsuzluğu — istenen modül satın alınmamış",
  "Rapor gönderilmedi — cuma ve sonrası",
];

export function AlertsAdmin() {
  const { state, setConfig } = useRq();
  const [th, setTh] = useState<AlertThresholds>(() => ({ ...state.alertThresholds }));
  const [hol, setHol] = useState<Holiday[]>(() => structuredClone(state.holidays));
  const [nd, setNd] = useState<Holiday>({ date: "", name: "", halfDay: false });
  const saveTh = () => {
    if (th.customerWaitRedDays < th.customerWaitDays) return toast.error("Kırmızı eşik Sarı eşikten küçük olamaz");
    const changed = THRESHOLD_ROWS.filter((r) => state.alertThresholds[r.key] !== th[r.key]).map((r) => `${r.label}: ${state.alertThresholds[r.key]} → ${th[r.key]}`);
    if (!changed.length) return toast.info("Değişiklik yok");
    setConfig("alertThresholds", th, `Uyarı eşikleri güncellendi (${changed.join("; ")})`);
    toast.success("Eşikler kaydedildi");
  };
  const saveHol = (list: Holiday[], label: string) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    setHol(sorted);
    setConfig("holidays", sorted, label);
  };
  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Uyarı eşikleri</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {THRESHOLD_ROWS.map((r) => (
            <div key={r.key} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{r.label}</span>
              <Input type="number" min={0} max={90} className="w-20" aria-label={r.label} value={th[r.key]} onChange={(e) => setTh({ ...th, [r.key]: Math.max(0, Math.min(90, Number(e.target.value) || 0)) })} />
              <span className="w-14 text-xs text-muted-foreground">{r.unit}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Eşiksiz kurallar: {FIXED_RULES.join(" · ")}
        </div>
        <Button onClick={saveTh}>Eşikleri kaydet</Button>
      </Card>
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Resmi tatiller</h3>
        <p className="text-xs text-muted-foreground">Tatiller iş günü hesaplarına girmez; yarım günler (arife) iş günü sayılır. Değişiklik yeni terminleri ve uyarıları hemen etkiler.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" className="w-40" value={nd.date} onChange={(e) => setNd({ ...nd, date: e.target.value })} aria-label="Tarih" />
          <Input className="w-64" placeholder="Tatil adı" value={nd.name} onChange={(e) => setNd({ ...nd, name: e.target.value })} />
          <label className="flex items-center gap-1 text-xs"><Checkbox checked={nd.halfDay} onCheckedChange={(c) => setNd({ ...nd, halfDay: !!c })} />Yarım gün</label>
          <Button size="sm" onClick={() => {
            if (!nd.date || !nd.name.trim()) return toast.error("Tarih ve ad zorunlu");
            if (hol.some((h) => h.date === nd.date)) return toast.error("Bu tarihte zaten tatil var");
            saveHol([...hol, { ...nd, name: nd.name.trim() }], `Tatil eklendi: ${fmtDate(nd.date)} ${nd.name.trim()}`);
            setNd({ date: "", name: "", halfDay: false }); toast.success("Tatil eklendi");
          }}><Plus className="h-4 w-4 mr-1" />Ekle</Button>
        </div>
        {hol.length === 0 ? <p className="text-sm text-muted-foreground">Tanımlı tatil yok.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Ad</TableHead><TableHead>Yarım gün</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>{hol.map((h, i) => (
              <TableRow key={h.date}>
                <TableCell className="whitespace-nowrap">{fmtDate(h.date)}</TableCell>
                <TableCell>
                  <Input value={h.name} onChange={(e) => setHol((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    onBlur={() => { const o = state.holidays.find((x) => x.date === h.date); if (o && o.name !== h.name && h.name.trim()) saveHol(hol, `Tatil adı değişti: ${fmtDate(h.date)} ${o.name} → ${h.name}`); }} />
                </TableCell>
                <TableCell><Checkbox checked={h.halfDay} onCheckedChange={(c) => saveHol(hol.map((x, j) => (j === i ? { ...x, halfDay: !!c } : x)), `Tatil ${fmtDate(h.date)} yarım gün: ${c ? "evet" : "hayır"}`)} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" aria-label="Sil" onClick={() => saveHol(hol.filter((_, j) => j !== i), `Tatil silindi: ${fmtDate(h.date)} ${h.name}`)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function SalespeopleAdmin() {
  const { state, setConfig } = useRq();
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<Record<string, string>>({});
  const save = (list: Salesperson[], label: string) => setConfig("salespeople", list, label);
  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2 max-w-md">
        <Input placeholder="Satışçı adı" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => {
          const n = name.trim();
          if (!n) return toast.error("Ad zorunlu");
          save([...state.salespeople, { id: uid("s"), name: n, active: true }], `Satışçı eklendi: ${n}`); setName(""); toast.success("Satışçı eklendi");
        }}><Plus className="h-4 w-4 mr-1" />Ekle</Button>
      </div>
      {state.salespeople.length === 0 ? <p className="text-sm text-muted-foreground">Henüz satışçı yok.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>Projeler</TableHead><TableHead>Durum</TableHead><TableHead className="w-40" /></TableRow></TableHeader>
          <TableBody>{state.salespeople.map((s) => {
            const n = edit[s.id] ?? s.name;
            const count = state.projects.filter((p) => p.salespersonId === s.id).length;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <Input value={n} onChange={(e) => setEdit({ ...edit, [s.id]: e.target.value })}
                    onBlur={() => { if (n.trim() && n !== s.name) { save(state.salespeople.map((x) => (x.id === s.id ? { ...x, name: n.trim() } : x)), `Satışçı adı değişti: ${s.name} → ${n.trim()}`); toast.success("Ad güncellendi"); } }} />
                </TableCell>
                <TableCell>{count}</TableCell>
                <TableCell>{s.active !== false ? <Badge variant="secondary">Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => {
                    const active = s.active === false;
                    save(state.salespeople.map((x) => (x.id === s.id ? { ...x, active } : x)), `Satışçı ${active ? "aktifleştirildi" : "pasifleştirildi"}: ${s.name}`);
                    toast.success(active ? "Aktifleştirildi" : "Pasifleştirildi");
                  }}>{s.active === false ? "Aktifleştir" : "Pasifleştir"}</Button>
                </TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table>
      )}
      <p className="text-xs text-muted-foreground">Pasif satışçı yeni projede ve Satış devri sekmesinde seçilemez; mevcut projelerde adı görünmeye devam eder.</p>
    </Card>
  );
}
