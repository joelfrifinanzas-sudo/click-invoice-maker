import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Pencil, Star, Ban, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { maskAccountNumber } from '@/utils/mask';
import type { PaymentMethods, Bank, BankAccount } from '@/utils/localPayments';
import { getPaymentMethods, savePaymentMethods, getBanks, getBankAccounts, saveBankAccounts } from '@/utils/localPayments';

export default function Pagos() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethods>(() => getPaymentMethods());
  const [banks, setBanks] = useState<Bank[]>(() => getBanks());
  const [accounts, setAccounts] = useState<BankAccount[]>(() => getBankAccounts());

  useEffect(() => {
    savePaymentMethods(methods);
  }, [methods]);

  useEffect(() => {
    saveBankAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    document.title = 'Ajustes de Pagos | Métodos y Cuentas';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Configura métodos de pago y cuentas bancarias para recibir pagos.');
  }, []);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const handleTogglePreferred = (acc: BankAccount) => {
    if (!acc.activa) {
      toast({ title: 'No permitido', description: 'No se puede marcar como preferida una cuenta inactiva.' });
      return;
    }
    setAccounts((prev) => prev.map(a => a.id === acc.id ? { ...a, preferida: !a.preferida } : a));
  };

  const handleDisable = (acc: BankAccount) => {
    setAccounts((prev) => prev.map(a => a.id === acc.id ? { ...a, activa: false, preferida: false } : a));
    toast({ title: 'Cuenta deshabilitada', description: `${acc.banco_nombre} · ${acc.alias}` });
  };

  const onCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };
  const onEdit = (acc: BankAccount) => {
    setEditing(acc);
    setOpenForm(true);
  };

  const preferredBadge = (acc: BankAccount) => acc.preferida ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary">Preferida</span>
  ) : null;

  const activeAccounts = useMemo(() => accounts.sort((a, b) => a.alias.localeCompare(b.alias)), [accounts]);

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader title="Ajustes · Pagos" description="Define métodos disponibles y administra tus cuentas bancarias" />

          {/* Métodos disponibles */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos disponibles</CardTitle>
              <CardDescription>Activa los métodos que ofrecerás a tus clientes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {([
                { key: 'transferencia', label: 'Transferencia bancaria' },
                { key: 'visa', label: 'Visa' },
                { key: 'mastercard', label: 'Mastercard' },
                { key: 'paypal', label: 'PayPal' },
                { key: 'otros', label: 'Otros' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{methods[key] ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <Switch checked={methods[key]} onCheckedChange={(val) => setMethods((m) => ({ ...m, [key]: val }))} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cuentas bancarias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Cuentas bancarias</CardTitle>
                <CardDescription>Registra las cuentas donde recibirás pagos</CardDescription>
              </div>
              <Dialog open={openForm} onOpenChange={setOpenForm}>
                <DialogTrigger asChild>
                  <Button onClick={onCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar cuenta
                  </Button>
                </DialogTrigger>
                <AccountForm
                  open={openForm}
                  onClose={() => setOpenForm(false)}
                  banks={banks}
                  initial={editing}
                  onSave={(acc) => {
                    setAccounts((prev) => {
                      const exists = prev.some((a) => a.id === acc.id);
                      if (exists) {
                        return prev.map((a) => (a.id === acc.id ? acc : a));
                      }
                      return [acc, ...prev];
                    });
                    setOpenForm(false);
                    toast({ title: editing ? 'Cuenta actualizada' : 'Cuenta agregada', description: `${acc.banco_nombre} · ${acc.alias}` });
                  }}
                  onValidateUnique={(banco_id, numero, currentId) => {
                    return !accounts.some(a => a.banco_id === banco_id && a.numero.trim() === numero.trim() && a.id !== currentId);
                  }}
                />
              </Dialog>
            </CardHeader>
            <CardContent>
              {activeAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no tienes cuentas agregadas.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banco</TableHead>
                        <TableHead>Alias</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAccounts.map((acc) => (
                        <TableRow key={acc.id} className={cn(!acc.activa && 'opacity-60')}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{acc.banco_nombre}</span>
                              {preferredBadge(acc)}
                            </div>
                          </TableCell>
                          <TableCell>{acc.alias}</TableCell>
                          <TableCell className="capitalize">{acc.tipo}</TableCell>
                          <TableCell>{maskAccountNumber(acc.numero)}</TableCell>
                          <TableCell>
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs', acc.activa ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{acc.activa ? 'Activa' : 'Inactiva'}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => onEdit(acc)}>
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleTogglePreferred(acc)} disabled={!acc.activa}>
                                <Star className={cn('h-4 w-4 mr-1', acc.preferida ? 'text-yellow-500' : 'text-muted-foreground')} />
                                {acc.preferida ? 'Quitar preferida' : 'Preferida'}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDisable(acc)} disabled={!acc.activa}>
                                <Ban className="h-4 w-4 mr-1" /> Deshabilitar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function AccountForm({ open, onClose, banks, initial, onSave, onValidateUnique }: {
  open: boolean;
  onClose: () => void;
  banks: Bank[];
  initial: BankAccount | null;
  onSave: (acc: BankAccount) => void;
  onValidateUnique: (banco_id: number, numero: string, currentId?: string) => boolean;
}) {
  const { toast } = useToast();
  const [bankOpen, setBankOpen] = useState(false);
  const [bankId, setBankId] = useState<number | null>(initial ? initial.banco_id : null);
  const [tipo, setTipo] = useState<'ahorros'|'corriente'|'cheques'>(initial ? initial.tipo : 'ahorros');
  const [alias, setAlias] = useState<string>(initial ? initial.alias : '');
  const [numero, setNumero] = useState<string>(initial ? initial.numero : '');
  const [activa, setActiva] = useState<boolean>(initial ? initial.activa : true);
  const [preferida, setPreferida] = useState<boolean>(initial ? initial.preferida : false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
  }, [open]);

  const selectedBank = useMemo(() => banks.find(b => b.id === bankId) || null, [banks, bankId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bankId) e.banco = 'Selecciona un banco';
    if (!tipo) e.tipo = 'Selecciona un tipo';
    if (alias.trim().length < 2 || alias.trim().length > 60) e.alias = 'Alias debe tener entre 2 y 60 caracteres';
    if (numero.trim().length < 6 || numero.trim().length > 30) e.numero = 'Número debe tener entre 6 y 30 caracteres';
    if (bankId && numero && !onValidateUnique(bankId, numero, initial?.id)) e.numero = 'Ya existe una cuenta con ese banco y número';
    if (preferida && !activa) e.preferida = 'No se permite preferida si está inactiva';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const id = initial?.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const acc: BankAccount = {
      id,
      banco_id: bankId!,
      banco_nombre: selectedBank?.nombre || '',
      tipo,
      alias: alias.trim(),
      numero: numero.trim(),
      moneda: 'DOP',
      activa,
      preferida: activa ? preferida : false,
      created_at: initial?.created_at ?? now,
    };
    onSave(acc);
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{initial ? 'Editar cuenta' : 'Agregar cuenta'}</DialogTitle>
        <DialogDescription>Completa los datos de la cuenta bancaria</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {/* Banco combobox */}
        <div className="space-y-2">
          <Label>Banco</Label>
          <Popover open={bankOpen} onOpenChange={setBankOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={bankOpen} className="w-full justify-between">
                {selectedBank ? selectedBank.nombre : 'Selecciona un banco'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
              <Command>
                <CommandInput placeholder="Buscar banco..." />
                <CommandEmpty>No encontrado</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {banks.map((b) => (
                      <CommandItem key={b.id} value={b.nombre} onSelect={() => { setBankId(b.id); setBankOpen(false); }}>
                        <Check className={cn('mr-2 h-4 w-4', b.id === bankId ? 'opacity-100' : 'opacity-0')} />
                        {b.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.banco && <p className="text-xs text-destructive mt-1">{errors.banco}</p>}
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo de cuenta</Label>
          <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['ahorros','corriente','cheques'].map((t) => (
              <Label key={t} className={cn('flex items-center gap-2 border rounded-md p-2 cursor-pointer', tipo === t && 'ring-2 ring-primary')}> 
                <RadioGroupItem value={t} id={`tipo-${t}`} />
                <span className="capitalize">{t}</span>
              </Label>
            ))}
          </RadioGroup>
          {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo}</p>}
        </div>

        {/* Alias */}
        <div className="space-y-2">
          <Label htmlFor="alias">Alias</Label>
          <Input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej. Cuenta principal" />
          {errors.alias && <p className="text-xs text-destructive mt-1">{errors.alias}</p>}
        </div>

        {/* Número */}
        <div className="space-y-2">
          <Label htmlFor="numero">Número de cuenta</Label>
          <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej. 1234567890" />
          {errors.numero && <p className="text-xs text-destructive mt-1">{errors.numero}</p>}
          {numero && <p className="text-xs text-muted-foreground">Se mostrará como {maskAccountNumber(numero)}</p>}
        </div>

        {/* Estado / Preferida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <p className="text-sm font-medium">Activa</p>
              <p className="text-xs text-muted-foreground">Disponible para cobros</p>
            </div>
            <Switch checked={activa} onCheckedChange={(v) => { setActiva(v); if (!v) setPreferida(false); }} />
          </div>
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <p className="text-sm font-medium">Preferida</p>
              <p className="text-xs text-muted-foreground">Se mostrará destacada</p>
            </div>
            <Switch checked={preferida} onCheckedChange={(v) => setPreferida(v)} disabled={!activa} />
          </div>
          {errors.preferida && <p className="text-xs text-destructive">{errors.preferida}</p>}
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>{initial ? 'Guardar cambios' : 'Agregar'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
