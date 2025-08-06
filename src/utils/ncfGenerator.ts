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
  | 'B16'; // Comprobante para Exportaciones

export interface NCFConfig {
  type: NCFType;
  description: string;
  requiresClientId: boolean;
}

export const NCF_TYPES: Record<NCFType, NCFConfig> = {
  'B01': {
    type: 'B01',
    description: 'Factura de Crédito Fiscal',
    requiresClientId: true
  },
  'B02': {
    type: 'B02', 
    description: 'Factura de Consumidor Final',
    requiresClientId: false
  },
  'B03': {
    type: 'B03',
    description: 'Nota de Débito',
    requiresClientId: true
  },
  'B04': {
    type: 'B04',
    description: 'Nota de Crédito', 
    requiresClientId: true
  },
  'B11': {
    type: 'B11',
    description: 'Comprobante de Compras',
    requiresClientId: false
  },
  'B12': {
    type: 'B12',
    description: 'Registro de Único de Ingresos',
    requiresClientId: false
  },
  'B13': {
    type: 'B13',
    description: 'Comprobantes para Gastos Menores',
    requiresClientId: false
  },
  'B14': {
    type: 'B14',
    description: 'Comprobante de Regímenes Especiales',
    requiresClientId: true
  },
  'B15': {
    type: 'B15',
    description: 'Comprobante Gubernamental',
    requiresClientId: true
  },
  'B16': {
    type: 'B16',
    description: 'Comprobante para Exportaciones',
    requiresClientId: true
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

// Función principal para generar NCF
export const generateNCF = (ncfType: NCFType): string => {
  const companyRNC = getCompanyRNC();
  const sequence = getNextNCFSequence(ncfType);
  
  // Formato NCF: E + RNC (9 dígitos) + Tipo (3 dígitos) + Secuencia (8 dígitos)
  const ncf = `E${companyRNC.padStart(9, '0')}${ncfType}${sequence}`;
  
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

// Función para validar formato de NCF
export const validateNCF = (ncf: string): boolean => {
  // NCF debe tener 23 caracteres: E + 9 dígitos RNC + 3 caracteres tipo + 8 dígitos secuencia
  const ncfRegex = /^E\d{9}B(01|02|03|04|11|12|13|14|15|16)\d{8}$/;
  return ncfRegex.test(ncf);
};

// Función para extraer información del NCF
export const parseNCF = (ncf: string): { rnc: string; type: NCFType; sequence: string } | null => {
  if (!validateNCF(ncf)) return null;
  
  const rnc = ncf.substring(1, 10);
  const type = ncf.substring(10, 13) as NCFType;
  const sequence = ncf.substring(13, 21);
  
  return { rnc, type, sequence };
};