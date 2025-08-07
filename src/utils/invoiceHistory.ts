import { InvoiceData, ServiceItem } from '@/components/InvoiceForm';

export interface HistoryInvoice extends InvoiceData {
  invoiceNumber: string;
  createdAt: string;
  id: string;
}

const HISTORY_KEY = 'invoice-history';

export const saveInvoiceToHistory = (invoiceData: InvoiceData, invoiceNumber: string): void => {
  const existingHistory = getInvoiceHistory();
  
  const historyInvoice: HistoryInvoice = {
    ...invoiceData,
    invoiceNumber,
    createdAt: new Date().toISOString(),
    id: `${invoiceNumber}-${Date.now()}`,
  };

  const updatedHistory = [historyInvoice, ...existingHistory];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
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
      total: invoice.total ?? invoice.services?.reduce((sum: number, service: any) => sum + parseFloat(service.amount || '0'), 0) ?? 0
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