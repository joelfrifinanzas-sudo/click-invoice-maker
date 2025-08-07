import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, Edit, Trash2, ArrowLeft } from "lucide-react";

interface Articulo {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
}

export default function Articulos() {
  useScrollToTop();
  
  const [articulos, setArticulos] = useState<Articulo[]>([
    { id: 1, nombre: "Consultoría", precio: 100.00, categoria: "Servicio", stock: 999 },
    { id: 2, nombre: "Desarrollo Web", precio: 500.00, categoria: "Servicio", stock: 999 },
    { id: 3, nombre: "Producto A", precio: 25.50, categoria: "Producto", stock: 50 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [nuevoArticulo, setNuevoArticulo] = useState({
    nombre: "",
    precio: "",
    categoria: "",
    stock: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const articulo: Articulo = {
      id: Date.now(),
      nombre: nuevoArticulo.nombre,
      precio: parseFloat(nuevoArticulo.precio),
      categoria: nuevoArticulo.categoria,
      stock: parseInt(nuevoArticulo.stock),
    };
    setArticulos([...articulos, articulo]);
    setNuevoArticulo({ nombre: "", precio: "", categoria: "", stock: "" });
    setShowForm(false);
  };

  const eliminarArticulo = (id: number) => {
    setArticulos(articulos.filter(a => a.id !== id));
  };

  return (
    <div className="container mx-auto p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Artículos
            </h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agregar Nuevo Artículo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nuevoArticulo.nombre}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, nombre: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={nuevoArticulo.precio}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, precio: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Input
                    id="categoria"
                    value={nuevoArticulo.categoria}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, categoria: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={nuevoArticulo.stock}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, stock: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                  <Button type="submit">Guardar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articulos.map((articulo) => (
            <Card key={articulo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{articulo.nombre}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => eliminarArticulo(articulo.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-medium">${articulo.precio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoría:</span>
                    <span>{articulo.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className={articulo.stock > 10 ? "text-green-600" : "text-orange-600"}>
                      {articulo.stock}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}