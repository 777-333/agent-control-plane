import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Role = "admin" | "member" | "viewer";

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", member: "Mitglied", viewer: "Betrachter" };
const ROLES: Role[] = ["admin", "member", "viewer"];

export default function Team() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const overviewQuery = trpc.team.overview.useQuery();
  const invitesQuery = trpc.team.myInvites.useQuery();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");

  const refresh = () => {
    void utils.team.overview.invalidate();
    void utils.team.myInvites.invalidate();
  };
  const reloadAll = () => window.location.reload();

  const inviteMut = trpc.team.invite.useMutation({
    onSuccess: () => { setInviteEmail(""); refresh(); toast.success("Einladung erstellt."); },
    onError: e => toast.error(e.message),
  });
  const cancelMut = trpc.team.cancelInvite.useMutation({ onSuccess: () => { refresh(); toast.success("Einladung zurückgezogen."); }, onError: e => toast.error(e.message) });
  const roleMut = trpc.team.changeRole.useMutation({ onSuccess: () => { refresh(); toast.success("Rolle aktualisiert."); }, onError: e => toast.error(e.message) });
  const removeMut = trpc.team.removeMember.useMutation({ onSuccess: () => { refresh(); toast.success("Mitglied entfernt."); }, onError: e => toast.error(e.message) });
  const renameMut = trpc.team.renameOrg.useMutation({ onSuccess: () => { refresh(); toast.success("Organisation umbenannt."); }, onError: e => toast.error(e.message) });
  const acceptMut = trpc.team.acceptInvite.useMutation({ onSuccess: () => { toast.success("Einladung angenommen."); reloadAll(); }, onError: e => toast.error(e.message) });
  const leaveMut = trpc.team.leave.useMutation({ onSuccess: () => { toast.success("Organisation verlassen."); reloadAll(); }, onError: e => toast.error(e.message) });

  const overview = overviewQuery.data;
  const myInvites = invitesQuery.data ?? [];
  const isAdmin = overview?.myRole === "admin";
  const [orgName, setOrgName] = useState("");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Team & Mitglieder</h1>
          <p className="text-sm text-muted-foreground">Kollegen einladen, Rollen verwalten und Organisation umbenennen.</p>
        </div>
      </div>

      {/* Invitations addressed to me */}
      {myInvites.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Einladungen für dich</CardTitle>
            <CardDescription>Du wurdest in folgende Organisation(en) eingeladen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {myInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <span className="text-sm">
                  <strong>{inv.orgName}</strong> · Rolle: {ROLE_LABEL[inv.role as Role]}
                </span>
                <Button size="sm" disabled={acceptMut.isPending} onClick={() => acceptMut.mutate({ id: inv.id })}>
                  Beitreten
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current org + members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {overview ? overview.org.name : "Organisation"}
            {overview && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Deine Rolle: {ROLE_LABEL[overview.myRole]}
              </span>
            )}
          </CardTitle>
          <CardDescription>Mitglieder dieser Organisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {overviewQuery.isLoading || !overview ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
            </div>
          ) : (
            <>
              {isAdmin && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="orgname" className="text-sm">Organisationsname ändern</Label>
                    <Input id="orgname" placeholder={overview.org.name} value={orgName} onChange={e => setOrgName(e.target.value)} />
                  </div>
                  <Button variant="outline" disabled={renameMut.isPending || orgName.trim().length < 2} onClick={() => renameMut.mutate({ name: orgName.trim() })}>
                    Umbenennen
                  </Button>
                </div>
              )}

              <div className="divide-y">
                {overview.members.map(member => {
                  const isMe = member.openId === user?.openId;
                  return (
                    <div key={member.openId} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {member.name || member.email || member.openId}
                          {isMe && <span className="ml-2 text-xs text-muted-foreground">(du)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && !isMe ? (
                          <>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              value={member.role}
                              onChange={e => roleMut.mutate({ openId: member.openId, role: e.target.value as Role })}
                            >
                              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                            </select>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeMut.mutate({ openId: member.openId })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{ROLE_LABEL[member.role]}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leave (only meaningful in a shared org) */}
              {overview.org.id !== user?.openId && (
                <Button variant="outline" size="sm" disabled={leaveMut.isPending} onClick={() => leaveMut.mutate()}>
                  Organisation verlassen
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite + pending (admin only) */}
      {isAdmin && overview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mitglied einladen</CardTitle>
            <CardDescription>Die Person tritt nach Bestätigung beim Login bei.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="invite-email" className="text-sm">E-Mail</Label>
                <Input id="invite-email" type="email" placeholder="kollege@firma.de" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite-role" className="text-sm">Rolle</Label>
                <select id="invite-role" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
              <Button disabled={inviteMut.isPending || !inviteEmail.includes("@")} onClick={() => inviteMut.mutate({ email: inviteEmail, role: inviteRole })}>
                <Mail className="mr-2 h-4 w-4" /> Einladen
              </Button>
            </div>

            {overview.invites.length > 0 && (
              <div className="divide-y">
                {overview.invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>{inv.email} · {ROLE_LABEL[inv.role]} · offen</span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => cancelMut.mutate({ id: inv.id })}>
                      Zurückziehen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Hinweis: Es gibt aktuell keinen automatischen E-Mail-Versand – teile der eingeladenen Person mit, dass sie sich anmelden und die Einladung hier annehmen kann.
      </p>
    </div>
  );
}
