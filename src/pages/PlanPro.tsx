import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, FileText, MessageCircle, Users, Zap } from 'lucide-react';

const PlanPro = () => {
  const plans = [
    {
      name: 'Básico',
      price: 'Gratis',
      period: '',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 10 facturas por mes',
        'Exportar a PDF',
        'Numeración NCF automática',
        'Soporte básico por email'
      ],
      current: true,
      buttonText: 'Plan Actual',
      buttonVariant: 'secondary' as const
    },
    {
      name: 'Pro Mensual',
      price: '$19',
      period: '/mes',
      description: 'Para negocios en crecimiento',
      features: [
        'Facturas ilimitadas',
        'Envío por WhatsApp',
        'Múltiples perfiles de empresa',
        'Gestión de contactos',
        'Soporte prioritario',
        'Reportes avanzados'
      ],
      popular: true,
      buttonText: 'Comenzar Prueba',
      buttonVariant: 'default' as const
    },
    {
      name: 'Pro Anual',
      price: '$190',
      period: '/año',
      description: 'Mejor valor, 2 meses gratis',
      features: [
        'Todo lo del plan mensual',
        '2 meses gratis',
        'Acceso multiusuario',
        'API de integración',
        'Backup automático',
        'Soporte 24/7'
      ],
      badge: 'Ahorra 17%',
      buttonText: 'Comenzar Prueba',
      buttonVariant: 'default' as const
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Planes y Precios
              </h1>
              <p className="text-xl text-muted-foreground">
                Elige el plan que mejor se adapte a tu negocio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <Crown className="w-4 h-4 mr-1" />
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  
                  {plan.badge && (
                    <div className="absolute -top-4 right-4">
                      <Badge variant="destructive">{plan.badge}</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full" 
                      variant={plan.buttonVariant}
                      disabled={plan.current}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Benefits Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-12">
                ¿Por qué elegir Factura 1Click Pro?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">WhatsApp Integrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Envía facturas directamente por WhatsApp con un solo clic
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Facturas Ilimitadas</h3>
                  <p className="text-muted-foreground text-sm">
                    Crea todas las facturas que necesites sin restricciones
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Multi-usuario</h3>
                  <p className="text-muted-foreground text-sm">
                    Permite que tu equipo acceda y gestione facturas
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Soporte Premium</h3>
                  <p className="text-muted-foreground text-sm">
                    Obtén ayuda prioritaria cuando la necesites
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlanPro;