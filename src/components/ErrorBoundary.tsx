import React from 'react';
import { logError } from '@/utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    logError('error_boundary', { componentStack: errorInfo?.componentStack?.slice(0, 500) }, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-xl border bg-background text-foreground text-center shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Ha ocurrido un error</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Algo salió mal al renderizar esta vista. Puedes intentar regresar e intentarlo de nuevo.
            </p>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground" onClick={() => this.setState({ hasError: false })}>
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
