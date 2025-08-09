import { describe, it, expect } from 'vitest';
import { computeTotals, ITBIS_RATE, round2 } from './totals';

describe('computeTotals - ITBIS 18%', () => {
  it('A) Solo gravado, sin descuentos', () => {
    const invoice = {
      services: [{ concept: 'Item', quantity: '1', unitPrice: '500', isExempt: false }],
    };
    const t = computeTotals(invoice);
    expect(t.subtotal).toBe(500);
    expect(t.itbis).toBe(90);
    expect(t.total).toBe(590);
  });

  it('B) Mixto gravado+exento, 10% descuento global', () => {
    const invoice = {
      services: [
        { concept: 'G', quantity: '1', unitPrice: '100', isExempt: false },
        { concept: 'E', quantity: '1', unitPrice: '50', isExempt: true },
      ],
      globalDiscountPct: 10,
    };
    const t = computeTotals(invoice);
    expect(t.taxableBase).toBe(90);
    expect(t.exemptBase).toBe(45);
    expect(t.itbis).toBe(16.2);
    expect(t.total).toBe(151.2);
  });

  it('C) Nota de crédito (mismo A pero NC)', () => {
    const invoice = {
      services: [{ concept: 'Item', quantity: '1', unitPrice: '500', isExempt: false }],
      invoiceType: 'nota-credito',
    };
    const t = computeTotals(invoice);
    expect(t.subtotal).toBe(-500);
    expect(t.itbis).toBe(-90);
    expect(t.total).toBe(-590);
  });

  it('Ejemplo simple RD$1,000 → ITBIS 180, Total 1,180', () => {
    const invoice = { services: [{ concept: 'X', quantity: '1', unitPrice: '1000', isExempt: false }] };
    const t = computeTotals(invoice);
    expect(t.subtotal).toBe(1000);
    expect(t.itbis).toBe(180);
    expect(t.total).toBe(1180);
  });
});