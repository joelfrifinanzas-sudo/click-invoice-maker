import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useEffect, useMemo, useState } from "react";
import { listCustomers } from "@/data/customers";
import { createCotizacionDraft, getCotizacionTotals, sendCotizacion, upsertCotizacionItems } from "@/data/cotizaciones";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemRow { id: string; nombre: string; qty: number; precio_unitario: number; itbis_rate: number }

export default function Cotizaciones() {
  useScrollToTop();

  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [vence, setVence] = useState<Date | undefined>(undefined);
  const [moneda, setMoneda] = useState("DOP");
  const [itbisRate, setItbisRate] = useState(0.18);
  const [tipoDesc, setTipoDesc] = useState<'none'|'percent'|'amount'>('none');
  const [valorDesc, setValorDesc] = useState<number>(0);
  const [notas, setNotas] = useState("");
  const [terminos, setTerminos] = useState("");
  const [items, setItems] = useState<ItemRow[]>([mkRow()]);
  const [sendingMsg, setSendingMsg] = useState<string>("");

  useEffect(() => {
    document.title = "Cotizaciones | Crear y enviar";
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await listCustomers({ limit: 50 });
      setCustomers(data || []);
    })();
  }, []);

  const totals = useMemo(() => computeTotals(items, itbisRate, tipoDesc, valorDesc), [items, itbisRate, tipoDesc, valorDesc]);

  const addRow = () => setItems((arr) => [...arr, mkRow()]);
  const removeRow = (id: string) => setItems((arr) => (arr.length > 1 ? arr.filter((r) => r.id !== id) : arr));
  const updateRow = (id: string, patch: Partial<ItemRow>) => setItems((arr) => arr.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onGuardar = async (enviar: boolean) => {
    if (!customerId) {
      toast({ title: "Selecciona un cliente", description: "Debes elegir un cliente para continuar." });
      return;
    }
    try {
      const { data: ctz, error } = await createCotizacionDraft({
        customer_id: customerId,
        fecha: fecha ? (format(fecha, 'yyyy-MM-dd') as any) : undefined,
        vence_el: vence ? (format(vence, 'yyyy-MM-dd') as any) : undefined,
        moneda,
        itbis_rate: itbisRate,
        tipo_descuento: tipoDesc as any,
        valor_descuento: valorDesc,
        notas,
        terminos,
      });
      if (error || !ctz) throw new Error(error || 'Error al crear');

      const { error: itemsErr } = await upsertCotizacionItems(ctz.id, items.filter((i) => i.nombre.trim()).map((i) => ({
        nombre: i.nombre,
        qty: i.qty,
        precio_unitario: i.precio_unitario,
        itbis_rate: i.itbis_rate,
      })));
      if (itemsErr) throw new Error(itemsErr);

      if (enviar) {
        const { error: sendErr } = await sendCotizacion(ctz.id);
        if (sendErr) throw new Error(sendErr);
        // refetch totals (DB authoritative)
        const { data: totalsDb } = await getCotizacionTotals(ctz.id);
        const total = totalsDb?.total ?? totals.total;

        const publicUrl = `${window.location.origin}/c/${ctz.public_id || ''}`;
        const msg = buildWhatsAppMessage({
          number: ctz.number || '—',
          cliente: customers.find((c) => c.id === customerId)?.name || 'Cliente',
          total,
          vence_el: vence ? format(vence, 'yyyy-MM-dd') : '—',
          pdf_signed_url: publicUrl,
        });
        setSendingMsg(msg);
        toast({ title: "Cotización enviada", description: "Se generó el mensaje listo para copiar." });
      } else {
        toast({ title: "Borrador guardado", description: "La cotización fue guardada como borrador." });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || 'No se pudo guardar', variant: 'destructive' as any });
    }
  };

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader title="Cotizaciones" description="Crea y envía cotizaciones a tus clientes" />

          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Cliente y fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <DatePicker date={fecha} onChange={setFecha} />
                </div>
                <div>
                  <Label>Vence</Label>
                  <DatePicker date={vence} onChange={setVence} />
                </div>
              </div>

              {/* Configuración */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Moneda</Label>
                  <Select value={moneda} onValueChange={setMoneda}>
                    <SelectTrigger><SelectValue placeholder="Moneda" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOP">DOP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ITBIS %</Label>
                  <Input type="number" step="0.01" value={itbisRate} onChange={(e) => setItbisRate(Number(e.target.value || 0))} />
                </div>
                <div>
                  <Label>Tipo descuento</Label>
                  <Select value={tipoDesc} onValueChange={(v) => setTipoDesc(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="amount">Monto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor descuento</Label>
                  <Input type="number" step="0.01" value={valorDesc} onChange={(e) => setValorDesc(Number(e.target.value || 0))} />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ítems</Label>
                  <Button variant="outline" onClick={addRow}>Agregar ítem</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th>Nombre</th>
                        <th className="text-right">Cant.</th>
                        <th className="text-right">P. Unit.</th>
                        <th className="text-right">ITBIS %</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td className="pr-2"><Input value={it.nombre} onChange={(e) => updateRow(it.id, { nombre: e.target.value })} placeholder="Descripción" /></td>
                          <td className="pr-2"><Input className="text-right" type="number" step="0.01" value={it.qty} onChange={(e) => updateRow(it.id, { qty: Number(e.target.value || 0) })} /></td>
                          <td className="pr-2"><Input className="text-right" type="number" step="0.01" value={it.precio_unitario} onChange={(e) => updateRow(it.id, { precio_unitario: Number(e.target.value || 0) })} /></td>
                          <td className="pr-2"><Input className="text-right" type="number" step="0.01" value={it.itbis_rate} onChange={(e) => updateRow(it.id, { itbis_rate: Number(e.target.value || 0) })} /></td>
                          <td className="text-right"><Button variant="ghost" onClick={() => removeRow(it.id)}>Quitar</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notas / Términos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Notas</Label>
                  <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Términos</Label>
                  <Textarea value={terminos} onChange={(e) => setTerminos(e.target.value)} rows={3} />
                </div>
              </div>

              {/* Totales */}
              <div className="flex flex-col items-end gap-1 text-sm">
                <div>Neto: {fmtMoney(totals.neto, moneda)}</div>
                <div>ITBIS ({Math.round(itbisRate*100)}%): {fmtMoney(totals.itbis, moneda)}</div>
                {totals.descuento > 0 && <div>Descuento: -{fmtMoney(totals.descuento, moneda)}</div>}
                <div className="font-medium">Total: {fmtMoney(totals.total, moneda)}</div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => onGuardar(false)}>Guardar borrador</Button>
                <Button onClick={() => onGuardar(true)}>Guardar y enviar</Button>
              </div>

              {sendingMsg && (
                <div className="mt-4">
                  <Label>Mensaje WhatsApp</Label>
                  <Textarea value={sendingMsg} readOnly rows={6} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function mkRow(): ItemRow { return { id: crypto.randomUUID(), nombre: "", qty: 1, precio_unitario: 0, itbis_rate: 0.18 }; }

function computeTotals(items: ItemRow[], itbisRate: number, tipo: 'none'|'percent'|'amount', valor: number) {
  const neto = items.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.precio_unitario || 0)), 0);
  const itbis = neto * Number(itbisRate || 0);
  let descuento = 0;
  if (tipo === 'percent') descuento = neto * (Number(valor || 0) / 100);
  if (tipo === 'amount') descuento = Number(valor || 0);
  const total = neto + itbis - descuento;
  return { neto, itbis, descuento, total };
}

function fmtMoney(n: number, currency = 'DOP') {
  const nf = new Intl.NumberFormat('es-DO', { style: 'currency', currency, minimumFractionDigits: 2 });
  return nf.format(n).replace('RD$\u00A0', 'RD$').replace('RD$ ', 'RD$');
}

function DatePicker({ date, onChange }: { date?: Date; onChange: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Selecciona fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function buildWhatsAppMessage({ number, cliente, total, vence_el, pdf_signed_url }: { number: string; cliente: string; total: number; vence_el: string; pdf_signed_url: string }) {
  const fmt = (n: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n).replace('RD$\u00A0', 'RD$').replace('RD$ ', 'RD$');
  return [
    `📄 *Cotización* ${number}`,
    `👤 ${cliente}`,
    `💰 Total: ${fmt(total)}`,
    `🗓️ Válida hasta: ${vence_el}`,
    `🔗 ${pdf_signed_url}`,
  ].join('\n');
}
