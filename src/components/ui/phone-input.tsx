import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'DO', name: 'República Dominicana', prefix: '+1', flag: '🇩🇴' },
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput = ({ value, onChange, placeholder, className }: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // RD por defecto
  
  // Extraer el número sin prefijo
  const phoneNumber = value.replace(selectedCountry.prefix + ' ', '');
  
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      // Actualizar el valor con el nuevo prefijo
      onChange(`${country.prefix} ${phoneNumber}`);
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    onChange(`${selectedCountry.prefix} ${newNumber}`);
  };
  
  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.prefix}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{country.prefix}</span>
                  <span className="text-xs text-muted-foreground">{country.name}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder || "809-123-4567"}
        className="flex-1"
      />
    </div>
  );
};