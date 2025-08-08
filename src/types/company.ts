export interface CompanyProfile {
  businessName: string;
  signatureName: string;
  businessRnc: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  logo: string | null;
  invoicePrefix: string;
  // Nuevos campos
  slogan?: string;
  website?: string;
  currency?: string; // p.ej. DOP
  primaryColor?: string; // HSL o HEX
}

export const defaultCompanyProfile: CompanyProfile = {
  businessName: '',
  signatureName: '',
  businessRnc: '',
  businessPhone: '',
  businessEmail: '',
  businessAddress: '',
  logo: null,
  invoicePrefix: 'FAC',
  slogan: '',
  website: '',
  currency: 'DOP',
  primaryColor: '',
};