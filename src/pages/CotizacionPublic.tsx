import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCotizacionByPublicId, markCotizacionViewed, acceptCotizacionPublic, rejectCotizacionPublic } from "@/data/cotizaciones";
import { generateQuotePDFBlob } from "@/utils/quotePdf";
import { getCompanyProfile } from "@/utils/companyProfile";

export default function CotizacionPublic() {
  const { publicId } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!publicId) return;
      const { data, error } = await getCotizacionByPublicId(publicId);
      if (!mounted) return;
      if (error || !data) {
        setErr(error ?? "No encontrada");
      } else {
        setData(data);
        // Mark as viewed (enviada -> vista)
        await markCotizacionViewed(publicId);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [publicId]);
  

  const totals = useMemo(() => {
    if (!data) return { neto: 0, itbis: 0, descuento: 0, total: 0 };
    const neto = (data.items || []).reduce((acc: number, it: any) => acc + Number(it.subtotal || 0), 0);
    const itbis = neto * Number(data.itbis_rate || 0);
    let descuento = 0;
    if (data.tipo_descuento === 'percent') descuento = neto * (Number(data.valor_descuento || 0) / 100);
    if (data.tipo_descuento === 'amount') descuento = Number(data.valor_descuento || 0);
    const total = neto + itbis - descuento;
    return { neto, itbis, descuento, total };
  }, [data]);
  useEffect(() => {
    (async () => {
      if (!data) return;
      try {
        const profile = getCompanyProfile();
        const blob = await generateQuotePDFBlob({
          company: { name: profile.businessName || "" },
          cliente: { nombre: "Cliente" },
          cotizacion: { number: data.number, fecha: data.fecha, vence_el: data.vence_el, moneda: data.moneda, itbis_rate: Number(data.itbis_rate || 0.18), notas: data.notas, terminos: data.terminos },
          items: (data.items || []).map((it: any) => ({ nombre: it.nombre, qty: Number(it.qty || 0), precio_unitario: Number(it.precio_unitario || 0), itbis_rate: Number(it.itbis_rate || 0.18), subtotal: Number(it.subtotal || 0) })),
          totales: totals,
        });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch {}
    })();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [data, totals]);

  const onAccept = async () => {
    if (!publicId) return;
    await acceptCotizacionPublic(publicId);
    setData((d: any) => d ? { ...d, estado: 'aceptada' } : d);
  };

  const onReject = async () => {
    if (!publicId) return;
    const motivo = window.prompt('Motivo del rechazo');
    if (!motivo) return;
    await rejectCotizacionPublic(publicId, motivo);
    setData((d: any) => d ? { ...d, estado: 'rechazada', rechazo_motivo: motivo } : d);
  };


  const downloadPdf = async () => {
    if (!data) return;
    const profile = getCompanyProfile();
    const blob = await generateQuotePDFBlob({
      company: { name: profile.businessName || "", rnc: profile.businessRnc || undefined, phone: profile.businessPhone || undefined, email: profile.businessEmail || undefined, address: profile.businessAddress || undefined, logoUrl: profile.logo },
      cliente: { nombre: data.customer_name || "Cliente", rnc: data.customer_rnc || undefined, phone: data.customer_phone || undefined, email: data.customer_email || undefined, address: data.customer_address || undefined },
      cotizacion: { number: data.number, fecha: data.fecha, vence_el: data.vence_el, moneda: data.moneda, itbis_rate: Number(data.itbis_rate || 0.18), notas: data.notas, terminos: data.terminos },
      items: (data.items || []).map((it: any) => ({ nombre: it.nombre, qty: Number(it.qty || 0), precio_unitario: Number(it.precio_unitario || 0), itbis_rate: Number(it.itbis_rate || 0.18), subtotal: Number(it.subtotal || 0) })),
      totales: totals,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion-${data.number || data.public_id}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) return <div className="container-responsive py-8">Cargando...</div>;
  if (err) return <div className="container-responsive py-8">{err}</div>;

  return (
    <div className="container-responsive py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cotización {data?.number ? `#${data.number}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pdfUrl && (
              <object data={pdfUrl} type="application/pdf" width="100%" height="600px">
                <p>No se pudo mostrar el PDF. <button className="underline" onClick={downloadPdf}>Descargar</button></p>
              </object>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Cliente</h3>
                <div className="text-sm">{data?.customer_name || '—'}</div>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Válida hasta</h3>
                <div className="text-sm">{data?.vence_el || '—'}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Descripción</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">P. Unit.</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((it: any) => (
                  <tr key={it.id}>
                    <td>{it.nombre}</td>
                    <td className="text-right">{Number(it.qty).toFixed(2)}</td>
                    <td className="text-right">{formatMoney(Number(it.precio_unitario || 0), data.moneda)}</td>
                    <td className="text-right">{formatMoney(Number(it.subtotal || 0), data.moneda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-end gap-1 text-sm">
            <div>Neto: {formatMoney(totals.neto, data.moneda)}</div>
            <div>ITBIS ({Math.round(Number(data.itbis_rate||0.18)*100)}%): {formatMoney(totals.itbis, data.moneda)}</div>
            {totals.descuento > 0 && <div>Descuento: -{formatMoney(totals.descuento, data.moneda)}</div>}
            <div className="font-medium">Total: {formatMoney(totals.total, data.moneda)}</div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button onClick={downloadPdf}>Descargar PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatMoney(n: number, currency = "DOP") {
  const nf = new Intl.NumberFormat("es-DO", { style: "currency", currency, minimumFractionDigits: 2 });
  return nf.format(n).replace("RD$\u00A0", "RD$").replace("RD$ ", "RD$");
}
