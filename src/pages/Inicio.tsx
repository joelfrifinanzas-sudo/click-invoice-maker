import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
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
  Mic,
  QrCode,
  MoreHorizontal,
  Star
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { HomeScreenV2 } from '@/components/home/HomeScreenV2';

export default function Inicio() {
  const navigate = useNavigate();
  const { markDashboardNavigation } = useNavigation();
  const { config } = useAppConfig();

  if (config.homeV2Enabled) {
    return (
      <Layout>
        <HomeScreenV2 />
      </Layout>
    );
  }

  const modules = [
    {
      title: "Nueva factura",
      icon: FileText,
      path: "/crear-factura",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Clientes", 
      icon: Users,
      path: "/clientes",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Productos",
      icon: Star, 
      path: "/articulos",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Cotizaciones",
      icon: ClipboardList,
      path: "/cotizaciones", 
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Créditos",
      icon: Archive,
      path: "/creditos",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Historial",
      icon: History,
      path: "/historial",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Inventario", 
      icon: Package,
      path: "/inventario",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    },
    {
      title: "Pagos",
      icon: Wallet,
      path: "/pagos",
      iconColor: "text-blue-700",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-6">
          {/* Logo */}
          
          {/* Search Bar */}
          <div className="relative">
            <div className="bg-gray-100 rounded-full px-4 py-3 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, factura o..."
                className="flex-1 bg-transparent border-0 outline-none text-gray-700 placeholder-gray-500"
              />
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Mic className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <QrCode className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4">
          {/* Modules Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {modules.map((module, index) => (
              <button
                key={index}
                onClick={() => {
                  markDashboardNavigation();
                  navigate(module.path);
                }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-16 h-16 ${module.bgColor} rounded-2xl flex items-center justify-center`}>
                  <module.icon className={`w-8 h-8 ${module.iconColor}`} />
                </div>
                <span className="font-medium text-gray-900 text-sm leading-tight">
                  {module.title}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Access Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Accesos directos</h2>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Tips para usar la plataforma
                </h3>
                <p className="text-sm text-gray-600">
                  Nuevo al crear facturas
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="text-2xl">👨🏽‍💼</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}