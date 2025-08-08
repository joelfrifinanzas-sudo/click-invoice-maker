export function maskAccountNumber(val: string | null | undefined): string {
  if (!val) return '';
  const digits = String(val).replace(/\s+/g, '');
  if (!digits) return '';
  const last4 = digits.slice(-4);
  return `•••• ${last4}`;
}
