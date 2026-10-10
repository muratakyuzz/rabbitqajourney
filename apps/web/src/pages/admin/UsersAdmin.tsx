import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { useRq } from "@/lib/rabbitqa/store";
import { ROLE_LABEL } from "@rabbitqa/shared/domain/labels";
import type { Role } from "@rabbitqa/shared/domain/types";

export function UsersAdmin() {
  const { state, addUser, updateUser } = useRq();
  const [f, setF] = useState<{ name: string; email: string; role: Role }>({ name: "", email: "", role: "csm" });
  const run = (err: string | null, ok: string) => (err ? toast.error(err) : toast.success(ok));

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Input className="w-56" placeholder="Ad Soyad" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Ad" />
        <Input className="w-64" placeholder="E-posta" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="E-posta" />
        <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as Role })}>
          <SelectTrigger className="w-56" aria-label="Rol"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => { const err = addUser(f); run(err, "Kullanıcı eklendi"); if (!err) setF({ name: "", email: "", role: "csm" }); }}><Plus className="h-4 w-4 mr-1" />Kullanıcı ekle</Button>
      </div>
      {state.users.length === 0 ? <EmptyState title="Kullanıcı yok" description="İlk kullanıcıyı ekleyin." /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>E-posta</TableHead><TableHead>Rol</TableHead><TableHead>Durum</TableHead><TableHead className="w-36" /></TableRow></TableHeader>
          <TableBody>{state.users.map((u) => {
            const active = u.active !== false;
            return (
              <TableRow key={u.id} className={active ? "" : "opacity-60"}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => run(updateUser(u.id, { role: v as Role }), "Rol güncellendi")}>
                    <SelectTrigger className="w-56" aria-label={`${u.name} rolü`}><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Pill tone={active ? "success" : "muted"}>{active ? "Aktif" : "Pasif"}</Pill></TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => run(updateUser(u.id, { active: !active }), active ? "Kullanıcı pasifleştirildi" : "Kullanıcı aktifleştirildi")}>
                    {active ? "Pasifleştir" : "Aktifleştir"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table>
      )}
      <p className="text-xs text-muted-foreground">Kullanıcılar silinmez. Pasif kullanıcı giriş yapamaz ve yeni atamalarda seçilemez; eski kayıtlarda adı görünmeye devam eder.</p>
    </Card>
  );
}
