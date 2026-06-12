import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(ms: number | null): string {
  if (!ms) return "–";
  return new Date(ms).toLocaleString("de-DE");
}

function CopyButton({ value, label = "Kopieren" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("In die Zwischenablage kopiert.");
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}

export default function ApiKeys() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://acc.3333.tools";
  const [label, setLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const keysQuery = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: result => {
      setCreatedKey(result.fullKey);
      setLabel("");
      void utils.apiKeys.list.invalidate();
      toast.success("API-Schlüssel erstellt. Bitte jetzt kopieren – er wird nur einmal angezeigt.");
    },
    onError: error => toast.error(error.message),
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      void utils.apiKeys.list.invalidate();
      toast.success("Schlüssel widerrufen.");
    },
    onError: error => toast.error(error.message),
  });

  const keyForSnippet = createdKey ?? "acp_DEIN_API_KEY";
  const snippet = `pip install -e sdk/python

from agent_control_plane import AgentControlPlane

acp = AgentControlPlane("${origin}", "${keyForSnippet}")

# Vor der Aktion fragen (blockiert, falls eine Freigabe nötig ist)
acp.ensure_allowed(agent_id=1, action_type="erp.payment.execute")

# ... deine eigentliche Aktion / dein LLM-Aufruf ...

# Danach melden
acp.ingest_audit(agent_id=1, category="Ops",
                 title="Aktion ausgeführt", detail="...")`;

  const keys = keysQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">API-Schlüssel & Integration</h1>
          <p className="text-sm text-muted-foreground">
            Erzeuge Schlüssel, um deine Agenten anzubinden. Jeder Schlüssel wirkt nur in deinem Bereich.
          </p>
        </div>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neuen Schlüssel erstellen</CardTitle>
          <CardDescription>Vergib einen Namen, z. B. „Produktions-Agent" oder „Test".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={label}
                onChange={event => setLabel(event.target.value)}
                placeholder="z. B. Produktions-Agent"
                maxLength={80}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ label: label.trim() || "Unbenannter Schlüssel" })}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Schlüssel erstellen
            </Button>
          </div>

          {createdKey && (
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Dein neuer Schlüssel – wird nur jetzt angezeigt, danach nie wieder:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background px-3 py-2 text-sm">{createdKey}</code>
                <CopyButton value={createdKey} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deine Schlüssel</CardTitle>
          <CardDescription>Nur Präfix und Metadaten – der vollständige Schlüssel wird nicht gespeichert.</CardDescription>
        </CardHeader>
        <CardContent>
          {keysQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Schlüssel. Erstelle oben deinen ersten.</p>
          ) : (
            <div className="divide-y">
              {keys.map(key => (
                <div key={key.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.label}</span>
                      {key.revokedAt && (
                        <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">widerrufen</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <code>{key.keyPrefix}…</code> · erstellt {formatDate(key.createdAt)} · zuletzt genutzt{" "}
                      {formatDate(key.lastUsedAt)}
                    </div>
                  </div>
                  {!key.revokedAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => revokeMutation.mutate({ id: key.id })}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Widerrufen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snippet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">So bindest du einen Agenten an (Python)</CardTitle>
          <CardDescription>
            Kopiere dieses Snippet in deinen Agenten. {createdKey ? "Dein neuer Schlüssel ist bereits eingesetzt." : "Ersetze acp_DEIN_API_KEY durch deinen Schlüssel."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
            <code>{snippet}</code>
          </pre>
          <CopyButton value={snippet} label="Snippet kopieren" />
        </CardContent>
      </Card>
    </div>
  );
}
