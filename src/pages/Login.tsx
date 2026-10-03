import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { demoUsers } from "@/lib/auth-api";
import { ROLE_LABEL } from "@/lib/rabbitqa/labels";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState(demoUsers[0].email);
  const [password, setPassword] = useState("demo");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (mail: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(mail, password || "demo");
      navigate("/app/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                <img src="/brand/logo-216.png" alt="RabbitQA logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">RabbitQA Onboarding</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Hoş geldiniz</h1>
            <p className="text-sm text-muted-foreground mt-1">Virgosol iç ekip girişi</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); doLogin(email); }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Şifremi unuttum</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Şifreyi göster">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Demo kullanıcılar (herhangi bir şifre geçerli)</p>
            <div className="grid gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => doLogin(u.email)}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">{u.name}</span>
                    <span className="block text-xs text-muted-foreground">{u.email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABEL[u.role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary p-12 relative overflow-hidden">
        <div className="relative text-primary-foreground max-w-lg space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Her müşterinin onboarding yolculuğu tek yerde</h2>
          <p className="text-lg opacity-80 leading-relaxed">
            Satış devrinden Go-Live'a kadar aşamaları, adımları, toplantıları ve topun kimde olduğunu takip edin.
          </p>
        </div>
      </div>
    </div>
  );
}
