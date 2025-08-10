import { BackButton } from '@/components/BackButton';

interface ModuleHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  className?: string;
}

export function ModuleHeader({ 
  title, 
  description, 
  showBackButton = false, 
  className = '' 
}: ModuleHeaderProps) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {showBackButton && <BackButton className="mt-1" />}
      <div className="flex-1">
        <h1 className="text-responsive-xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}