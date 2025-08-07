import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CrearFactura() {
  const [cliente, setCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para crear la factura
    console.log("Nueva factura:", { cliente, descripcion, cantidad, precio });
  };

  return (
    <div className="container mx-auto p-6 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Crear Nueva Factura
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                type="text"
                placeholder="Nombre del cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del Servicio/Producto</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe el producto o servicio facturado"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  placeholder="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio Unitario</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Crear Factura
              </Button>
              <Button type="button" variant="outline" className="flex-1">
                Guardar Borrador
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}