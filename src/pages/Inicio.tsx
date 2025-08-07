export default function Inicio() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Inicio
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Bienvenido al Sistema de Facturación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Facturas Recientes</h3>
              <p className="text-blue-700 text-sm">Gestiona tus facturas más recientes</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Clientes Activos</h3>
              <p className="text-green-700 text-sm">Administra tu base de clientes</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Inventario</h3>
              <p className="text-purple-700 text-sm">Controla tus productos y servicios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}