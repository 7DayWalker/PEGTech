/** Sign in page — staff and client login. */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../lib/Toast";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { GlowBackground } from "../components/GlowBackground";
import { Mail, Lock, LogIn } from "lucide-react";

export function SignIn() {
  useTitle("Sign in — PEGTech");
  const navigate = useNavigate();
  const { show } = useToast();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          login(data.access_token, {
            typ: data.typ,
            role: data.role,
            name: data.name,
            email: form.email.toLowerCase(),
            client_id: data.client_id ?? null,
          });
        }
        if (data.typ === "staff") {
          navigate("/admin");
        } else {
          // No standalone client portal exists yet — send clients home
          // rather than to a route that doesn't resolve to anything.
          navigate("/");
        }
      } else {
        const data = await res.json();
        show(data.detail || "Login failed", "error");
      }
    } catch {
      show("Login failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <GlowBackground />
      <Card padding="none" className="relative w-full max-w-md shadow-2xl shadow-accent/10 glass-card border-white/15">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight justify-center text-white">
              <span className="text-gradient">PEGTech</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="label-base flex items-center gap-2">
                <Mail size={18} className="text-gray-400" />
                Email
              </label>
              <input
                type="email"
                className="input-base"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label-base flex items-center gap-2">
                <Lock size={18} className="text-gray-400" />
                Password
              </label>
              <input
                type="password"
                className="input-base"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              <LogIn size={18} />
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            New to PEGTech?{" "}
            <Link
              to="/signup"
              className="text-gemini-blue hover:underline font-medium"
            >
              Request access
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
