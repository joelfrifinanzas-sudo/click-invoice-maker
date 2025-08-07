import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Package, 
  ClipboardList, 
  CreditCard, 
  History, 
  Archive, 
  Wallet,
  Search,
  QrCode,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/Layout';


const Index = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Nueva Factura",
      icon: FileText,
      path: "/crear-factura",
      color: "bg-blue-500",
      description: "Genera facturas rápidamente"
    },
    {
      title: "Clientes", 
      icon: Users,
      path: "/clientes",
      color: "bg-green-500",
      description: "Gestiona tu base de clientes"
    },
    {
      title: "Productos",
      icon: Package, 
      path: "/articulos",
      color: "bg-purple-500",
      description: "Catálogo de productos"
    },
    {
      title: "Cotizaciones",
      icon: ClipboardList,
      path: "/cotizaciones", 
      color: "bg-orange-500",
      description: "Crea y gestiona cotizaciones"
    },
    {
      title: "Créditos",
      icon: CreditCard,
      path: "/creditos",
      color: "bg-red-500", 
      description: "Facturas a crédito"
    },
    {
      title: "Historial",
      icon: History,
      path: "/historial",
      color: "bg-indigo-500",
      description: "Historial de facturas"
    },
    {
      title: "Inventario", 
      icon: Archive,
      path: "/inventario",
      color: "bg-teal-500",
      description: "Control de inventario"
    },
    {
      title: "Pagos",
      icon: Wallet,
      path: "/pagos",
      color: "bg-pink-500", 
      description: "Registra pagos recibidos"
    }
  ];

  const shortcuts = [
    "Tip: Usa el escáner QR para importar datos rápidamente",
    "Recuerda: Las facturas se guardan automáticamente en el historial", 
    "¿Sabías? Puedes exportar facturas directamente a WhatsApp"
  ];

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h1 className="text-xl font-bold text-gray-900">FacturaClick</h1>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar cliente, factura o..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <QrCode className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6">
          {/* Modules Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {modules.map((module, index) => (
              <button
                key={index}
                onClick={() => navigate(module.path)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-12 h-12 ${module.color} rounded-full flex items-center justify-center`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Access Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos directos</h2>
            <div className="space-y-3">
              {shortcuts.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-500">Facturas hoy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-gray-500">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs text-gray-500">Productos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;