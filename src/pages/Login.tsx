import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@demo.dev");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(user.role === "ADMIN" ? "/app/admin/dashboard" : "/app/partner/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                <img src="/brand/logo-216.png" alt="App logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Your App</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Template demo (any password works):{" "}
              <span className="font-mono text-foreground">admin@demo.dev</span> (admin) or{" "}
              <span className="font-mono text-foreground">partner@demo.dev</span> (partner)
            </p>
          </div>
        </div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative text-primary-foreground max-w-lg space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Your product story goes here
          </h2>
          <p className="text-lg opacity-80 leading-relaxed">
            Replace this panel with your own messaging, imagery, or key stats.
          </p>
        </div>
      </div>
    </div>
  );
}
