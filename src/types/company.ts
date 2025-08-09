export interface CompanyProfile {
  businessName: string;
  signatureName: string;
  businessRnc: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessCity?: string;
  businessCountry?: string;
  businessPostalCode?: string;
  logo: string | null;
  invoicePrefix: string;
  // Nuevos campos
  slogan?: string;
  website?: string;
  currency?: string; // p.ej. DOP
  primaryColor?: string; // HSL o HEX
  ncfFormat?: string; // Formato DGII (ej. B01-00000000)
}


export const defaultCompanyProfile: CompanyProfile = {
  businessName: '',
  signatureName: '',
  businessRnc: '',
  businessPhone: '',
  businessEmail: '',
  businessAddress: '',
  businessCity: '',
  businessCountry: 'República Dominicana',
  businessPostalCode: '',
  logo: null,
  invoicePrefix: 'FAC',
  slogan: '',
  website: '',
  currency: 'DOP',
  primaryColor: '',
  ncfFormat: '',
};