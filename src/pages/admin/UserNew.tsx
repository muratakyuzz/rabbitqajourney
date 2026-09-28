import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { FormSection } from "@/components/FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { createUser } from "@/lib/users-api";
import { listPartners, type Partner } from "@/lib/partners-api";

export default function AdminUserNew() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await listPartners(token, "ACTIVE");
        setPartners(data);
      } catch {
        setPartners([]);
      }
    })();
  }, [token]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    if (!token) return;

    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First name, last name, and email are required.");
      return;
    }

    if (!partnerId) {
      setFormError("Partner organization is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createUser(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        partnerId,
      });
      toast.success("User created");
      navigate("/app/admin/users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate("/app/admin/users")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to Users</button>
      <PageHeader title="Add user" subtitle="Create a new user with the same contact profile fields." />
      <form onSubmit={onSubmit}>
        <FormSection title="Contact Information" description="Use the same add/edit structure as partner contact records.">
          {formError ? (
            <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-first-name">First Name</Label>
              <Input id="user-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-last-name">Last Name</Label>
              <Input id="user-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Phone</Label>
              <Input id="user-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-job-title">Job Title</Label>
              <Input id="user-job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="user-partner">Partner Organization</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger id="user-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Default Password</Label>
              <Input value="Password1!" disabled readOnly />
              <p className="text-xs text-muted-foreground">New users are created with the default password.</p>
            </div>
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={isSubmitting || !partnerId}><Save className="h-4 w-4 mr-1" /> {isSubmitting ? "Creating..." : "Create user"}</Button></div>
        </FormSection>
      </form>
    </div>
  );
}
