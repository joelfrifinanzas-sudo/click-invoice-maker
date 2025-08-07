// Validaciones específicas para República Dominicana

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type?: 'cedula' | 'rnc' | 'passport';
}

// Validar cédula dominicana (formato: XXX-XXXXXXX-X)
export const validateCedula = (cedula: string): ValidationResult => {
  // Remover guiones y espacios
  const cleanCedula = cedula.replace(/[-\s]/g, '');
  
  // Verificar que tenga 11 dígitos
  if (!/^\d{11}$/.test(cleanCedula)) {
    return {
      isValid: false,
      message: 'La cédula debe tener 11 dígitos',
      type: 'cedula'
    };
  }

  // Algoritmo de validación de cédula dominicana
  const digits = cleanCedula.split('').map(Number);
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let product = digits[i] * weights[i];
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }
    sum += product;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit !== digits[10]) {
    return {
      isValid: false,
      message: 'Número de cédula inválido',
      type: 'cedula'
    };
  }

  return {
    isValid: true,
    message: 'Cédula válida',
    type: 'cedula'
  };
};

// Validar RNC dominicano (formato: X-XX-XXXXX-X o XXX-XXXXX-X)
export const validateRNC = (rnc: string): ValidationResult => {
  // Remover guiones y espacios
  const cleanRNC = rnc.replace(/[-\s]/g, '');
  
  // Verificar formato de RNC (9 dígitos)
  if (!/^\d{9}$/.test(cleanRNC)) {
    return {
      isValid: false,
      message: 'El RNC debe tener 9 dígitos',
      type: 'rnc'
    };
  }

  // Algoritmo de validación de RNC dominicano
  const digits = cleanRNC.split('').map(Number);
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }
  
  const remainder = sum % 11;
  let checkDigit = 0;
  
  if (remainder > 1) {
    checkDigit = 11 - remainder;
  }
  
  if (checkDigit !== digits[8]) {
    return {
      isValid: false,
      message: 'Número de RNC inválido',
      type: 'rnc'
    };
  }

  return {
    isValid: true,
    message: 'RNC válido',
    type: 'rnc'
  };
};

// Función general para validar cédula o RNC
export const validateClientId = (clientId: string): ValidationResult => {
  if (!clientId || clientId.trim() === '') {
    return {
      isValid: true,
      message: 'Campo opcional',
    };
  }

  const cleanId = clientId.replace(/[-\s]/g, '');
  
  // Si tiene 11 dígitos, es cédula
  if (cleanId.length === 11) {
    return validateCedula(clientId);
  }
  
  // Si tiene 9 dígitos, es RNC
  if (cleanId.length === 9) {
    return validateRNC(clientId);
  }
  
  // Si no coincide con ningún formato
  return {
    isValid: false,
    message: 'Debe ser una cédula (11 dígitos) o RNC (9 dígitos)',
  };
};

// Formatear cédula con guiones
export const formatCedula = (cedula: string): string => {
  const clean = cedula.replace(/[-\s]/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
  }
  return cedula;
};

// Formatear RNC con guiones
export const formatRNC = (rnc: string): string => {
  const clean = rnc.replace(/[-\s]/g, '');
  if (clean.length === 9) {
    if (clean.startsWith('1') || clean.startsWith('4')) {
      return `${clean.slice(0, 1)}-${clean.slice(1, 3)}-${clean.slice(3, 8)}-${clean.slice(8)}`;
    } else {
      return `${clean.slice(0, 3)}-${clean.slice(3, 8)}-${clean.slice(8)}`;
    }
  }
  return rnc;
};

// Auto-formatear según el tipo detectado
export const autoFormatClientId = (clientId: string): string => {
  const clean = clientId.replace(/[-\s]/g, '');
  
  if (clean.length === 11) {
    return formatCedula(clientId);
  } else if (clean.length === 9) {
    return formatRNC(clientId);
  }
  
  return clientId;
};

// Validar número de teléfono dominicano
export const validateDominicanPhone = (phone: string): ValidationResult => {
  // Remover espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remover código de país si existe
  const phoneNumber = cleanPhone.replace(/^\+1/, '');
  
  // Verificar que tenga 10 dígitos y comience con 809, 829 o 849
  if (!/^(809|829|849)\d{7}$/.test(phoneNumber)) {
    return {
      isValid: false,
      message: 'Número debe comenzar con 809, 829 o 849 y tener 10 dígitos',
    };
  }

  return {
    isValid: true,
    message: 'Número de teléfono válido',
  };
};