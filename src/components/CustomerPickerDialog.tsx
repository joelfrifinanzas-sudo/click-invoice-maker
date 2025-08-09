import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { listCustomers, upsertCustomer } from "@/data/customers";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

export type Customer = Tables<"customers">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (customer: Customer) => void;
};

export function CustomerPickerDialog({ open, onOpenChange, onConfirm }: Props) {
  const [tab, setTab] = useState<"select" | "new">("select");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // New customer form
  const [name, setName] = useState("");
  const [rnc, setRnc] = useState("");
  const [phone, setPhone] = useState("+1 ");

  // Fetch customers
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await listCustomers({ search, limit: 20 });
      if (active) {
        setCustomers(data ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false };
  }, [search, open]);

  const selected = useMemo(() => customers.find(c => c.id === selectedId) || null, [customers, selectedId]);

  const handleConfirmExisting = () => {
    if (!selected) return;
    onConfirm(selected);
    onOpenChange(false);
  };

  const handleCreateNew = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data, error } = await upsertCustomer({ name: name.trim(), rnc: rnc || null as any, phone: phone || null as any });
    setLoading(false);
    if (data) {
      onConfirm(data as Customer);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleccionar cliente</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4" role="tablist" aria-label="Selector de cliente">
          <button
            role="tab"
            aria-selected={tab === "select"}
            className={cn("px-3 py-2 rounded-md text-sm border", tab === "select" ? "bg-primary text-primary-foreground" : "bg-muted")}
            onClick={() => setTab("select")}
          >
            Existente
          </button>
          <button
            role="tab"
            aria-selected={tab === "new"}
            className={cn("px-3 py-2 rounded-md text-sm border", tab === "new" ? "bg-primary text-primary-foreground" : "bg-muted")}
            onClick={() => setTab("new")}
          >
            Nuevo
          </button>
        </div>

        {tab === "select" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Buscar por nombre, RNC o teléfono"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mostrando solo clientes (facturación)</p>
            </div>
            <ScrollArea className="h-64 border rounded-md">
              <ul className="divide-y">
                {customers.map((c) => (
                  <li key={c.id} className={cn("p-3 cursor-pointer hover:bg-accent", selectedId === c.id && "bg-accent")}
                      onClick={() => setSelectedId(c.id)}>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{(c as any).rnc || "Sin RNC"} • {(c as any).phone || "Sin teléfono"}</div>
                    {(c as any).es_usuario ? (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[10px]">También es usuario interno</Badge>
                      </div>
                    ) : null}
                  </li>
                ))}
                {!loading && customers.length === 0 && (
                  <li className="p-3 text-sm text-muted-foreground">No hay resultados</li>
                )}
              </ul>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleConfirmExisting} disabled={!selected}>Usar cliente</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rnc">RNC (opcional)</Label>
              <Input id="rnc" value={rnc} onChange={(e) => setRnc(e.target.value)} placeholder="RNC" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleCreateNew} disabled={loading || !name.trim()}>Crear y usar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
