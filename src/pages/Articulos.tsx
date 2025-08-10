import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Edit, Trash2, Barcode, ImagePlus, X, ChevronDown } from "lucide-react";
import { formatMoneyDOP } from "@/utils/formatters";
import { listProducts, upsertProduct } from "@/data/products";
import type { Product } from "@/data/products";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface ArticuloCardItem {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
}


const moneyToNumber = (v: string): number => {
  if (!v) return 0;
  const cleaned = v
    .replace(/[^0-9,\.]/g, "")
    .replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const schema = z.object({
  nombre: z.string().min(1, "Requerido").max(150, "Máximo 150 caracteres"),
  codigoBarras: z.string().optional().or(z.literal("")).transform(v => v?.trim() ?? ""),
  vendePor: z.enum(["unidad", "granel"]).default("unidad"),
  precioCosto: z.string().optional(),
  precioVenta: z.string().min(1, "Requerido"),
  precioMayoreo: z.string().optional(),
  categoria: z.string().optional(),
  usaInventario: z.boolean().default(false),
  cantidadMinima: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Articulos() {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Remote products list (Supabase)
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  // Categories local list (client-side only)
  const [categorias, setCategorias] = useState<string[]>(["Servicio", "Producto", "Insumo"]);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Image upload state (client-side only)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Barcode image input (for BarcodeDetector)
  const barcodeFileRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      codigoBarras: "",
      vendePor: "unidad",
      precioCosto: "",
      precioVenta: "",
      precioMayoreo: "",
      categoria: "",
      usaInventario: false,
      cantidadMinima: "",
    },
  });

  const errorsCount = Object.keys(form.formState.errors).length;

  useEffect(() => {
    document.title = "Artículos | Nuevo producto";
  }, []);

  const nombreLength = form.watch("nombre")?.length ?? 0;
  const usaInventario = form.watch("usaInventario");
  const cantidadMinima = form.watch("cantidadMinima");
  const ventaNum = moneyToNumber(form.watch("precioVenta") || "0");
  const isSubmitDisabled = !form.formState.isValid || ventaNum <= 0 || (usaInventario && (!cantidadMinima || Number(cantidadMinima) <= 0));

  // Load products from Supabase with simple pagination (overfetch by 1)
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await listProducts({ search: search || undefined, activeOnly: true, page, limit: pageSize + 1 });
      if (error) {
        toast({ title: "Error cargando productos", description: error, variant: "destructive" });
        return;
      }
      const rows = data ?? [];
      setHasNext(rows.length > pageSize);
      setProducts(rows.slice(0, pageSize));
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Error desconocido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const eliminarArticulo = (id: string) => {
    setProducts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!/(png|jpg|jpeg)$/i.test(file.type)) {
      toast({ title: "Formato no soportado", description: "Solo JPG o PNG", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const onScanBarcodeClick = async () => {
    const hasDetector = typeof (window as any).BarcodeDetector !== "undefined";
    if (!hasDetector) {
      toast({ title: "Escáner no disponible", description: "Ingrese el código manualmente" });
      return;
    }
    barcodeFileRef.current?.click();
  };

  const onBarcodeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const imgBitmap = await createImageBitmap(file);
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ["code_128", "ean_13", "upc_a", "qr_code"] });
      const results = await detector.detect(imgBitmap);
      if (results && results[0]?.rawValue) {
        form.setValue("codigoBarras", results[0].rawValue, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Código detectado", description: results[0].rawValue });
      } else {
        toast({ title: "No se detectó código", description: "Prueba otra foto o ingresa manualmente" });
      }
    } catch (err) {
      toast({ title: "Error al escanear", description: "Intenta nuevamente", variant: "destructive" });
    } finally {
      if (barcodeFileRef.current) barcodeFileRef.current.value = "";
    }
  };

  // Currency helpers for inputs
  const handleMoneyChange = (field: keyof Pick<FormValues, "precioCosto" | "precioVenta" | "precioMayoreo">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Keep digits and separators, then reformat
      const num = moneyToNumber(raw);
      const formatted = raw === "" ? "" : formatMoneyDOP(num);
      form.setValue(field, formatted, { shouldValidate: true, shouldDirty: true });
    };

  const handleMoneyBlur = (field: keyof Pick<FormValues, "precioCosto" | "precioVenta" | "precioMayoreo">) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const num = moneyToNumber(e.target.value);
      form.setValue(field, num ? formatMoneyDOP(num) : "", { shouldValidate: true, shouldDirty: true });
    };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingSubmitRef = useRef<FormValues | null>(null);

  const validateBeforeSave = async (values: FormValues) => {
    const venta = moneyToNumber(values.precioVenta || "0");
    const costo = moneyToNumber(values.precioCosto || "0");

    // Required checks
    if (!values.nombre?.trim()) return false;
    if (!venta || venta <= 0) return false;
    if (values.usaInventario && (!values.cantidadMinima || Number(values.cantidadMinima) <= 0)) return false;

    // Warn if venta < costo
    if (costo > 0 && venta < costo) {
      pendingSubmitRef.current = values;
      setConfirmOpen(true);
      return false; // wait for confirmation
    }
    return true;
  };

  const doSubmit = async (values: FormValues) => {
    try {
      // DB uniqueness check for barcode -> map to sku
      const barcode = values.codigoBarras?.trim();
      if (barcode) {
        const { data: existing, error } = await listProducts({ limit: 200 });
        if (error) {
          toast({ title: "Error verificando código", description: error, variant: "destructive" });
          return;
        }
        const dup = (existing ?? []).some((p) => (p.sku ?? "").trim() === barcode);
        if (dup) {
          toast({ title: "Código de barras ya registrado", description: "Usa otro código", variant: "destructive" });
          return;
        }
      }

      const unitPrice = moneyToNumber(values.precioVenta || "0");
      const { data, error } = await upsertProduct({
        name: values.nombre.trim(),
        unit_price: unitPrice,
        currency: "DOP",
        sku: barcode || null as any,
        active: true,
      });
      if (error) {
        toast({ title: "No se pudo guardar", description: error, variant: "destructive" });
        return;
      }

      toast({ title: "Producto guardado", description: data?.name });
      setShowForm(false);
      form.reset();
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);

      // Refresh list from first page to show newest product
      setPage(0);
      await loadProducts();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Error desconocido", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    const ok = await validateBeforeSave(values);
    if (ok) await doSubmit(values);
  };

  const confirmProceed = async () => {
    const vals = pendingSubmitRef.current;
    setConfirmOpen(false);
    if (vals) await doSubmit(vals);
    pendingSubmitRef.current = null;
  };

  const isCantidadMinimaInvalid = usaInventario && (!cantidadMinima || Number(cantidadMinima) === 0);

  return (
    <div className="container mx-auto p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-3">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-foreground">Artículos</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Buscar productos..."
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              aria-label="Buscar productos"
            />
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Artículo
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agregar Nuevo Artículo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-live="polite">
                {/* Error live region */}
                <div role="status" aria-live="polite" className="sr-only">
                  {errorsCount > 0 ? `Hay ${errorsCount} errores en el formulario` : "Formulario sin errores"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre / Descripción */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="nombre">Nombre / Descripción</Label>
                    <Input
                      id="nombre"
                      maxLength={150}
                      aria-describedby="nombre-counter"
                      {...form.register("nombre")}
                    />
                    <div id="nombre-counter" className="text-xs text-muted-foreground text-right">
                      {nombreLength}/150
                    </div>
                  </div>

                  {/* Código de barras */}
                  <div className="space-y-2">
                    <Label htmlFor="codigoBarras">Código de barras</Label>
                    <div className="flex gap-2">
                      <Input id="codigoBarras" placeholder="Escanea o escribe" {...form.register("codigoBarras")}/>
                      <Button type="button" variant="secondary" onClick={onScanBarcodeClick} aria-label="Escanear código">
                        <Barcode className="w-4 h-4" />
                      </Button>
                      <input ref={barcodeFileRef} type="file" accept="image/*" className="hidden" onChange={onBarcodeFileSelected} capture="environment"/>
                    </div>
                  </div>

                  {/* Se vende */}
                  <div className="space-y-2">
                    <Label>Se vende</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("vendePor")}
                      onValueChange={(v) => v && form.setValue("vendePor", v as any, { shouldDirty: true })}
                      className="w-full"
                    >
                      <ToggleGroupItem value="unidad" className="flex-1" aria-label="Por unidad">
                        Por unidad
                      </ToggleGroupItem>
                      <ToggleGroupItem value="granel" className="flex-1" aria-label="A granel">
                        A granel
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Precios */}
                  <div className="space-y-2">
                    <Label htmlFor="precioCosto">Precio costo</Label>
                    <Input
                      id="precioCosto"
                      inputMode="decimal"
                      placeholder="RD$ 0.00"
                      value={form.watch("precioCosto") ?? ""}
                      onChange={handleMoneyChange("precioCosto")}
                      onBlur={handleMoneyBlur("precioCosto")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precioVenta">Precio venta</Label>
                    <Input
                      id="precioVenta"
                      required
                      inputMode="decimal"
                      placeholder="RD$ 0.00"
                      value={form.watch("precioVenta") ?? ""}
                      onChange={handleMoneyChange("precioVenta")}
                      onBlur={handleMoneyBlur("precioVenta")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precioMayoreo">Precio mayoreo (opcional)</Label>
                    <Input
                      id="precioMayoreo"
                      inputMode="decimal"
                      placeholder="RD$ 0.00"
                      value={form.watch("precioMayoreo") ?? ""}
                      onChange={handleMoneyChange("precioMayoreo")}
                      onBlur={handleMoneyBlur("precioMayoreo")}
                    />
                  </div>

                  {/* Categoría combobox */}
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {form.watch("categoria") ? form.watch("categoria") : "Selecciona categoría"}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                        <Command>
                          <CommandInput placeholder="Buscar categoría..." />
                          <CommandEmpty>Sin resultados.</CommandEmpty>
                          <CommandGroup>
                            {categorias.map((c) => (
                              <CommandItem key={c} onSelect={() => form.setValue("categoria", c, { shouldDirty: true })}>
                                {c}
                              </CommandItem>
                            ))}
                            <CommandItem onSelect={() => setNewCategoryOpen(true)}>+ Crear nueva categoría</CommandItem>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Inventario */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="usaInventario">Usa inventario</Label>
                      <Switch id="usaInventario" checked={usaInventario} onCheckedChange={(v) => form.setValue("usaInventario", v, { shouldDirty: true })} />
                    </div>
                    {usaInventario && (
                      <div className="space-y-2">
                        <Label htmlFor="cantidadMinima">Cantidad mínima</Label>
                        <Input
                          id="cantidadMinima"
                          inputMode="numeric"
                          value={form.watch("cantidadMinima") ?? ""}
                          onChange={(e) => form.setValue("cantidadMinima", e.target.value.replace(/[^0-9]/g, ""), { shouldDirty: true, shouldValidate: true })}
                          className={isCantidadMinimaInvalid ? "border-destructive" : undefined}
                        />
                        {isCantidadMinimaInvalid && (
                          <p className="text-xs text-destructive">Debe ser mayor a 0</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Imagen */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Imagen (opcional)</Label>
                    {!imagePreview ? (
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center">
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                          />
                          <Button type="button" variant="outline" className="gap-2">
                            <ImagePlus className="w-4 h-4" /> Subir imagen
                          </Button>
                        </label>
                        <p className="text-xs text-muted-foreground">JPG/PNG, máx. 2MB</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img src={imagePreview} alt="Vista previa del producto" className="h-16 w-16 rounded-md object-cover border" />
                        <Button type="button" variant="ghost" className="gap-2" onClick={() => handleImageChange(null)}>
                          <X className="w-4 h-4" /> Quitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert when venta < costo */}
                {moneyToNumber(form.watch("precioCosto") || "0") > 0 && moneyToNumber(form.watch("precioVenta") || "0") > 0 && moneyToNumber(form.watch("precioVenta") || "0") < moneyToNumber(form.watch("precioCosto") || "0") && (
                  <Alert variant="default">
                    <AlertDescription>
                      El precio de venta es menor que el costo. Se te pedirá confirmación al guardar.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitDisabled || form.formState.isSubmitting}>
                    Guardar producto
                  </Button>
                  <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => navigate("/articulos")}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Listado desde Supabase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive"
                      onClick={() => eliminarArticulo(p.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-medium">{formatMoneyDOP(Number(p.unit_price || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría:</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className={"text-muted-foreground"}>-</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Anterior
          </Button>
          <Button variant="outline" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>

        {/* Confirm dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Precio de venta menor al costo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">¿Deseas continuar de todos modos?</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button onClick={confirmProceed}>Sí, continuar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Crear categoría */}
        <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-category">Nombre</Label>
              <Input id="new-category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewCategoryOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => {
                  const name = newCategoryName.trim();
                  if (!name) return;
                  setCategorias((prev) => Array.from(new Set([...prev, name])));
                  form.setValue("categoria", name, { shouldDirty: true });
                  setNewCategoryName("");
                  setNewCategoryOpen(false);
                }}
              >
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
