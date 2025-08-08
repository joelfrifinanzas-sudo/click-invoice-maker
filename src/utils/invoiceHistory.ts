import { InvoiceData, ServiceItem } from '@/components/InvoiceForm';

export interface HistoryInvoice extends InvoiceData {
  invoiceNumber: string;
  createdAt: string;
  id: string;
}

const HISTORY_KEY = 'invoice-history';

export const saveInvoiceToHistory = (invoiceData: InvoiceData, invoiceNumber: string): string => {
  const existingHistory = getInvoiceHistory();
  
  const historyInvoice: HistoryInvoice = {
    ...invoiceData,
    invoiceNumber,
    createdAt: new Date().toISOString(),
    id: `${invoiceNumber}-${Date.now()}`,
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