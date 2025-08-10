import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { listClients, Client } from "@/data/clients";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export type ClientRecord = Client;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (client: ClientRecord) => void;
};

export function ClientPickerDialog({ open, onOpenChange, onConfirm }: Props) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await listClients({ search, page: 1, pageSize: 20 });
      if (active) {
        setClients(data || []);
        setLoading(false);
      }
    })();
    return () => { active = false };
  }, [search, open]);

  const selected = useMemo(() => clients.find(c => c.id === selectedId) || null, [clients, selectedId]);

  const handleConfirmExisting = () => {
    if (!selected) return;
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleccionar cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Input
              placeholder="Buscar por nombre, RNC/Cédula o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Fuente: módulo de Clientes</p>
          </div>
          <ScrollArea className="h-64 border rounded-md">
            <ul className="divide-y">
              {clients.map((c) => (
                <li key={c.id} className={cn("p-3 cursor-pointer hover:bg-accent", selectedId === c.id && "bg-accent")} onClick={() => setSelectedId(c.id)}>
                  <div className="font-medium">{c.nombre_visualizacion}</div>
                  <div className="text-sm text-muted-foreground">{c.documento || '—'} • {c.email || '—'} • {c.telefono_movil || c.telefono_laboral || '—'}</div>
                  <div className="mt-1"><Badge variant={c.activo ? 'default' : 'secondary'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge></div>
                </li>
              ))}
              {!loading && clients.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">
                  Sin resultados. ¿Deseas <button className="underline" onClick={() => { onOpenChange(false); navigate('/clientes/nuevo'); }}>crear uno nuevo</button>?
                </li>
              )}
            </ul>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleConfirmExisting} disabled={!selected}>Usar cliente</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
