import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';
export type Currency = 'DOP' | 'USD';

interface AppConfig {
  language: Language;
  currency: Currency;
  whatsappEnabled: boolean;
  defaultPhone: string;
  autoMessage: string;
  homeV2Enabled?: boolean; // Feature flag: HomeScreenV2
}

interface AppConfigContextType {
  config: AppConfig;
  updateLanguage: (language: Language) => void;
  updateCurrency: (currency: Currency) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}

const defaultConfig: AppConfig = {
  language: 'es',
  currency: 'DOP',
  whatsappEnabled: false,
  defaultPhone: '',
  autoMessage: 'Adjunto encontrarás tu factura. ¡Gracias por tu preferencia!',
  homeV2Enabled: false,
};

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};

interface AppConfigProviderProps {
  children: ReactNode;
}

export const AppConfigProvider = ({ children }: AppConfigProviderProps) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  useEffect(() => {
    const savedConfig = localStorage.getItem('app-config');
    if (savedConfig) {
      setConfig({ ...defaultConfig, ...JSON.parse(savedConfig) });
    }
  }, []);

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('app-config', JSON.stringify(newConfig));
  };

  const updateLanguage = (language: Language) => {
    saveConfig({ ...config, language });
  };

  const updateCurrency = (currency: Currency) => {
    saveConfig({ ...config, currency });
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    saveConfig({ ...config, ...updates });
  };

  const translations = {
    es: {
      // Navigation
      'nav.planPro': 'Plan Pro',
      'nav.contacts': 'Contactos',
      'nav.companyProfile': 'Perfiles de la empresa',
      'nav.configuration': 'Configuración',
      'nav.profile': 'Perfil',
      'nav.history': 'Historial',
      
      // Common
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.add': 'Agregar',
      'common.search': 'Buscar',
      'common.actions': 'Acciones',
      'common.name': 'Nombre',
      'common.email': 'Correo',
      'common.phone': 'Teléfono',
      'common.address': 'Dirección',
      
      // Configuration
      'config.title': 'Configuración',
      'config.whatsapp': 'WhatsApp',
      'config.whatsapp.description': 'Configura el envío automático de facturas por WhatsApp',
      'config.whatsapp.enable': 'Activar WhatsApp',
      'config.whatsapp.enable.description': 'Permite enviar facturas por WhatsApp',
      'config.defaultPhone': 'Número predeterminado',
      'config.autoMessage': 'Mensaje automático',
      'config.system': 'Sistema',
      'config.system.description': 'Configuraciones generales del sistema',
      'config.language': 'Idioma',
      'config.currency': 'Moneda',
      'config.saved': 'Configuración guardada',
      'config.saved.description': 'Los cambios se han aplicado correctamente.',
      'config.appearance': 'Apariencia',
      'config.appearance.description': 'Personaliza la apariencia de la aplicación',
      'config.homeV2': 'Inicio Home V2',
      'config.homeV2.description': 'Usar la nueva pantalla de inicio con acceso rápido y resúmenes',
      
      // Languages
      'language.es': 'Español',
      'language.en': 'English',
      
      // Currencies
      'currency.DOP': 'Pesos Dominicanos (DOP)',
      'currency.USD': 'Dólares (USD)',
      
      // Invoice Generator
      'invoice.title': 'Generador de Facturas Profesionales',
      'invoice.subtitle': 'Crea facturas profesionales de manera rápida y sencilla',
      'invoice.generate': 'Generar Factura',
      'invoice.clientInfo': 'Información del Cliente',
      'invoice.clientName': 'Nombre del Cliente',
      'invoice.clientRnc': 'RNC/Cédula',
      'invoice.clientEmail': 'Email del Cliente',
      'invoice.clientPhone': 'Teléfono del Cliente',
      'invoice.clientAddress': 'Dirección del Cliente',
      'invoice.serviceInfo': 'Información del Servicio',
      'invoice.serviceDescription': 'Descripción del Servicio',
      'invoice.quantity': 'Cantidad',
      'invoice.unitPrice': 'Precio Unitario',
      'invoice.addService': 'Agregar Servicio',
      'invoice.subtotal': 'Subtotal',
      'invoice.itbis': 'ITBIS (18%)',
      'invoice.total': 'Total',
      
      // Profile
      'profile.title': 'Perfil de Usuario',
      'profile.personalInfo': 'Información Personal',
      'profile.security': 'Seguridad',
      'profile.role': 'Rol',
      'profile.changePassword': 'Cambiar Contraseña',
      'profile.logout': 'Cerrar Sesión',
      'profile.uploadPhoto': 'Subir Foto de Perfil',
      
      // Plan Pro
      'planPro.title': 'Plan Pro',
      'planPro.subtitle': 'Desbloquea todas las funciones premium',
      'planPro.monthly': 'Mensual',
      'planPro.annual': 'Anual',
      'planPro.features': 'Características',
      'planPro.feature.pdf': 'Exportar PDF ilimitado',
      'planPro.feature.whatsapp': 'Envío por WhatsApp',
      'planPro.feature.multiuser': 'Acceso multiusuario',
      'planPro.feature.support': 'Soporte prioritario',
      'planPro.subscribe': 'Suscribirse',
      
      // Contacts
      'contacts.title': 'Contactos',
      'contacts.addNew': 'Agregar Nuevo Contacto',
      'contacts.rnc': 'RNC/Cédula',
      'contacts.noContacts': 'No hay contactos registrados',
      
      // Company Profile
      'company.title': 'Perfiles de la empresa',
      'company.info': 'Información de la Empresa',
      'company.tradeName': 'Nombre Comercial',
      'company.rnc': 'RNC',
      'company.logo': 'Logo de la Empresa',
      'company.whatsapp': 'WhatsApp de Contacto'
    },
    en: {
      // Navigation
      'nav.planPro': 'Pro Plan',
      'nav.contacts': 'Contacts',
      'nav.companyProfile': 'Company Profiles',
      'nav.configuration': 'Configuration',
      'nav.profile': 'Profile',
      'nav.history': 'History',
      
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.actions': 'Actions',
      'common.name': 'Name',
      'common.email': 'Email',
      'common.phone': 'Phone',
      'common.address': 'Address',
      
      // Configuration
      'config.title': 'Configuration',
      'config.whatsapp': 'WhatsApp',
      'config.whatsapp.description': 'Configure automatic invoice sending via WhatsApp',
      'config.whatsapp.enable': 'Enable WhatsApp',
      'config.whatsapp.enable.description': 'Allow sending invoices via WhatsApp',
      'config.defaultPhone': 'Default Phone Number',
      'config.autoMessage': 'Auto Message',
      'config.system': 'System',
      'config.system.description': 'General system settings',
      'config.language': 'Language',
      'config.currency': 'Currency',
      'config.saved': 'Configuration saved',
      'config.saved.description': 'Changes have been applied successfully.',
      'config.appearance': 'Appearance',
      'config.appearance.description': 'Customize the app appearance',
      'config.homeV2': 'Home V2',
      'config.homeV2.description': 'Use the new home screen with quick access and summaries',
      
      // Languages
      'language.es': 'Español',
      'language.en': 'English',
      
      // Currencies
      'currency.DOP': 'Dominican Pesos (DOP)',
      'currency.USD': 'US Dollars (USD)',
      
      // Invoice Generator
      'invoice.title': 'Professional Invoice Generator',
      'invoice.subtitle': 'Create professional invoices quickly and easily',
      'invoice.generate': 'Generate Invoice',
      'invoice.clientInfo': 'Client Information',
      'invoice.clientName': 'Client Name',
      'invoice.clientRnc': 'RNC/ID',
      'invoice.clientEmail': 'Client Email',
      'invoice.clientPhone': 'Client Phone',
      'invoice.clientAddress': 'Client Address',
      'invoice.serviceInfo': 'Service Information',
      'invoice.serviceDescription': 'Service Description',
      'invoice.quantity': 'Quantity',
      'invoice.unitPrice': 'Unit Price',
      'invoice.addService': 'Add Service',
      'invoice.subtotal': 'Subtotal',
      'invoice.itbis': 'ITBIS (18%)',
      'invoice.total': 'Total',
      
      // Profile
      'profile.title': 'User Profile',
      'profile.personalInfo': 'Personal Information',
      'profile.security': 'Security',
      'profile.role': 'Role',
      'profile.changePassword': 'Change Password',
      'profile.logout': 'Logout',
      'profile.uploadPhoto': 'Upload Profile Photo',
      
      // Plan Pro
      'planPro.title': 'Pro Plan',
      'planPro.subtitle': 'Unlock all premium features',
      'planPro.monthly': 'Monthly',
      'planPro.annual': 'Annual',
      'planPro.features': 'Features',
      'planPro.feature.pdf': 'Unlimited PDF export',
      'planPro.feature.whatsapp': 'WhatsApp sending',
      'planPro.feature.multiuser': 'Multi-user access',
      'planPro.feature.support': 'Priority support',
      'planPro.subscribe': 'Subscribe',
      
      // Contacts
      'contacts.title': 'Contacts',
      'contacts.addNew': 'Add New Contact',
      'contacts.rnc': 'RNC/ID',
      'contacts.noContacts': 'No contacts registered',
      
      // Company Profile
      'company.title': 'Company Profiles',
      'company.info': 'Company Information',
      'company.tradeName': 'Trade Name',
      'company.rnc': 'RNC',
      'company.logo': 'Company Logo',
      'company.whatsapp': 'Contact WhatsApp'
    }
  };

  const t = (key: string): string => {
    return translations[config.language][key] || key;
  };

  const formatCurrency = (amount: number): string => {
    const symbol = config.currency === 'DOP' ? 'RD$' : 'US$';
    return `${symbol} ${amount.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <AppConfigContext.Provider value={{
      config,
      updateLanguage,
      updateCurrency,
      updateConfig,
      t,
      formatCurrency
    }}>
      {children}
    </AppConfigContext.Provider>
  );
};