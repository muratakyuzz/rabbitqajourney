import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";
import { HealthBadge } from "@/components/rq/Badges";
import { useAuth } from "@/lib/auth-context";
import { activePhase, personName, projectProgress, useRq } from "@/lib/rabbitqa/store";
import { visibleProjects, isAllSeeing } from "@/lib/rabbitqa/perm";
import { fmtDate, HEALTH_LABEL, todayISO } from "@/lib/rabbitqa/labels";
import { toast } from "sonner";

export default function Projects() {
  const { state, createProject } = useRq();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [csm, setCsm] = useState("all");
  const [health, setHealth] = useState("all");
  const [phase, setPhase] = useState("all");
  const [open, setOpen] = useState(false);

  const csms = state.users.filter((u) => u.role === "csm");
  const rows = useMemo(() => {
    return visibleProjects(state, user)
      .map((p) => ({ p, ph: activePhase(state, p.id), progress: projectProgress(state, p.id) }))
      .filter(({ p, ph }) =>
        (q === "" || `${p.customerName} ${p.name}`.toLowerCase().includes(q.toLowerCase())) &&
        (csm === "all" || p.csmId === csm) &&
        (health === "all" || p.health === health) &&
        (phase === "all" || ph?.code === phase),
      );
  }, [state, user, q, csm, health, phase]);

  const canCreate = user?.role === "csm" || isAllSeeing(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri projeleri"
        subtitle="Tüm onboarding projelerinin durumu"
        action={canCreate ? { label: "Yeni proje", onClick: () => setOpen(true), icon: <Plus className="h-4 w-4 mr-1" /> } : undefined}
      />

      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Müşteri veya proje ara" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={csm} onValueChange={setCsm}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm CSM'ler</SelectItem>
            {csms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={health} onValueChange={setHealth}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm sağlık</SelectItem>
            {Object.entries(HEALTH_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm aşamalar</SelectItem>
            {state.template.map((p) => <SelectItem key={p.code} value={p.code}>{p.code} — {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Proje bulunamadı" description="Filtreleri değiştirin veya yeni proje oluşturun." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>CSM</TableHead>
                <TableHead>Aktif aşama</TableHead>
                <TableHead className="w-44">İlerleme</TableHead>
                <TableHead>Sağlık</TableHead>
                <TableHead>Go-Live</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ p, ph, progress }) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/app/projects/${p.id}`)}>
                  <TableCell>
                    <Link to={`/app/projects/${p.id}`} className="font-medium text-foreground hover:text-primary">{p.customerName}</Link>
                    <div className="text-xs text-muted-foreground">{p.name}</div>
                  </TableCell>
                  <TableCell>{personName(state, p.csmId)}</TableCell>
                  <TableCell>{ph ? `${ph.code} — ${ph.name}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2" />
                      <span className="text-xs text-muted-foreground w-9">%{progress}</span>
                    </div>
                  </TableCell>
                  <TableCell><HealthBadge health={p.health} /></TableCell>
                  <TableCell>{fmtDate(p.goLiveDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <NewProjectDialog
        open={open}
        onOpenChange={setOpen}
        defaultCsm={user?.role === "csm" ? user.id : null}
        canAssignCsm={isAllSeeing(user)}
        onCreate={(input) => {
          const id = createProject(input);
          toast.success("Proje oluşturuldu, aşamalar şablondan kopyalandı");
          navigate(`/app/projects/${id}`);
        }}
      />
    </div>
  );
}

function NewProjectDialog({
  open, onOpenChange, defaultCsm, canAssignCsm, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCsm: string | null;
  canAssignCsm: boolean;
  onCreate: (p: Parameters<ReturnType<typeof useRq>["createProject"]>[0]) => void;
}) {
  const { state } = useRq();
  const [customerName, setCustomerName] = useState("");
  const [name, setName] = useState("RabbitQA Customer Onboarding");
  const [csmId, setCsmId] = useState<string>(defaultCsm ?? "none");
  const [salespersonId, setSalespersonId] = useState<string>("none");
  const [licenseModel, setLicenseModel] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(todayISO());
  const [goLiveDate, setGoLiveDate] = useState("");

  const submit = () => {
    if (!customerName.trim() || !goLiveDate) return toast.error("Müşteri adı ve Go-Live tarihi zorunlu");
    onCreate({
      customerName: customerName.trim(), name, csmId: csmId === "none" ? null : csmId, salespersonId: salespersonId === "none" ? null : salespersonId,
      licenseModel, purchasedModules: modules, startDate, goLiveDate,
    });
    onOpenChange(false);
    setCustomerName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni onboarding projesi</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Müşteri adı</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Proje adı</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>CSM</Label>
              <Select value={csmId} onValueChange={setCsmId} disabled={!canAssignCsm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atanmadı</SelectItem>
                  {state.users.filter((u) => u.role === "csm").map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Satışçı</Label>
              <Select value={salespersonId} onValueChange={setSalespersonId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {state.salespeople.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>Lisans modeli</Label><Input value={licenseModel} onChange={(e) => setLicenseModel(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Başlangıç</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Hedef Go-Live</Label><Input type="date" value={goLiveDate} onChange={(e) => setGoLiveDate(e.target.value)} /></div>
          </div>
          <div className="grid gap-2">
            <Label>Satın alınan modüller</Label>
            <div className="grid grid-cols-3 gap-2">
              {state.modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={modules.includes(m)} onCheckedChange={(c) => setModules((x) => (c ? [...x, m] : x.filter((y) => y !== m)))} />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={submit}>Oluştur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
