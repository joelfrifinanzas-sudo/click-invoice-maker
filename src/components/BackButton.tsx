import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  className?: string;
  fallbackRoute?: string;
}

export function BackButton({ className = '', fallbackRoute = '/inicio' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5 text-gray-600" />
    </Button>
  );
}