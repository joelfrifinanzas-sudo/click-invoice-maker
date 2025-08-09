import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import {
  FileText,
  Users,
  Star,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronRight,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { getCompanyProfile } from '@/utils/companyProfile';
import { getInvoiceHistory, HistoryInvoice } from '@/utils/invoiceHistory';
import { formatMoneyDOP, formatDateEs } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { es } from 'date-fns/locale';
import { isSameDay, subDays } from 'date-fns';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function Inicio() {
  const navigate = useNavigate();
  const { markDashboardNavigation } = useNavigation();

  // Perfil actual para saludo
  const profile = useMemo(() => getCompanyProfile(), []);
  const userName = profile.signatureName || profile.businessName || 'Usuario';

  // Estados de carga perezosa
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // SEO
  useEffect(() => {
    document.title = 'Inicio · Factura con 1 Click';
    const desc = 'Gestiona tus facturas de forma rápida y sencilla en un solo lugar.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  // Acciones rápidas (mismo onClick/navegación)
  const actions = [
    { title: 'Nueva factura', icon: FileText, path: '/crear-factura' },
    { title: 'Clientes', icon: Users, path: '/clientes' },
    { title: 'Productos', icon: Star, path: '/articulos' },
    { title: 'Cotizaciones', icon: ClipboardList, path: '/cotizaciones' },
  ];

  function go(path: string) {
    markDashboardNavigation();
    navigate(path);
  }

  // Últimas facturas (mismo origen de datos)
  const invoices = useMemo<HistoryInvoice[]>(() => {
    return getInvoiceHistory()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setLoadingInvoices(false), 150);
    const t2 = setTimeout(() => setLoadingProducts(false), 180);
    const t3 = setTimeout(() => setLoadingSummary(false), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Productos más vendidos (agregación local a partir de facturas)
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--accent))',
    'hsl(var(--destructive))',
    'hsl(var(--ring))',
    'hsl(var(--border))',
    'hsl(var(--foreground))',
  ];

  const topProducts = useMemo(() => {
    const agg = new Map<string, number>();
    for (const inv of getInvoiceHistory()) {
      if (!inv.services) continue;
      for (const s of inv.services as any[]) {
        const qty = parseFloat(s.quantity || '1');
        const unit = parseFloat(s.unitPrice || s.amount || '0');
        const subtotal = (isNaN(qty) || isNaN(unit)) ? 0 : qty * unit;
        const name = s.concept || 'Sin nombre';
        agg.set(name, (agg.get(name) || 0) + subtotal);
      }
    }
    return Array.from(agg.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, []);

  // Resumen del día (ventas pagadas hoy, gastos del día desde localStorage opcional)
  function getExpensesForDate(date: Date): number {
    try {
      const raw = localStorage.getItem('expenses-history');
      if (!raw) return 0;
      const items = JSON.parse(raw) as { date: string; amount: number }[];
      return items.filter(x => isSameDay(new Date(x.date), date)).reduce((sum, x) => sum + (x.amount || 0), 0);
    } catch { return 0; }
  }

  const summary = useMemo(() => {
    const sales = getInvoiceHistory()
      .filter(inv => inv.paymentStatus === 'pagado' && isSameDay(new Date(inv.createdAt), selectedDate))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const expenses = getExpensesForDate(selectedDate);
    const profit = sales - expenses;

    const prevDate = subDays(selectedDate, 1);
    const prevSales = getInvoiceHistory()
      .filter(inv => inv.paymentStatus === 'pagado' && isSameDay(new Date(inv.createdAt), prevDate))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const prevExpenses = getExpensesForDate(prevDate);
    const prevProfit = prevSales - prevExpenses;
    const pct = prevProfit === 0 ? (profit > 0 ? 100 : 0) : ((profit - prevProfit) / Math.abs(prevProfit)) * 100;

    return { sales, expenses, profit, pct };
  }, [selectedDate]);

  function getStatus(inv: HistoryInvoice): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
    if (inv.paymentStatus === 'pagado') return { label: 'Pagada', variant: 'secondary' };
    const olderThan30 = (Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24) > 30;
    if (olderThan30) return { label: 'Vencida', variant: 'destructive' };
    return { label: 'Borrador', variant: 'default' };
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle pb-20">
        {/* Encabezado */}
        <div className="container mx-auto px-4 py-6">
          <div className="rounded-2xl bg-card border shadow-sm p-6">
            <h1 className="text-2xl md:text-3xl font-bold">✨ Bienvenido, {userName}</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus facturas de forma rápida y sencilla</p>
          </div>
        </div>

        <div className="container mx-auto px-4 space-y-6 pb-8">
          {/* Acciones rápidas */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {actions.map((a, i) => (
                <button key={i} onClick={() => go(a.path)} className="bg-[hsl(var(--btn-primary))] text-[hsl(var(--btn-primary-foreground))] hover:bg-[hsl(var(--btn-primary-hover))] border rounded-xl p-4 shadow-sm hover:shadow-md transition hover-scale text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <a.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="font-medium">{a.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Últimas facturas */}
          <section>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Últimas facturas</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => go('/historial')}>
                  Ver más <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingInvoices ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
                  </div>
                ) : invoices.length === 0 ? (
                  <p className="text-muted-foreground">No hay facturas aún.</p>
                ) : (
                  <div className="divide-y">
                    {invoices.map((inv) => {
                      const st = getStatus(inv);
                      return (
                        <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{inv.clientName || 'Cliente sin nombre'}</div>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                              <span>{formatDateEs(inv.createdAt)}</span>
                              <Separator orientation="vertical" className="h-4" />
                              <span>NCF {inv.ncf || '—'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-semibold">{formatMoneyDOP(inv.total || 0)}</div>
                              <div className="text-xs text-muted-foreground">{inv.invoiceType}</div>
                            </div>
                            <Badge variant={st.variant} className="flex items-center gap-1">
                              {st.variant === 'secondary' ? <CheckCircle className="h-4 w-4" /> : st.variant === 'destructive' ? <AlertTriangle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                              {st.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Productos más vendidos */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <Skeleton className="h-56 w-full" />
                ) : topProducts.length === 0 ? (
                  <p className="text-muted-foreground">Aún no hay ventas registradas.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="h-56">
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip formatter={(val: any) => formatMoneyDOP(Number(val))} />
                          <Pie data={topProducts} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} stroke="transparent">
                            {topProducts.map((_, idx) => (<Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-2">
                      {topProducts.map((p, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="truncate">{p.name}</span>
                          </div>
                          <span className="font-medium">{formatMoneyDOP(p.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Resumen del día */}
          <section>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Resumen del día</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateEs(selectedDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardContent>
                {loadingSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-xl p-4">
                      <div className="text-sm text-muted-foreground">Total vendido</div>
                      <div className="text-lg font-bold">{formatMoneyDOP(summary.sales)}</div>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <div className="text-sm text-muted-foreground">Gasto del día</div>
                      <div className="text-lg font-bold">{formatMoneyDOP(summary.expenses)}</div>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <div className="text-sm text-muted-foreground">Ganancia neta</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-lg font-bold">{formatMoneyDOP(summary.profit)}</div>
                        <span className={summary.pct >= 0 ? 'text-primary text-sm' : 'text-destructive text-sm'}>
                          {summary.pct >= 0 ? '+' : ''}{summary.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Layout>
  );
}
