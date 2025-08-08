export type PaymentMethods = {
  visa: boolean;
  mastercard: boolean;
  transferencia: boolean;
  paypal: boolean;
  otros: boolean;
};

export type Bank = {
  id: number;
  nombre: string;
  codigo?: string | null;
  activo: boolean;
};

export type BankAccount = {
  id: string; // uuid string
  banco_id: number;
  banco_nombre: string;
  tipo: 'ahorros' | 'corriente' | 'cheques';
  alias: string;
  numero: string; // plain, mask in UI
  moneda: 'DOP';
  activa: boolean;
  preferida: boolean;
  created_at: string; // ISO date
};

const LS_KEYS = {
  methods: 'payments:metodos_pago',
  banks: 'payments:bancos_rd',
  accounts: 'payments:cuentas_bancarias',
};

const defaultMethods: PaymentMethods = {
  visa: false,
  mastercard: false,
  transferencia: true,
  paypal: false,
  otros: false,
};

const seedBanks: Bank[] = [
  'Banreservas',
  'Banco Popular',
  'Banco BHD',
  'Banco Santa Cruz',
  'Banco Caribe',
  'Scotiabank RD',
  'Banco Promerica',
  'Banco Ademi',
  'Banco BDI',
  'Banco Vimenca',
  'APAP',
  'ACAP',
  'La Nacional',
].map((nombre, idx) => ({ id: idx + 1, nombre, codigo: null, activo: true }));

export function getPaymentMethods(): PaymentMethods {
  try {
    const raw = localStorage.getItem(LS_KEYS.methods);
    if (!raw) return defaultMethods;
    const parsed = JSON.parse(raw);
    return { ...defaultMethods, ...parsed } as PaymentMethods;
  } catch {
    return defaultMethods;
  }
}

export function savePaymentMethods(val: PaymentMethods) {
  localStorage.setItem(LS_KEYS.methods, JSON.stringify(val));
}

export function getBanks(): Bank[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.banks);
    const list = raw ? (JSON.parse(raw) as Bank[]) : seedBanks;
    return list.filter((b) => b.activo).sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch {
    return seedBanks;
  }
}

export function saveBanks(list: Bank[]) {
  localStorage.setItem(LS_KEYS.banks, JSON.stringify(list));
}

export function getBankAccounts(): BankAccount[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.accounts);
    if (!raw) return [];
    return JSON.parse(raw) as BankAccount[];
  } catch {
    return [];
  }
}

export function saveBankAccounts(list: BankAccount[]) {
  localStorage.setItem(LS_KEYS.accounts, JSON.stringify(list));
}
