import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export type Company = {
  id?: string;
  name: string;
  rnc?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  itbis_rate?: number | null;
  active?: boolean;
  plan?: string;
  limit_invoices_per_month?: number | null;
  limit_users?: number | null;
  storage_limit_mb?: number | null;
};

type Member = { user_id: string; email: string | null; display_name: string | null; role: 'owner' | 'member' | 'manager' | 'supervisor' | 'user' | 'cashier' };

type DirectoryUser = { id: string; email: string | null; display_name: string | null };

export default function CompanyForm({ company, onSaved }: { company?: Company; onSaved: () => void }) {
  const [form, setForm] = useState<Company>({
    id: company?.id,
    name: company?.name ?? "",
    rnc: company?.rnc ?? "",
    phone: company?.phone ?? "",
    address: company?.address ?? "",
    currency: company?.currency ?? "DOP",
    itbis_rate: company?.itbis_rate ?? 0.18,
    active: company?.active ?? true,
    plan: company?.plan ?? "free",
    limit_invoices_per_month: company?.limit_invoices_per_month ?? null,
    limit_users: company?.limit_users ?? null,
    storage_limit_mb: company?.storage_limit_mb ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'datos' | 'usuarios' | 'plan'>("datos");

  // NCF state
  const [ncfTypes, setNcfTypes] = useState<{ ncf_type: string; next_seq: number }[]>([]);
  const [newType, setNewType] = useState("");
  const [newSeq, setNewSeq] = useState<number | "">("");

  // Memberships state (Usuarios tab)
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [userResults, setUserResults] = useState<DirectoryUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  type UiRole = 'admin' | 'cajera';
  const [newMemberRole, setNewMemberRole] = useState<UiRole>('admin');

  // Owner selection for new company
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Load NCFs for existing company
  useEffect(() => {
    if (company?.id) {
      supabase.rpc("su_list_ncf_sequences", { _company_id: company.id }).then(({ data }) => {
        if (Array.isArray(data)) {
          setNcfTypes(data.map((d: any) => ({ ncf_type: d.ncf_type, next_seq: Number(d.next_seq || 0) })));
        }
      });
    }
  }, [company?.id]);

  // Load members for existing company
  const fetchMembers = async () => {
    if (!form.id) return;
    setLoadingMembers(true);
    const { data } = await supabase.rpc("su_company_members", { _company_id: form.id });
    setMembers(((data || []) as Member[]));
    setLoadingMembers(false);
  };
  useEffect(() => {
    if (activeTab === 'usuarios' && form.id) fetchMembers();
  }, [activeTab, form.id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name.includes("itbis") ? Number(value) : value }));
  };

  const onToggle = (checked: boolean) => setForm((f) => ({ ...f, active: checked }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("su_company_upsert", {
      _id: form.id ?? null,
      _name: form.name,
      _rnc: form.rnc ?? null,
      _phone: form.phone ?? null,
      _address: form.address ?? null,
      _currency: form.currency ?? "DOP",
      _itbis_rate: form.itbis_rate ?? 0.18,
      _active: form.active ?? true,
      _plan: form.plan ?? "free",
      _limit_invoices_per_month: form.limit_invoices_per_month,
      _limit_users: form.limit_users,
      _owner_user_id: form.id ? null : ownerId, // solo al crear
      _storage_limit_mb: form.storage_limit_mb ?? null,
    });
    setSaving(false);
    if (!error) onSaved();
  };

  // NCF helpers
  const saveNcf = async (t: { ncf_type: string; next_seq: number }) => {
    if (!form.id) return;
    await supabase.rpc("su_upsert_ncf_sequence", { _company_id: form.id, _ncf_type: t.ncf_type, _next_seq: t.next_seq });
  };
  const addNcfType = async () => {
    if (!form.id || !newType) return;
    const seq = Number(newSeq || 0);
    await supabase.rpc("su_upsert_ncf_sequence", { _company_id: form.id, _ncf_type: newType, _next_seq: seq });
    setNcfTypes((arr) => [...arr, { ncf_type: newType, next_seq: seq }]);
    setNewType("");
    setNewSeq("");
  };

  // Owner search by email (for new company)
  const findOwnerByEmail = async () => {
    if (!ownerEmail) return;
    const { data } = await supabase.rpc('su_users_list', { _name: null, _email: ownerEmail });
    const list = (data as any[]) || [];
    if (list.length > 0) {
      setOwnerId(list[0].id);
    } else {
      setOwnerId(null);
      alert('No se encontró usuario con ese email. Puedes invitarlo y asignarlo luego.');
    }
  };

  // Usuarios tab actions
  const mapUiRoleToCompanyRole = (r: UiRole): Member['role'] => (r === 'admin' ? 'owner' : 'cashier');

  const searchUsers = async () => {
    const { data } = await supabase.rpc('su_users_list', { _name: null, _email: searchEmail || null });
    setUserResults(((data || []) as any[]).map((u) => ({ id: u.id, email: u.email, display_name: u.display_name })));
  };

  const addMember = async () => {
    if (!form.id || !selectedUserId) return;
    await supabase.rpc('su_company_set_member_role', { _company_id: form.id, _user_id: selectedUserId, _role: mapUiRoleToCompanyRole(newMemberRole) as any });
    setSelectedUserId("");
    setSearchEmail("");
    setUserResults([]);
    fetchMembers();
  };

  const changeMemberRole = async (userId: string, role: UiRole) => {
    if (!form.id) return;
    await supabase.rpc('su_company_set_member_role', { _company_id: form.id, _user_id: userId, _role: mapUiRoleToCompanyRole(role) as any });
    fetchMembers();
  };

  const removeMember = async (userId: string) => {
    if (!form.id) return;
    await supabase.rpc('su_company_remove_member', { _company_id: form.id, _user_id: userId });
    fetchMembers();
  };

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === 'plan') {
      supabase.rpc('su_plans_list').then(({ data }) => setPlans((data as any[]) || []));
    }
  }, [activeTab]);
  const selectedPlan = useMemo(() => plans.find((p) => p.name === form.plan) || null, [plans, form.plan]);
  const datosTab = (
    <div className="space-y-6">
      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre comercial</Label>
          <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="Mi Empresa SRL" />
        </div>
        <div>
          <Label htmlFor="rnc">RNC</Label>
          <Input id="rnc" name="rnc" value={form.rnc ?? ""} onChange={onChange} placeholder="1-01-12345-6" />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" value={form.phone ?? ""} onChange={onChange} placeholder="809-000-0000" />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" value={form.address ?? ""} onChange={onChange} placeholder="Calle #, Ciudad" />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" name="currency" value={form.currency ?? "DOP"} onChange={onChange} />
        </div>
        <div>
          <Label htmlFor="itbis_rate">ITBIS por defecto</Label>
          <Input id="itbis_rate" name="itbis_rate" type="number" step="0.01" value={Number(form.itbis_rate ?? 0)} onChange={onChange} />
        </div>
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Input id="plan" name="plan" value={form.plan ?? "free"} onChange={onChange} placeholder="free | pro | enterprise" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={!!form.active} onCheckedChange={onToggle} id="estado" />
          <Label htmlFor="estado">Estado activo</Label>
        </div>
        <div>
          <Label htmlFor="limit_invoices_per_month">Límite facturas/mes</Label>
          <Input id="limit_invoices_per_month" name="limit_invoices_per_month" type="number" value={form.limit_invoices_per_month ?? ""} onChange={(e) => setForm((f) => ({ ...f, limit_invoices_per_month: e.target.value === "" ? null : Number(e.target.value) }))} />
        </div>
        <div>
          <Label htmlFor="limit_users">Límite usuarios</Label>
          <Input id="limit_users" name="limit_users" type="number" value={form.limit_users ?? ""} onChange={(e) => setForm((f) => ({ ...f, limit_users: e.target.value === "" ? null : Number(e.target.value) }))} />
        </div>
      </div>

      {/* Propietario al crear */}
      {!form.id && (
        <div className="space-y-3">
          <Separator />
          <h3 className="text-sm font-medium">Propietario (admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Email del propietario</Label>
              <Input placeholder="correo@dominio.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={findOwnerByEmail}>Buscar existente</Button>
              <Button asChild variant="secondary">
                <a href={`mailto:${ownerEmail}?subject=Invitaci%C3%B3n&body=Crea%20tu%20cuenta%20y%20te%20asignaremos%20como%20propietario.`}>Invitar por email</a>
              </Button>
            </div>
          </div>
          {ownerId && <p className="text-xs text-muted-foreground">Usuario seleccionado como propietario.</p>}
        </div>
      )}

      {/* Series NCF */}
      {form.id && (
        <div className="space-y-3">
          <Separator />
          <h3 className="text-sm font-medium">Series NCF por tipo</h3>
          <div className="space-y-2">
            {ncfTypes.map((t, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <Input value={t.ncf_type} disabled />
                <Input type="number" value={t.next_seq} onChange={(e) => {
                  const v = Number(e.target.value || 0);
                  setNcfTypes((arr) => arr.map((x, i) => (i === idx ? { ...x, next_seq: v } : x)));
                }} />
                <Button variant="outline" onClick={() => saveNcf(t)}>Guardar</Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <Input placeholder="Tipo NCF (e.g., B01)" value={newType} onChange={(e) => setNewType(e.target.value)} />
            <Input placeholder="Siguiente secuencia" type="number" value={newSeq} onChange={(e) => setNewSeq(e.target.value === "" ? "" : Number(e.target.value))} />
            <Button onClick={addNcfType}>Agregar tipo</Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" onClick={onSaved} disabled={saving}>Cerrar</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </div>
    </div>
  );

  const usuariosTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <Label>Buscar por email</Label>
          <div className="flex gap-2">
            <Input placeholder="usuario@correo.com" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
            <Button variant="outline" onClick={searchUsers}>Buscar</Button>
          </div>
        </div>
        <div>
          <Label>Rol</Label>
          <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as UiRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="cajera">Cajera</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {userResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona usuario" />
            </SelectTrigger>
            <SelectContent>
              {userResults.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {(u.display_name || u.email || u.id) as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addMember}>Agregar a empresa</Button>
        </div>
      )}

      <Separator />
      <h3 className="text-sm font-medium">Miembros de la empresa</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.user_id}>
              <TableCell className="font-medium">{m.display_name || '-'}</TableCell>
              <TableCell>{m.email || '-'}</TableCell>
              <TableCell>
                <Select value={m.role === 'owner' ? 'admin' : m.role === 'cashier' ? 'cajera' : 'admin'} onValueChange={(v) => changeMemberRole(m.user_id, v as UiRole)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="cajera">Cajera</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="destructive" size="sm" onClick={() => removeMember(m.user_id)}>Quitar</Button>
              </TableCell>
            </TableRow>
          ))}
          {!loadingMembers && members.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">Sin miembros</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const planTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Plan</Label>
          <Select value={form.plan || ''} onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPlan && (
          <div className="text-sm text-muted-foreground">
            <p>{selectedPlan.description}</p>
            <p className="mt-1">Límites por plan: {selectedPlan.limit_invoices_per_month ?? '—'} facturas/mes · {selectedPlan.limit_users ?? '—'} usuarios · {selectedPlan.storage_limit_mb ?? '—'} MB</p>
          </div>
        )}
        <div>
          <Label htmlFor="limit_invoices_per_month_override">Límite facturas/mes (override)</Label>
          <Input id="limit_invoices_per_month_override" type="number" value={form.limit_invoices_per_month ?? ''} onChange={(e) => setForm((f) => ({ ...f, limit_invoices_per_month: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div>
          <Label htmlFor="limit_users_override">Límite usuarios (override)</Label>
          <Input id="limit_users_override" type="number" value={form.limit_users ?? ''} onChange={(e) => setForm((f) => ({ ...f, limit_users: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div>
          <Label htmlFor="storage_limit_mb">Almacenamiento (MB) override</Label>
          <Input id="storage_limit_mb" type="number" value={form.storage_limit_mb ?? ''} onChange={(e) => setForm((f) => ({ ...f, storage_limit_mb: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onSaved} disabled={saving}>Cerrar</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
      <TabsList>
        <TabsTrigger value="datos">Datos</TabsTrigger>
        <TabsTrigger value="plan">Plan</TabsTrigger>
        {form.id && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
      </TabsList>
      <TabsContent value="datos">{datosTab}</TabsContent>
      <TabsContent value="plan">{planTab}</TabsContent>
      {form.id && <TabsContent value="usuarios">{usuariosTab}</TabsContent>}
    </Tabs>
  );
}
