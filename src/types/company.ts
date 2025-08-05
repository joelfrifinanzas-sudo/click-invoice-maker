export interface CompanyProfile {
  businessName: string;
  signatureName: string;
  businessRnc: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  logo: string | null;
  invoicePrefix: string;
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
};