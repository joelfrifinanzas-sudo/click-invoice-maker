import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  fallbackRoute?: string;
  label?: string;
}

export function BackButton({ className = '', fallbackRoute = '/inicio', label = 'Volver' }: BackButtonProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackRoute, { replace: true });
    }
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goBack();
    }
  };

  return (
    <button
      type="button"
      role="button"
      aria-label="Volver a la página anterior"
      onClick={goBack}
      onKeyDown={onKeyDown}
      className={`inline-flex items-center gap-1 px-2 py-1 min-h-11 text-[hsl(var(--back-button,186_100%_33%))] font-medium text-base hover:underline cursor-pointer select-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <span aria-hidden="true" className="text-[18px] leading-none">‹</span>
      <span>{label}</span>
    </button>
  );
}
