import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PlanCatalog() {
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    limit_invoices_per_month: "",
    limit_users: "",
    storage_limit_mb: "",
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.rpc('su_plans_list');
    setPlans((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    setLoading(true);
    await supabase.rpc('su_plan_upsert', {
      _name: form.name,
      _description: form.description,
      _limit_invoices_per_month: form.limit_invoices_per_month === "" ? null : Number(form.limit_invoices_per_month),
      _limit_users: form.limit_users === "" ? null : Number(form.limit_users),
      _storage_limit_mb: form.storage_limit_mb === "" ? null : Number(form.storage_limit_mb),
      _features: {},
    });
    setLoading(false);
    setForm({ name: "", description: "", limit_invoices_per_month: "", limit_users: "", storage_limit_mb: "" });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de planes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Facturas/mes" type="number" value={form.limit_invoices_per_month} onChange={(e) => setForm({ ...form, limit_invoices_per_month: e.target.value })} />
          <Input placeholder="Usuarios" type="number" value={form.limit_users} onChange={(e) => setForm({ ...form, limit_users: e.target.value })} />
          <Input placeholder="Almacenamiento (MB)" type="number" value={form.storage_limit_mb} onChange={(e) => setForm({ ...form, storage_limit_mb: e.target.value })} />
          <div className="md:col-span-5 flex justify-end">
            <Button onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar plan'}</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Facturas/mes</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Storage (MB)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.description || '-'}</TableCell>
                <TableCell>{p.limit_invoices_per_month ?? '-'}</TableCell>
                <TableCell>{p.limit_users ?? '-'}</TableCell>
                <TableCell>{p.storage_limit_mb ?? '-'}</TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Sin planes</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
