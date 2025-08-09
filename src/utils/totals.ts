// Centralized ITBIS and totals computation
// Pure, side-effect free. Keeps existing field names and adapts to common aliases.

export const ITBIS_RATE = 0.18; // Single source of truth

// Round half-up to 2 decimals (DOP currency)
export function round2(n: number): number {
  const sign = n < 0 ? -1 : 1;
  const abs = Math.abs(n);
  return sign * Math.round(abs * 100 + 1e-8) / 100;
}

// Helper to safely parse numbers from strings or numbers
function num(v: any, def = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : def;
  return Number.isFinite(n) ? n : def;
}

// Compute line net given typical fields
function computeLineNet(line: any): number {
  const qty = Math.max(0, num(line.qty ?? line.quantity, 1));
  const unitPrice = Math.max(0, num(line.unitPrice ?? line.price ?? line.amount, 0));
  const gross = qty * unitPrice;
  const discAbs = Math.max(0, num(line.lineDiscountAbs ?? line.discountAbs, 0));
  const discPct = Math.max(0, num(line.lineDiscountPct ?? line.discountPct, 0));
  const pctAmount = gross * (discPct / 100);
  const net = gross - discAbs - pctAmount;
  return Math.max(0, net);
}

export type TotalsResult = {
  taxableNet: number;
  exemptNet: number;
  taxableBase: number;
  exemptBase: number;
  subtotal: number;
  itbis: number;
  total: number;
};

export function computeTotals(invoice: any): TotalsResult {
  const lines: any[] = Array.isArray(invoice?.items)
    ? invoice.items
    : Array.isArray(invoice?.services)
    ? invoice.services
    : [];

  // Build enriched lines
  const enriched = lines.map((line) => {
    const lineNet = computeLineNet(line);
    const isExempt = Boolean(line.isExempt ?? line.exento ?? false);
    const customRateRaw = line.itbisRate ?? line.vatRate ?? null;
    const hasCustomRate = customRateRaw !== null && customRateRaw !== undefined && customRateRaw !== '';
    const itbisRate = hasCustomRate ? Math.max(0, num(customRateRaw, 0)) : undefined;
    const effectiveRate = isExempt ? 0 : (itbisRate !== undefined ? itbisRate : ITBIS_RATE);
    return { lineNet, isExempt, itbisRate, effectiveRate };
  });

  const taxableNet = enriched
    .filter((l) => !l.isExempt && l.effectiveRate > 0)
    .reduce((s, l) => s + l.lineNet, 0);
  const exemptNet = enriched
    .filter((l) => l.isExempt || l.effectiveRate === 0)
    .reduce((s, l) => s + l.lineNet, 0);

  // Global discounts (apply BEFORE tax, proportionally)
  const gAbs = Math.max(0, num(invoice.globalDiscountAbs ?? invoice.discountAbs, 0));
  const gPct = Math.max(0, num(invoice.globalDiscountPct ?? invoice.discountPct, 0));
  const totalNet = taxableNet + exemptNet;
  const discountAmount = gAbs + (gPct / 100) * totalNet;
  const ratioDen = totalNet > 0 ? totalNet : 1;
  const taxableBaseRaw = Math.max(0, taxableNet - discountAmount * (taxableNet / ratioDen));
  const exemptBaseRaw = Math.max(0, exemptNet - discountAmount * (exemptNet / ratioDen));

  // ITBIS calculation
  const hasAnyCustomRate = enriched.some((l) => l.itbisRate !== undefined);
  let itbis = 0;
  if (hasAnyCustomRate) {
    // Allocate global discount proportionally to each line
    const linesTotalNet = enriched.reduce((s, l) => s + l.lineNet, 0);
    const perLine = enriched.map((l) => {
      const share = linesTotalNet > 0 ? (l.lineNet / linesTotalNet) * discountAmount : 0;
      const lineBase = Math.max(0, l.lineNet - share);
      const rate = l.effectiveRate;
      const tax = rate > 0 ? round2(lineBase * rate) : 0;
      return tax;
    });
    itbis = perLine.reduce((s, v) => s + v, 0);
  } else {
    itbis = round2(taxableBaseRaw * ITBIS_RATE);
  }

  // Other charges/credits
  const shipping = num(invoice.shipping ?? invoice.envio, 0);
  const otherCharges = num(invoice.otherCharges ?? invoice.otrosCargos, 0);
  const earlyPayments = num(invoice.earlyPayments ?? invoice.pagosAnticipados, 0);
  const credits = num(invoice.credits ?? invoice.creditos, 0);
  const retentions = num(invoice.retentions ?? invoice.retenciones, 0);

  const taxableBase = round2(taxableBaseRaw);
  const exemptBase = round2(exemptBaseRaw);
  const subtotal = round2(taxableBase + exemptBase);

  let total = round2(subtotal + itbis + shipping + otherCharges - earlyPayments - credits - retentions);

  // Credit Notes: invert signs
  const isCreditNote = Boolean(
    invoice?.isCreditNote === true ||
      invoice?.documentType === 'NC' ||
      invoice?.invoiceType === 'nota-credito' ||
      invoice?.ncfType === 'B04'
  );
  if (isCreditNote) {
    return {
      taxableNet: round2(-taxableNet),
      exemptNet: round2(-exemptNet),
      taxableBase: round2(-taxableBase),
      exemptBase: round2(-exemptBase),
      subtotal: round2(-subtotal),
      itbis: round2(-itbis),
      total: round2(-total),
    };
  }

  return { taxableNet: round2(taxableNet), exemptNet: round2(exemptNet), taxableBase, exemptBase, subtotal, itbis, total };
}
