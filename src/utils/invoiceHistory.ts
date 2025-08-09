import { InvoiceData, ServiceItem } from '@/components/InvoiceForm';
import { computeTotals } from '@/utils/totals';

export interface HistoryInvoice extends InvoiceData {
  invoiceNumber: string;
  createdAt: string;
  id: string;
  status?: 'pendiente' | 'anulada' | 'emitida' | 'draft';
  canceledAt?: string | null;
  canceledBy?: string | null;
}

const HISTORY_KEY = 'invoice-history';

export const saveInvoiceToHistory = (invoiceData: InvoiceData, invoiceNumber: string): string => {
  const existingHistory = getInvoiceHistory();
  const totals = computeTotals(invoiceData as any);
  
  const historyInvoice: HistoryInvoice = {
    ...invoiceData,
    subtotal: totals.subtotal,
    itbisAmount: totals.itbis,
    total: totals.total,
    invoiceNumber,
    createdAt: new Date().toISOString(),
    id: `${invoiceNumber}-${Date.now()}`,
    status: 'pendiente',
  };

  const updatedHistory = [historyInvoice, ...existingHistory];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return historyInvoice.id;
};

export const getInvoiceHistory = (): HistoryInvoice[] => {
  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    const history = historyData ? JSON.parse(historyData) : [];
    
    // Migrar datos antiguos que no tengan las nuevas propiedades
    return history.map((invoice: any) => ({
      ...invoice,
      includeITBIS: invoice.includeITBIS ?? true,
      subtotal: invoice.subtotal ?? 0,
      itbisAmount: invoice.itbisAmount ?? 0,
      total: invoice.total ?? (invoice.services?.reduce((sum: number, service: any) => {
        const qty = parseFloat(service.quantity ?? '1');
        const unit = parseFloat(service.unitPrice ?? service.amount ?? '0');
        return sum + (isNaN(qty) || isNaN(unit) ? 0 : qty * unit);
      }, 0) ?? 0),
      paymentStatus: invoice.paymentStatus ?? 'credito',
    }));
  } catch (error) {
    console.error('Error loading invoice history:', error);
    return [];
  }
};

export const clearInvoiceHistory = (): void => {
  localStorage.removeItem(HISTORY_KEY);
};

export const deleteInvoiceFromHistory = (id: string): void => {
  const existingHistory = getInvoiceHistory();
  const updatedHistory = existingHistory.filter(invoice => invoice.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const getInvoiceById = (id: string): HistoryInvoice | undefined => {
  return getInvoiceHistory().find(inv => inv.id === id);
};

export const updateInvoiceInHistory = (id: string, patch: Partial<HistoryInvoice>): boolean => {
  const existing = getInvoiceHistory();
  const idx = existing.findIndex(inv => inv.id === id);
  if (idx === -1) return false;
  const inv = existing[idx];
  if (inv.status && inv.status !== 'pendiente') return false; // solo editable si pendiente
  const updated = { ...inv, ...patch } as HistoryInvoice;
  existing[idx] = updated;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  return true;
};

export const cancelInvoiceInHistory = (id: string, userId?: string): boolean => {
  const existing = getInvoiceHistory();
  const idx = existing.findIndex(inv => inv.id === id);
  if (idx === -1) return false;
  const inv = existing[idx];
  if (inv.status === 'anulada') return true;
  existing[idx] = {
    ...inv,
    status: 'anulada',
    canceledAt: new Date().toISOString(),
    canceledBy: userId || null,
  } as HistoryInvoice;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  return true;
};