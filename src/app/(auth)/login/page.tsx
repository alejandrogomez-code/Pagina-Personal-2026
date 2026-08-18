"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded bg-accent">
          <span className="h-3 w-3 rounded-[3px] bg-accent-fg" />
        </div>
        <span className="text-base font-medium">Centro Personal</span>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-[13px] text-fg-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 w-full rounded border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-fg-muted" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 w-full rounded border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading} className="mt-1">
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </Card>
  );
}
