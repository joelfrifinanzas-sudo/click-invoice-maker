import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailPlus, ShieldCheck, ShieldAlert } from "lucide-react";

// Roles y estatus soportados por company_members
const ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "CAJERA", "CLIENTE"] as const;
const STATUSES = ["active", "invited", "inactive"] as const;
type Role = typeof ROLES[number];
type Status = typeof STATUSES[number];

type Member = {
  id: string;
  email: string;
  user_id: string | null;
  role: Role;
  status: Status;
  created_at: string;
};

export default function UsuariosPermisos() {
  const { toast } = useToast();
  const { role: myRole } = useUserRole();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "supervisor" | "cajera">("cajera");
  const [sending, setSending] = useState(false);

  const canManage = myRole === "superadmin" || myRole === "admin";
  const canChangeSensitive = myRole === "superadmin"; // Cambiar rol/estatus

  useEffect(() => {
    document.title = "Usuarios y permisos | Gestión de miembros";
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = `${window.location.origin}/usuarios`;
    document.head.appendChild(link);
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Usuarios y permisos: invita, gestiona roles y estado por empresa.";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingCtx(true);
      const ctx = await getCurrentContext();
      if (!ctx.data) {
        setCompanyId(null);
      } else {
        setCompanyId(ctx.data.companyId);
      }
      setLoadingCtx(false);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    void fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, pageSize, search]);

  const fetchMembers = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const query = supabase
        .from("company_members")
        .select("id,email,user_id,role,status,created_at", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .range(from, to);
      const q = search.trim() ? query.ilike("email", `%${search.trim()}%`) : query;
      const { data, error, count } = await q;
      if (error) throw error;
      setMembers((data || []) as Member[]);
      setTotal(count || 0);
    } catch (e: any) {
      toast({ title: "No se pudo cargar la lista", description: e?.message || "Intente más tarde", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resendInvite = async (m: Member) => {
    try {
      if (m.status !== 'invited') {
        toast({ title: 'Solo para invitados', description: 'Reenviar aplica cuando el estado es "invited".' });
        return;
      }
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email: m.email, options: { shouldCreateUser: true, emailRedirectTo: redirectUrl } });
      if (error) throw error;
      toast({ title: "Invitación reenviada", description: `Se envió enlace a ${m.email}` });
    } catch (e: any) {
      toast({ title: "No se pudo reenviar", description: e?.message || "Intente más tarde", variant: "destructive" });
    }
  };

  const changeRole = async (m: Member, newRole: Role) => {
    if (!canChangeSensitive) return;
    try {
      const { error } = await supabase.from("company_members").update({ role: newRole }).eq("id", m.id);
      if (error) throw error;
      toast({ title: "Rol actualizado", description: `${m.email} → ${newRole}` });
      void fetchMembers();
    } catch (e: any) {
      toast({ title: "No se pudo cambiar el rol", description: e?.message || "Revise permisos", variant: "destructive" });
    }
  };

  const toggleActive = async (m: Member) => {
    if (!canChangeSensitive) return;
    try {
      const next: Status = m.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("company_members").update({ status: next }).eq("id", m.id);
      if (error) throw error;
      toast({ title: next === "active" ? "Miembro activado" : "Miembro desactivado", description: m.email });
      void fetchMembers();
    } catch (e: any) {
      toast({ title: "No se pudo actualizar el estado", description: e?.message || "Revise permisos", variant: "destructive" });
    }
  };

  const handleCreateUser = async () => {
    if (!canManage) return;
    const email = createEmail.trim().toLowerCase();
    const password = createPassword;
    const role = createRole;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      toast({ title: "Email inválido", description: "Revisa el formato del correo", variant: "destructive" });
      return;
    }
    if (!password || password.length < 8) {
      toast({ title: "Contraseña inválida", description: "Mínimo 8 caracteres", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email, password, role },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Usuario creado con éxito", description: email });
      setInviteOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("cajera");
    } catch (e: any) {
      toast({ title: "No se pudo crear", description: e?.message || "Intente más tarde", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Usuarios y permisos</h1>
        <p className="text-sm text-muted-foreground">Gestiona miembros de tu empresa: invitaciones, roles y estado.</p>
      </header>

      <Card className="mb-4">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Miembros</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-[220px]"
            />
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canManage}><MailPlus className="mr-2 h-4 w-4" /> + Crear usuario</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-sm">Correo electrónico</label>
                    <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="usuario@correo.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Contraseña</label>
                    <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Rol</label>
                    <Select value={createRole} onValueChange={(v) => setCreateRole(v as "admin" | "supervisor" | "cajera")}>
                      <SelectTrigger><SelectValue placeholder="Selecciona rol" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="cajera">Cajera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateUser} disabled={!canManage || sending || !createEmail || !createPassword}>
                    {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <RolesMatrix />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Miembros de la empresa</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCtx || loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">Sin resultados</TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{m.role}</Badge>
                        {canChangeSensitive && (
                          <Select value={m.role} onValueChange={(v) => changeRole(m, v as Role)}>
                            <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'active' ? 'default' : (m.status === 'invited' ? 'secondary' : 'outline')}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => resendInvite(m)} title="Reenviar invitación">
                          <MailPlus className="h-4 w-4 mr-1" /> Reenviar
                        </Button>
                        {canChangeSensitive && (
                          <Button variant="outline" size="sm" onClick={() => toggleActive(m)}>
                            {m.status === 'active' ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages} · {total} registros</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function RolesMatrix() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary"><ShieldCheck className="mr-2 h-4 w-4" /> Ver roles</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permisos por rol</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <RoleCard title="SUPER_ADMIN" bullets={[
            "Acceso total (todas las acciones)",
            "Puede cambiar roles y estado",
          ]} />
          <RoleCard title="ADMIN" bullets={[
            "Gestiona datos de negocio (crear/editar/eliminar)",
            "No puede cambiar roles/estado",
          ]} />
          <RoleCard title="SUPERVISOR" bullets={[
            "Ver/editar clientes y facturas",
          ]} />
          <RoleCard title="CAJERA" bullets={[
            "Crear facturas y registrar pagos",
          ]} />
          <RoleCard title="CLIENTE" bullets={[
            "Ver sus facturas (si aplica)",
          ]} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> {title}</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <ul className="list-disc pl-5 text-xs space-y-1">
          {bullets.map((b, i) => (<li key={i}>{b}</li>))}
        </ul>
      </CardContent>
    </Card>
  );
}
