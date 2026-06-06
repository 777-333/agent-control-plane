import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { establishServerSession, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Complete the handshake if a Supabase session already exists
  // (e.g. after returning from a Google OAuth redirect).
  useEffect(() => {
    let cancelled = false;
    async function completeExistingSession() {
      if (!isSupabaseConfigured) {
        setBootstrapping(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token && !cancelled) {
        try {
          await establishServerSession(token);
          window.location.href = "/";
          return;
        } catch {
          // fall through to manual login
        }
      }
      if (!cancelled) setBootstrapping(false);
    }
    void completeExistingSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY setzen.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          toast.success("Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse und melde dich anschließend an.");
          setMode("signin");
          return;
        }
        await establishServerSession(data.session.access_token);
        window.location.href = "/";
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("Keine Sitzung erhalten.");
        await establishServerSession(data.session.access_token);
        window.location.href = "/";
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      toast.error("Supabase ist nicht konfiguriert.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) toast.error(error.message);
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Agent Control Plane</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Melde dich an, um fortzufahren." : "Erstelle ein Konto, um zu starten."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="name@unternehmen.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Mit Google anmelden
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Jetzt registrieren" : "Jetzt anmelden"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
