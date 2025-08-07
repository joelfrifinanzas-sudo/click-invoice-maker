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
    // Try to go back in history first
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to specified route if no history
      navigate(fallbackRoute);
    }
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