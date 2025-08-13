import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { listClients, Client } from "@/data/clients";
import { NuevoClienteDialog } from "@/components/clientes/NuevoClienteDialog";

export function ClientCombobox({
  value,
  onChange,
  placeholder = "Buscar cliente...",
}: {
  value: string | null | undefined;
  onChange: (id: string | null, client?: Client | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Client[]>([]);
  const [showNew, setShowNew] = useState(false);
  const selected = useMemo(() => items.find((i) => i.id === value) || null, [items, value]);

  // Debounced search
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await listClients({ search: query, page: 1, pageSize: 10 });
      if (!active) return;
      setItems(data || []);
      setLoading(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.nombre_visualizacion : "Selecciona un cliente"}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
            <CommandList className="max-h-60">
              <CommandEmpty>
                <div className="p-3 text-sm text-muted-foreground">No hay clientes.</div>
                <div className="p-2">
                  <Button size="sm" className="w-full" onClick={() => { setOpen(false); setShowNew(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Crear nuevo
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading={loading ? "Buscando..." : "Resultados"}>
                {items.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.nombre_visualizacion}
                    onSelect={() => { onChange(c.id, c); setOpen(false); }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="text-sm">{c.nombre_visualizacion}</span>
                      {(c.documento || c.email) && (
                        <span className="text-xs text-muted-foreground">{[c.documento, c.email].filter(Boolean).join(" • ")}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="p-2 border-t border-border/60 bg-background">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => { setOpen(false); setShowNew(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Crear nuevo
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <NuevoClienteDialog
        open={showNew}
        onOpenChange={setShowNew}
        onCreated={(created?: any) => {
          if (created?.id) {
            const client: Client = {
              id: created.id,
              created_at: created.created_at || new Date().toISOString(),
              tipo_cliente: created.tipo_cliente || "Individuo",
              saludo: created.saludo ?? null,
              nombre_pila: created.nombre_pila ?? null,
              apellido: created.apellido ?? null,
              nombre_empresa: created.nombre_empresa ?? null,
              nombre_visualizacion: created.nombre_visualizacion || created.nombre || "Nuevo cliente",
              email: created.email ?? null,
              telefono_laboral: created.telefono_laboral ?? null,
              telefono_movil: created.telefono_movil ?? null,
              pais_tel: created.pais_tel || "DO",
              documento: created.documento ?? null,
              es_contribuyente: !!created.es_contribuyente,
              notas: created.notas ?? null,
              tenant_id: created.tenant_id || "",
              activo: created.activo ?? true,
            } as Client;
            onChange(client.id, client);
          }
        }}
      />
    </>
  );
}
