// Generador de NCF (Número de Comprobante Fiscal) según DGII de República Dominicana

export type NCFType = 
  | 'B01' // Factura de Crédito Fiscal
  | 'B02' // Factura de Consumidor Final
  | 'B03' // Nota de Débito
  | 'B04' // Nota de Crédito
  | 'B11' // Comprobante de Compras
  | 'B12' // Registro de Único de Ingresos
  | 'B13' // Comprobantes para Gastos Menores
  | 'B14' // Comprobante de Regímenes Especiales
  | 'B15' // Comprobante Gubernamental
  | 'B16' // Comprobante para Exportaciones
  | 'NONE'; // Sin comprobante fiscal (factura interna)

export interface NCFConfig {
  type: NCFType;
  description: string;
  requiresClientId: boolean;
  isFiscal: boolean;
}

// Tipos permitidos para el formulario
export const ALLOWED_NCF_TYPES: NCFType[] = ['B01', 'B02', 'B04', 'B15', 'NONE'];

export const NCF_TYPES: Record<NCFType, NCFConfig> = {
  'B01': {
    type: 'B01',
    description: 'Factura de Crédito Fiscal',
    requiresClientId: true,
    isFiscal: true
  },
  'B02': {
    type: 'B02', 
    description: 'Factura de Consumidor Final',
    requiresClientId: false,
    isFiscal: true
  },
  'B03': {
    type: 'B03',
    description: 'Nota de Débito',
    requiresClientId: true,
    isFiscal: true
  },
  'B04': {
    type: 'B04',
    description: 'Nota de Crédito', 
    requiresClientId: true,
    isFiscal: true
  },
  'B11': {
    type: 'B11',
    description: 'Comprobante de Compras',
    requiresClientId: false,
    isFiscal: true
  },
  'B12': {
    type: 'B12',
    description: 'Registro de Único de Ingresos',
    requiresClientId: false,
    isFiscal: true
  },
  'B13': {
    type: 'B13',
    description: 'Comprobantes para Gastos Menores',
    requiresClientId: false,
    isFiscal: true
  },
  'B14': {
    type: 'B14',
    description: 'Comprobante de Regímenes Especiales',
    requiresClientId: true,
    isFiscal: true
  },
  'B15': {
    type: 'B15',
    description: 'Comprobante Gubernamental',
    requiresClientId: true,
    isFiscal: true
  },
  'B16': {
    type: 'B16',
    description: 'Comprobante para Exportaciones',
    requiresClientId: true,
    isFiscal: true
  },
  'NONE': {
    type: 'NONE',
    description: 'Factura Interna (Sin Comprobante Fiscal)',
    requiresClientId: false,
    isFiscal: false
  }
};

// Función para obtener el RNC de la empresa desde el perfil
const getCompanyRNC = (): string => {
  const companyProfile = JSON.parse(localStorage.getItem('company-profile') || '{}');
  return companyProfile.businessRnc || '000000000'; // RNC por defecto si no está configurado
};

// Función para generar el próximo número secuencial del NCF
const getNextNCFSequence = (ncfType: NCFType): string => {
  const key = `ncf-sequence-${ncfType}`;
  const lastSequence = localStorage.getItem(key) || '0';
  const nextSequence = parseInt(lastSequence) + 1;
  localStorage.setItem(key, nextSequence.toString());
  
  return nextSequence.toString().padStart(8, '0');
};

// Función para generar número de factura interno
const getNextInternalInvoiceNumber = (): string => {
  const key = 'internal-invoice-sequence';
  const lastSequence = localStorage.getItem(key) || '0';
  const nextSequence = parseInt(lastSequence) + 1;
  localStorage.setItem(key, nextSequence.toString());
  
  return `FAC-${new Date().getFullYear()}-${nextSequence.toString().padStart(6, '0')}`;
};

// Función principal para generar NCF
export const generateNCF = (ncfType: NCFType): string => {
  // Si no es fiscal, generar número de factura interno
  if (ncfType === 'NONE') {
    return getNextInternalInvoiceNumber();
  }
  
  const sequence = getNextNCFSequence(ncfType);
  
  // Formato NCF simplificado: Tipo (3 caracteres) + Secuencia (8 dígitos)
  const ncf = `${ncfType}${sequence}`;
  
  return ncf;
};

// Función para determinar el tipo de NCF automáticamente
export const determineNCFType = (hasClientId: boolean, amount: number): NCFType => {
  // Si tiene cédula/RNC y el monto es mayor a 250,000 DOP, usar crédito fiscal
  if (hasClientId && amount > 250000) {
    return 'B01'; // Factura de Crédito Fiscal
  }
  
  // Si tiene cédula/RNC pero el monto es menor, usar crédito fiscal igual
  if (hasClientId) {
    return 'B01'; // Factura de Crédito Fiscal
  }
  
  // Sin cédula/RNC, usar consumidor final
  return 'B02'; // Factura de Consumidor Final
};

// Funciones para cálculo de ITBIS
export const calculateITBIS = (subtotal: number): number => {
  return subtotal * 0.18; // 18% ITBIS
};

export const calculateSubtotal = (totalWithITBIS: number): number => {
  return totalWithITBIS / 1.18;
};

export const calculateTotalWithITBIS = (subtotal: number): number => {
  return subtotal + calculateITBIS(subtotal);
};

// Función para validar formato de NCF
export const validateNCF = (ncf: string): boolean => {
  // Validar NCF fiscal
  const ncfRegex = /^B(01|02|03|04|11|12|13|14|15|16)\d{8}$/;
  // Validar número de factura interno
  const internalRegex = /^FAC-\d{4}-\d{6}$/;
  
  return ncfRegex.test(ncf) || internalRegex.test(ncf);
};

// Función para extraer información del NCF
export const parseNCF = (ncf: string): { type: NCFType; sequence: string; isFiscal: boolean } | null => {
  if (!validateNCF(ncf)) return null;
  
  // Si es número de factura interno
  if (ncf.startsWith('FAC-')) {
    return { 
      type: 'NONE', 
      sequence: ncf.split('-')[2], 
      isFiscal: false 
    };
  }
  
  // Si es NCF fiscal
  const type = ncf.substring(0, 3) as NCFType;
  const sequence = ncf.substring(3, 11);
  
  return { type, sequence, isFiscal: true };
};