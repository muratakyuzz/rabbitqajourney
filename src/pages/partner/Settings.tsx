import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isPartnerTierEnabledType } from "@/lib/partner-options";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { getMyPartner, updateMyPartner, type Partner } from "@/lib/partners-api";
import { listMyCompanyUsers, type UserRecord } from "@/lib/users-api";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

interface CompanyForm {
  name: string;
  website: string;
  address: string;
  country: string;
  city: string;
}

const COUNTRY_CITY_MAP: Record<string, string[]> = {
  "United States": ["New York", "Austin", "San Francisco"],
  "United Kingdom": ["London", "Manchester", "Bristol"],
  Germany: ["Berlin", "Munich", "Hamburg"],
  France: ["Paris", "Lyon", "Marseille"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  Australia: ["Sydney", "Melbourne", "Brisbane"],
  Netherlands: ["Amsterdam", "Rotterdam", "Utrecht"],
  Spain: ["Madrid", "Barcelona", "Valencia"],
  Italy: ["Milan", "Rome", "Turin"],
  Japan: ["Tokyo", "Osaka", "Nagoya"],
  India: ["Bengaluru", "Mumbai", "Pune"],
  Brazil: ["Sao Paulo", "Rio de Janeiro", "Curitiba"],
  Singapore: ["Central Region", "North Region", "West Region"],
};

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toCompanyForm(partner: Partner): CompanyForm {
  return {
    name: partner.name ?? "",
    website: partner.website ?? "",
    address: partner.address ?? "",
    country: partner.country ?? "",
    city: partner.city ?? "",
  };
}

export default function PartnerSettings() {
  const { token } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState<CompanyForm>({
    name: "",
    website: "",
    address: "",
    country: "",
    city: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPartner = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyPartner(token);
      setPartner(data);
      setForm(toCompanyForm(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company info");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPartner();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsUsersLoading(true);
      setUsersError(null);
      try {
        const rows = await listMyCompanyUsers(token);
        setCompanyUsers(rows);
      } catch (err) {
        setUsersError(err instanceof Error ? err.message : "Failed to load company users");
      } finally {
        setIsUsersLoading(false);
      }
    })();
  }, [token]);

  const handleFormChange = (field: keyof CompanyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      country: value,
      city: COUNTRY_CITY_MAP[value]?.includes(prev.city) ? prev.city : "",
    }));
  };

  const handleSave = async () => {
    if (!token || !partner) return;
    setIsSaving(true);
    try {
      const updated = await updateMyPartner(token, {
        name: form.name.trim(),
        website: normalizeNullableString(form.website),
        address: normalizeNullableString(form.address),
        country: normalizeNullableString(form.country),
        city: normalizeNullableString(form.city),
      });
      setPartner(updated);
      setForm(toCompanyForm(updated));
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const countryOptions = useMemo(() => {
    const base = Object.keys(COUNTRY_CITY_MAP);
    if (form.country && !base.includes(form.country)) {
      return [form.country, ...base];
    }
    return base;
  }, [form.country]);

  const cityOptions = useMemo(() => {
    const base = COUNTRY_CITY_MAP[form.country] ?? [];
    if (form.city && !base.includes(form.city)) {
      return [form.city, ...base];
    }
    return base;
  }, [form.country, form.city]);

  if (isLoading) {
    return <LoadingState variant="detail" />;
  }

  if (error || !partner) {
    return <ErrorState title="Settings unavailable" description={error ?? "Company info is not available."} onRetry={() => void loadPartner()} />;
  }

  const formatUserName = (user: UserRecord) => {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return fullName || user.email;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage company details, users, and notification preferences." />

      <div className="max-w-4xl">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <CardTitle className="text-base">Company Information</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge>{partner.partnerType ?? "N/A"}</Badge>
                  {isPartnerTierEnabledType(partner.partnerType) && partner.partnerTier ? <Badge variant="secondary">{partner.partnerTier}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={form.name} onChange={(event) => handleFormChange("name", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={form.website} onChange={(event) => handleFormChange("website", event.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={form.address} onChange={(event) => handleFormChange("address", event.target.value)} className="min-h-20 resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={form.country || undefined} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((countryName) => (
                          <SelectItem key={countryName} value={countryName}>
                            {countryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select
                      value={form.city || undefined}
                      onValueChange={(value) => handleFormChange("city", value)}
                      disabled={!form.country}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.country ? "Select city" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((cityName) => (
                          <SelectItem key={cityName} value={cityName}>
                            {cityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Team Members</CardTitle>
                <Button size="sm" onClick={() => toast.info("Invite dialog coming soon")}>
                  Invite User
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Loading users...</TableCell>
                      </TableRow>
                    ) : usersError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-destructive py-8">{usersError}</TableCell>
                      </TableRow>
                    ) : companyUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No users found for your company.</TableCell>
                      </TableRow>
                    ) : (
                      companyUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{formatUserName(user)}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role === "PARTNER_USER" ? "User" : "Admin"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "ACTIVE" ? "default" : "outline"}>
                              {user.status === "ACTIVE" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
