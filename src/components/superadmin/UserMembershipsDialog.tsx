import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DirectoryUser } from "./UsersDirectory";

export default function UserMembershipsDialog({ user, onClose }: { user: DirectoryUser; onClose: () => void }) {
  const [memberships, setMemberships] = useState<{ company_id: string; company_name: string; role: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  type CompanyRole = 'owner' | 'member';
  const [role, setRole] = useState<CompanyRole>("member");

  const load = async () => {
    const [m1, m2] = await Promise.all([
      supabase.rpc("su_user_memberships", { _user_id: user.id }),
      supabase.rpc("su_companies_list"),
    ]);
    setMemberships(((m1.data || []) as any[]).map((r) => ({ company_id: r.company_id, company_name: r.company_name, role: r.role })));
    setCompanies(((m2.data || []) as any[]).map((c) => ({ id: c.id, name: c.name })));
  };

  useEffect(() => { load(); }, []);

  const addMembership = async () => {
    if (!companyId || !role) return;
    await supabase.rpc("su_add_user_to_company", { _user_id: user.id, _company_id: companyId, _role: role });
    await load();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Membresías — {user.display_name || user.email || user.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={role as any} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={addMembership}>Agregar a empresa</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.company_id}>
                  <TableCell>{m.company_name}</TableCell>
                  <TableCell className="capitalize">{m.role}</TableCell>
                </TableRow>
              ))}
              {memberships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">Sin membresías</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
