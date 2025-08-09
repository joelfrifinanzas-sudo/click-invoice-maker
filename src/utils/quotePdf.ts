import jsPDF from "jspdf";


// We don't have jspdf-autotable installed; fallback simple table drawing
// Minimal PDF for Cotización in Spanish (RD)

export interface QuotePdfParams {
  company: { name: string; rnc?: string; phone?: string; email?: string; address?: string; logoUrl?: string | null };
  cliente: { nombre: string; rnc?: string; phone?: string; email?: string; address?: string };
  cotizacion: { number?: string | null; fecha?: string; vence_el?: string | null; moneda?: string; itbis_rate?: number; notas?: string | null; terminos?: string | null };
  items: Array<{ nombre: string; qty: number; precio_unitario: number; itbis_rate?: number; subtotal?: number }>;
  totales: { neto: number; itbis: number; descuento: number; total: number };
}

export async function generateQuotePDFBlob(params: QuotePdfParams): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  // Header
  doc.setFontSize(20);
  doc.text("Cotización", margin, y);
  y += 26;

  const number = params.cotizacion.number ? `#${params.cotizacion.number}` : "";
  doc.setFontSize(11);
  doc.text(`${number}`, margin, y);
  y += 18;

  // Company and Client blocks
  const leftX = margin;
  const rightX = 320;

  doc.setFontSize(12);
  doc.text("Empresa", leftX, y);
  doc.text("Cliente", rightX, y);
  y += 16;

  const wrapText = (text?: string | null) => (text ?? "").toString();

  const companyLines = [
    wrapText(params.company.name),
    params.company.rnc ? `RNC: ${params.company.rnc}` : "",
    params.company.phone ? `Tel: ${params.company.phone}` : "",
    params.company.email ? params.company.email : "",
    params.company.address ? params.company.address : "",
  ].filter(Boolean) as string[];

  const clientLines = [
    wrapText(params.cliente.nombre),
    params.cliente.rnc ? `RNC: ${params.cliente.rnc}` : "",
    params.cliente.phone ? `Tel: ${params.cliente.phone}` : "",
    params.cliente.email ? params.cliente.email : "",
    params.cliente.address ? params.cliente.address : "",
  ].filter(Boolean) as string[];

  const maxLines = Math.max(companyLines.length, clientLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (companyLines[i]) doc.text(companyLines[i], leftX, y + i * 14);
    if (clientLines[i]) doc.text(clientLines[i], rightX, y + i * 14);
  }
  y += maxLines * 14 + 12;

  // Dates and currency
  const itbisPct = Math.round(((params.cotizacion.itbis_rate ?? 0.18) * 100 + Number.EPSILON) * 100) / 100;
  const fecha = params.cotizacion.fecha ? new Date(params.cotizacion.fecha).toLocaleDateString("es-DO") : "";
  const vence = params.cotizacion.vence_el ? new Date(params.cotizacion.vence_el).toLocaleDateString("es-DO") : "";

  doc.text(`Fecha: ${fecha}`, leftX, y);
  doc.text(`Válida hasta: ${vence}`, leftX + 180, y);
  doc.text(`Moneda: ${params.cotizacion.moneda ?? "DOP"}`, rightX, y);
  doc.text(`ITBIS: ${itbisPct}%`, rightX + 160, y);
  y += 20;

  // Items table header
  const headers = ["Descripción", "Cant.", "P. Unit.", "Subtotal"];
  const colX = [leftX, leftX + 300, leftX + 360, leftX + 450];
  doc.setFont(undefined, "bold");
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.setFont(undefined, "normal");
  y += 14;

  // Items rows
  params.items.forEach((it) => {
    const subtotal = (it.qty ?? 0) * (it.precio_unitario ?? 0);
    doc.text(String(it.nombre || "-"), colX[0], y);
    doc.text(String(it.qty ?? 0), colX[1], y, { align: "right" });
    doc.text(formatMoney(it.precio_unitario ?? 0, params.cotizacion.moneda), colX[2], y, { align: "right" });
    doc.text(formatMoney(subtotal, params.cotizacion.moneda), colX[3], y, { align: "right" });
    y += 14;
  });

  y += 6;
  // Totals
  const rightCol = leftX + 450;
  doc.text("Neto:", rightCol - 80, y, { align: "right" });
  doc.text(formatMoney(params.totales.neto, params.cotizacion.moneda), rightCol, y, { align: "right" });
  y += 16;
  doc.text("ITBIS:", rightCol - 80, y, { align: "right" });
  doc.text(formatMoney(params.totales.itbis, params.cotizacion.moneda), rightCol, y, { align: "right" });
  y += 16;
  if ((params.totales.descuento || 0) > 0) {
    doc.text("Descuento:", rightCol - 80, y, { align: "right" });
    doc.text("-" + formatMoney(params.totales.descuento, params.cotizacion.moneda), rightCol, y, { align: "right" });
    y += 16;
  }
  doc.setFont(undefined, "bold");
  doc.text("Total:", rightCol - 80, y, { align: "right" });
  doc.text(formatMoney(params.totales.total, params.cotizacion.moneda), rightCol, y, { align: "right" });
  doc.setFont(undefined, "normal");
  y += 24;

  if (params.cotizacion.notas) {
    doc.text("Notas:", leftX, y);
    y += 14;
    doc.text(String(params.cotizacion.notas), leftX, y);
    y += 20;
  }
  if (params.cotizacion.terminos) {
    doc.text("Términos:", leftX, y);
    y += 14;
    doc.text(String(params.cotizacion.terminos), leftX, y);
  }

  return doc.output("blob");
}

function formatMoney(value: number, currency = "DOP") {
  const nf = new Intl.NumberFormat("es-DO", { style: "currency", currency, minimumFractionDigits: 2 });
  return nf.format(value).replace("RD$\u00A0", "RD$").replace("RD$ ", "RD$");
}
