import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { upsertClient, type Client } from "@/data/clients";

export function NuevoClienteDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (c: Client) => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula_rnc: "",
    direccion: "",
    notas: "",
  });

  const reset = () => setForm({ nombre: "", email: "", telefono: "", cedula_rnc: "", direccion: "", notas: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast({ title: "Falta el nombre", description: "El nombre es requerido." });
      return;
    }

    setPending(true);
    try {
      const { data, error } = await upsertClient({
        tipo_cliente: "Individuo",
        nombre_visualizacion: form.nombre.trim(),
        nombre_pila: form.nombre.trim(),
        email: form.email.trim() || null,
        telefono_movil: form.telefono.trim() || null,
        documento: form.cedula_rnc.trim() || null,
        notas: form.notas.trim() || null,
        activo: true
      });

      if (error) {
        toast({ title: "Error al guardar", description: error });
        return;
      }

      toast({ title: "Cliente creado", description: `Se creó ${data?.nombre_visualizacion || 'el cliente'}.` });
      reset();
      onOpenChange(false);
      if (data && onCreated) onCreated(data);
    } catch (err: any) {
      toast({ title: "Error inesperado", description: err?.message || String(err) });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>Agrega un cliente básico a tu empresa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre*</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula_rnc">Cédula/RNC</Label>
              <Input id="cedula_rnc" value={form.cedula_rnc} onChange={(e) => setForm((f) => ({ ...f, cedula_rnc: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { if (!pending) { onOpenChange(false); } }}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
