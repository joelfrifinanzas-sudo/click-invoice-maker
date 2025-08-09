import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
};

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
  });

  const [saving, setSaving] = useState(false);
  const [ncfTypes, setNcfTypes] = useState<{ ncf_type: string; next_seq: number }[]>([]);
  const [newType, setNewType] = useState("");
  const [newSeq, setNewSeq] = useState<number | "">("");

  useEffect(() => {
    if (company?.id) {
      supabase.rpc("su_list_ncf_sequences", { _company_id: company.id }).then(({ data }) => {
        if (Array.isArray(data)) {
          setNcfTypes(data.map((d: any) => ({ ncf_type: d.ncf_type, next_seq: Number(d.next_seq || 0) })));
        }
      });
    }
  }, [company?.id]);

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
      _owner_user_id: null,
    });
    setSaving(false);
    if (!error) onSaved();
  };

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

  return (
    <div className="space-y-6">
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
}
