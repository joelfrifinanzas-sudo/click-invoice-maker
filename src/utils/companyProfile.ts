import { CompanyProfile, defaultCompanyProfile } from '@/types/company';

const COMPANY_PROFILE_KEY = 'company-profile';

export const saveCompanyProfile = (profile: CompanyProfile): void => {
  localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));
};

export const getCompanyProfile = (): CompanyProfile => {
  const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
  if (stored) {
    try {
      return { ...defaultCompanyProfile, ...JSON.parse(stored) };
    } catch (error) {
      console.error('Error parsing company profile:', error);
    }
  }
  return defaultCompanyProfile;
};

export const clearCompanyProfile = (): void => {
  localStorage.removeItem(COMPANY_PROFILE_KEY);
};