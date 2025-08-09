import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SuperAdminAudit() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [companyId, setCompanyId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  type EventType = 'auth_login' | 'invoice_created' | 'invoice_updated' | 'invoice_canceled' | 'role_changed' | 'company_activated' | 'company_deactivated';
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.rpc('su_companies_list'),
      supabase.rpc('su_users_list', { _name: null, _email: null }),
    ]).then(([c, u]) => {
      setCompanies((c.data as any[]) || []);
      setUsers((u.data as any[]) || []);
    });
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('su_audit_list', {
      _company_id: companyId || null,
      _user_id: userId || null,
      _event_type: eventType || null,
      _from: from ? new Date(from).toISOString() : null,
      _to: to ? new Date(to).toISOString() : null,
    });
    setEvents((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const eventTypes = [
    'auth_login',
    'invoice_created',
    'invoice_updated',
    'invoice_canceled',
    'role_changed',
    'company_activated',
    'company_deactivated',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder="Usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.display_name || u.email || u.id}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={eventType || ''} onValueChange={(v) => setEventType((v || '') as any)}>
            <SelectTrigger><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={fetchEvents} disabled={loading}>Filtrar</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Mensaje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell>{e.company_name || '—'}</TableCell>
                <TableCell>{e.user_name || e.user_email || e.user_id}</TableCell>
                <TableCell className="font-medium">{e.event_type}</TableCell>
                <TableCell>{e.message || '—'}</TableCell>
              </TableRow>
            ))}
            {!loading && events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Sin eventos</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
