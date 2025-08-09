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
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackRoute, { replace: true });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      aria-label="Volver"
      className={`p-2 rounded-full transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5 text-muted-foreground" />
    </Button>
  );
}