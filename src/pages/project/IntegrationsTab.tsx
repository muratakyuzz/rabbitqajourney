import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/rq/Badges";
import { InsightCard } from "@/components/rq/InsightCard";
import { useAuth } from "@/lib/auth-context";
import { canManageIntegrations, canSetProjectIntegration } from "@/lib/rabbitqa/perm";
import { useRq } from "@/lib/rabbitqa/store";
import { projectDomains } from "@/lib/rabbitqa/email-match";
import { fmtDate } from "@/lib/rabbitqa/labels";
import type { Project } from "@/lib/rabbitqa/types";

function SystemWarning({ text, isAdmin }: { text: string; isAdmin: boolean }) {
  return (
    <p className="rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0" />{text}
      {isAdmin && <Link to="/app/admin" className="ml-auto text-primary underline whitespace-nowrap">Sistem ayarları</Link>}
    </p>
  );
}

export function IntegrationsTab({ project }: { project: Project }) {
  const { state, setProjectIntegration } = useRq();
  const { user } = useAuth();
  const edit = canSetProjectIntegration(user, project);
  const isAdmin = canManageIntegrations(user);
  const [domain, setDomain] = useState("");
  const teamsOn = state.integrations.chat.teams.connected;
  const mailOn = state.integrations.email.enabled;
  const pi = project.integrations;
  const channel = state.chatChannels.find((c) => c.id === pi.chat.channelId);
  const contactEmails = state.contacts.filter((c) => c.projectId === project.id && c.email).map((c) => c.email);
  const derived = projectDomains(state, project.id).filter((d) => !pi.email.extraDomains.includes(d));
  const insights = state.insights.filter((i) => i.projectId === project.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  const apply = (p: Parameters<typeof setProjectIntegration>[1]) => {
    const err = setProjectIntegration(project.id, p);
    if (err) toast.error(err); else toast.success("Entegrasyon güncellendi");
  };
  const owner = (chId: string) => state.projects.find((p) => p.id !== project.id && p.integrations.chat.channelId === chId && p.integrations.chat.active);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className={!teamsOn ? "opacity-80" : ""}>
        <CardHeader><CardTitle className="text-base">Sohbet kanalı</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!teamsOn && <SystemWarning text="Sistem ayarlarından Teams bağlantısı kurulmalı." isAdmin={isAdmin} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Sağlayıcı</Label>
              <Select value={pi.chat.provider} disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="teams">Microsoft Teams</SelectItem><SelectItem value="slack" disabled>Slack (Yakında)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Kanal</Label>
              <Select value={pi.chat.channelId ?? "__none"} disabled={!edit || !teamsOn} onValueChange={(v) => apply({ chat: { channelId: v === "__none" ? null : v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Seçilmedi</SelectItem>
                  {state.chatChannels.filter((c) => c.provider === "teams").map((c) => {
                    const o = owner(c.id);
                    return <SelectItem key={c.id} value={c.id} disabled={!!o}>{c.teamName} › {c.channelName}{o ? ` (${o.customerName})` : ""}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><Switch checked={pi.chat.active} disabled={!edit || !teamsOn || !pi.chat.channelId} onCheckedChange={(c) => apply({ chat: { active: c } })} />{pi.chat.active ? "Aktif" : "Pasif"}</label>
            {channel && <a href={channel.webUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />Kanala git</a>}
          </div>
          {pi.chat.active && pi.chat.since && <p className="text-xs text-muted-foreground">Dinleniyor: {fmtDate(pi.chat.since)} tarihinden beri</p>}
        </CardContent>
      </Card>

      <Card className={!mailOn ? "opacity-80" : ""}>
        <CardHeader><CardTitle className="text-base">E-posta takibi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!mailOn && <SystemWarning text="Sistem ayarlarından e-posta dinleme açılmalı." isAdmin={isAdmin} />}
          <label className="flex items-center gap-2 text-sm"><Switch checked={pi.email.active} disabled={!edit || !mailOn} onCheckedChange={(c) => apply({ email: { active: c } })} />{pi.email.active ? "Aktif" : "Pasif"}</label>
          {pi.email.active && pi.email.since && <p className="text-xs text-muted-foreground">Dinleniyor: {fmtDate(pi.email.since)} tarihinden beri</p>}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Eşleşmede kullanılan adresler (müşteri kişileri)</p>
            {contactEmails.length ? <div className="flex flex-wrap gap-1.5">{contactEmails.map((e) => <Pill key={e} tone="muted">{e}</Pill>)}</div> : <p className="text-sm text-muted-foreground">Kişilerde e-posta adresi yok.</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Domainler</p>
            <div className="flex flex-wrap gap-1.5">
              {derived.map((d) => <Pill key={d} tone="muted">{d}</Pill>)}
              {pi.email.extraDomains.map((d) => (
                <Pill key={d} tone="info">{d}{edit && <button aria-label={`${d} kaldır`} onClick={() => apply({ email: { extraDomains: pi.email.extraDomains.filter((x) => x !== d) } })}><X className="h-3 w-3" /></button>}</Pill>
              ))}
              {!derived.length && !pi.email.extraDomains.length && <span className="text-sm text-muted-foreground">Domain yok.</span>}
            </div>
            {edit && (
              <div className="flex gap-2 mt-2 max-w-sm">
                <Input placeholder="ornek.com.tr" value={domain} onChange={(e) => setDomain(e.target.value)} />
                <Button variant="outline" size="sm" onClick={() => {
                  const d = domain.trim().toLowerCase().replace(/^@/, "");
                  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return toast.error("Geçerli bir domain girin");
                  if (pi.email.extraDomains.includes(d)) return toast.error("Bu domain zaten ekli");
                  apply({ email: { extraDomains: [...pi.email.extraDomains, d] } }); setDomain("");
                }}><Plus className="h-4 w-4 mr-1" />Ekle</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Son AI önerileri</CardTitle>
          <Button asChild variant="outline" size="sm"><Link to={`/app/insights?project=${project.id}`}>Tümünü AI Insight'ta gör</Link></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length ? insights.map((i) => <InsightCard key={i.id} insight={i} showProject={false} />) : <EmptyState title="Bu projede AI önerisi yok" description="Kanal veya e-posta takibi açıldığında öneriler burada görünür." />}
        </CardContent>
      </Card>
    </div>
  );
}
