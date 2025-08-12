import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Client, ClientType, upsertClient } from "@/data/clients";
import { useToast } from "@/hooks/use-toast";
import { validateCedula, validateRNC } from "@/utils/validationUtils";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { lookupRncName } from "@/utils/rncLookup";

const schema = z.object({
  id: z.string().uuid().optional(),
  tipo_cliente: z.enum(["Empresarial", "Individuo"]) as z.ZodType<ClientType>,
  saludo: z.string().optional().nullable(),
  nombre_pila: z.string().optional().nullable(),
  apellido: z.string().optional().nullable(),
  nombre_empresa: z.string().optional().nullable(),
  nombre_visualizacion: z.string().min(1, "Requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")).nullable(),
  telefono_laboral: z.string().optional().nullable(),
  telefono_movil: z.string().optional().nullable(),
  pais_tel: z.string().default("DO").optional(),
  documento: z.string().optional().nullable(),
  es_contribuyente: z.boolean().default(false),
  notas: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

export function ClientForm({ initialData, onSaved }: { initialData?: Client; onSaved?: (c: Client, action: 'save' | 'save-create-invoice') => void }) {
  const { toast } = useToast();
  const [savingAction, setSavingAction] = React.useState<'save' | 'save-create-invoice'>('save');
  const [saving, setSaving] = React.useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      id: initialData.id,
      tipo_cliente: initialData.tipo_cliente,
      saludo: initialData.saludo || undefined,
      nombre_pila: initialData.nombre_pila || undefined,
      apellido: initialData.apellido || undefined,
      nombre_empresa: initialData.nombre_empresa || undefined,
      nombre_visualizacion: initialData.nombre_visualizacion,
      email: initialData.email || undefined,
      telefono_laboral: initialData.telefono_laboral || undefined,
      telefono_movil: initialData.telefono_movil || undefined,
      pais_tel: initialData.pais_tel || "DO",
      documento: initialData.documento || undefined,
      es_contribuyente: !!initialData.es_contribuyente,
      notas: initialData.notas || undefined,
      activo: !!initialData.activo,
    } : {
      tipo_cliente: "Individuo",
      pais_tel: "DO",
      es_contribuyente: false,
      activo: true,
    }
  });

  const tipo = form.watch("tipo_cliente");
  const nombreEmpresa = form.watch("nombre_empresa") || "";
  const nombrePila = form.watch("nombre_pila") || "";
  const apellido = form.watch("apellido") || "";
  const documento = form.watch("documento") || "";

  const suggestions = React.useMemo(() => {
    const list: string[] = [];
    const full = `${nombrePila} ${apellido}`.trim();
    if (tipo === "Empresarial" && nombreEmpresa) list.push(nombreEmpresa);
    if (full) list.push(full);
    return list;
  }, [tipo, nombreEmpresa, nombrePila, apellido]);

  const [comboOpen, setComboOpen] = React.useState(false);
  const debounceRef = React.useRef<number | null>(null);

  async function onSubmit(values: z.infer<typeof schema>) {
    // Extra validations for documento depending on tipo
    if (values.documento) {
      if (values.tipo_cliente === "Empresarial") {
        const r = validateRNC(values.documento);
        if (!r.isValid) {
          form.setError("documento", { message: "RNC inválido" });
          return;
        }
      } else {
        const r = validateCedula(values.documento);
        if (!r.isValid) {
          form.setError("documento", { message: "Cédula inválida" });
          return;
        }
      }
    }

    try {
      setSaving(true);
      const { data, error } = await upsertClient(values as any);
      if (error || !data) {
        console.error("Client save failed", error);
        toast({ title: "No se pudo guardar", description: error || "Verifique los campos requeridos", variant: "destructive" });
        return;
      }
      toast({ title: "Cliente guardado", description: data.nombre_visualizacion });
      onSaved?.(data, savingAction);
    } catch (e: any) {
      console.error("Client save exception", e);
      toast({ title: "No se pudo guardar", description: e?.message ?? "Error desconocido", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // Autocompletar desde CSV público con caché 24h
  const tryAutocomplete = React.useCallback(async () => {
    const doc = (form.getValues("documento") || "").trim();
    if (!doc) return;
    const isEmp = form.getValues("tipo_cliente") === "Empresarial";
    if (!isEmp) return; // solo RNC
    const r = validateRNC(doc);
    if (!r.isValid) return;
    const { name } = await lookupRncName(doc);
    if (name) {
      const nv = form.getValues("nombre_visualizacion");
      form.setValue("nombre_empresa", name, { shouldDirty: true });
      if (!nv) form.setValue("nombre_visualizacion", name, { shouldDirty: true });
      form.setValue("es_contribuyente", true, { shouldDirty: true });
      toast({ title: "Datos autocompletados", description: name });
    }
  }, [form, toast]);

  const onDocumentoBlur = () => {
    window.setTimeout(() => { tryAutocomplete(); }, 0);
  };

  React.useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { tryAutocomplete(); }, 600) as unknown as number;
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [documento, tryAutocomplete]);

  const documentoPlaceholder = tipo === "Empresarial" ? "RNC" : "Cédula";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[60]">
                    <SelectItem value="Empresarial">Empresarial</SelectItem>
                    <SelectItem value="Individuo">Individuo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-1">
            <FormField
              control={form.control}
              name="saludo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saludo</FormLabel>
                  <FormControl>
                    <Input placeholder="Sr., Sra., Ing., Lic., ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nombre_pila"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de pila</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {tipo === "Empresarial" && (
            <FormField
              control={form.control}
              name="nombre_empresa"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Empresa S.R.L." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="nombre_visualizacion"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre de visualización</FormLabel>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboOpen}
                      className="w-full justify-between"
                      type="button"
                    >
                      {field.value || "Selecciona o escribe"}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Escribe para sugerencias" value={field.value} onValueChange={field.onChange} />
                      <CommandList>
                        <CommandEmpty>Sin sugerencias</CommandEmpty>
                        <CommandGroup heading="Sugerencias">
                          {suggestions.map((s) => (
                            <CommandItem
                              key={s}
                              value={s}
                              onSelect={(val) => { field.onChange(val); setComboOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === s ? "opacity-100" : "opacity-0")} />
                              {s}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de correo electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="correo@dominio.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <FormControl>
                  <Input placeholder={documentoPlaceholder} {...field} onBlur={onDocumentoBlur} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono_laboral"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono laboral</FormLabel>
                <FormControl>
                  <PhoneInput value={field.value || ""} onChange={field.onChange} placeholder="" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono_movil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono móvil</FormLabel>
                <FormControl>
                  <PhoneInput value={field.value || ""} onChange={field.onChange} placeholder="" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="es_contribuyente"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel>Es contribuyente</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => { setSavingAction('save-create-invoice'); form.handleSubmit(onSubmit)(); }}
            disabled={saving}
          >
            {saving && savingAction === 'save-create-invoice' ? 'Guardando…' : 'Guardar y crear factura'}
          </Button>
          <Button type="submit" onClick={() => setSavingAction('save')} disabled={saving}>
            {saving && savingAction === 'save' ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => history.back()}>Cancelar</Button>
        </div>
      </form>
    </Form>
  );
}
