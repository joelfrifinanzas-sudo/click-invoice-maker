import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserMembershipsDialog from "./UserMembershipsDialog";

export type DirectoryUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  companies_count: number;
  last_sign_in_at: string | null;
};

export default function UsersDirectory() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DirectoryUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("su_users_list", { _name: name || null, _email: email || null });
    setUsers((data || []) as DirectoryUser[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => users, [users]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <CardTitle>Directorio de usuarios</CardTitle>
        <div className="flex gap-2">
          <Input placeholder="Filtrar por nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Filtrar por email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={fetchUsers} disabled={loading}>Buscar</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Empresas asociadas (#)</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.display_name || "(sin nombre)"}</TableCell>
                <TableCell>{u.email || "-"}</TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>{u.companies_count}</TableCell>
                <TableCell>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelected(u)}>Membresías</Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Sin resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {selected && (
        <UserMembershipsDialog
          user={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}
