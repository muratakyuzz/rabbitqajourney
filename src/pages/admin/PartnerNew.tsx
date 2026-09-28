import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { FormSection } from "@/components/FormSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { createPartner, deactivatePartner } from "@/lib/partners-api";
import { useAuth } from "@/lib/auth-context";
import {
  getAllowedPartnerTierOptions,
  getPartnerTypeOptions,
  isPartnerTierConfigurationEnabled,
  isPartnerTypeConfigurationEnabled,
  isPartnerTierAllowedForType,
  isPartnerTierEnabledType,
} from "@/lib/partner-options";

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

const countries = Object.keys(COUNTRY_CITY_MAP);

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function AdminPartnerNew() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [partnerTier, setPartnerTier] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPartnerTypeEnabled = isPartnerTypeConfigurationEnabled();
  const isPartnerTierEnabled = isPartnerTierConfigurationEnabled();
  const partnerTypeOptions = getPartnerTypeOptions();
  const isTierEnabledType = isPartnerTierEnabledType(partnerType);
  const allowedTiers = getAllowedPartnerTierOptions(partnerType);

  const handlePartnerTypeChange = (value: string) => {
    setPartnerType(value);
    if (!isPartnerTierAllowedForType(value, partnerTier)) {
      setPartnerTier("");
    }
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    if (!COUNTRY_CITY_MAP[value]?.includes(city)) {
      setCity("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const effectivePartnerType = isPartnerTypeEnabled ? partnerType : "Referral";

    if (isPartnerTypeEnabled && !effectivePartnerType) {
      toast.error("Partner type is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPartner(token, {
        name: name.trim(),
        partnerType: effectivePartnerType,
        partnerTier: isPartnerTierAllowedForType(effectivePartnerType, partnerTier) ? partnerTier.trim() || null : null,
        website: normalizeNullableString(website),
        country: normalizeNullableString(country),
        city: normalizeNullableString(city),
        address: normalizeNullableString(address),
      });

      if (status === "inactive") {
        await deactivatePartner(token, created.id);
      }

      toast.success("Partner created successfully");
      navigate("/app/admin/partners");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={() => navigate("/app/admin/partners")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Partners
      </button>
      <PageHeader title="New Partner" subtitle="Add a new partner organization" />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Organization Details</h3>
            </div>
            <div className="flex items-center gap-2 lg:ml-auto">
              <p className="text-xs font-medium text-muted-foreground">{status === "active" ? "Active" : "Inactive"}</p>
              <Switch checked={status === "active"} onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Enter website" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Select value={country || undefined} onValueChange={handleCountryChange}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((countryName) => (
                    <SelectItem key={countryName} value={countryName}>
                      {countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Select value={city || undefined} onValueChange={setCity} disabled={!country}>
                <SelectTrigger id="city">
                  <SelectValue placeholder={country ? "Select city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {(COUNTRY_CITY_MAP[country] ?? []).map((cityName) => (
                    <SelectItem key={cityName} value={cityName}>
                      {cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPartnerTypeEnabled ? (
            <FormSection title="Partner Classification">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="partnerType">Partner Type</Label>
                  <Select value={partnerType} onValueChange={handlePartnerTypeChange} disabled={partnerTypeOptions.length === 0}>
                    <SelectTrigger id="partnerType">
                      <SelectValue placeholder={partnerTypeOptions.length === 0 ? "Partner type is disabled in Configure" : "Select partner type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              {isPartnerTierEnabled ? (
                <div className="space-y-1.5">
                  <Label htmlFor="partnerTier">Partner Tier</Label>
                  <Select value={partnerTier} onValueChange={setPartnerTier} disabled={!isTierEnabledType}>
                    <SelectTrigger id="partnerTier">
                      <SelectValue placeholder={isTierEnabledType ? "Select partner tier" : "Tier available for Reseller and Technology only"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTiers.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              </div>
            </FormSection>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (isPartnerTypeEnabled && !partnerType) || !name.trim()}>
              <Save className="h-4 w-4 mr-1" /> {isSubmitting ? "Creating..." : "Create Partner"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
