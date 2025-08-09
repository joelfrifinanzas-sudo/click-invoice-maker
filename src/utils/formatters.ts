export function formatMoneyDOP(value: number): string {
  if (isNaN(value)) return 'RD$ 0.00';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateEs(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Default: dd MMM yyyy (es-DO)
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  try {
    return new Intl.DateTimeFormat('es-DO', defaultOptions).format(d);
  } catch {
    return '';
  }
}
