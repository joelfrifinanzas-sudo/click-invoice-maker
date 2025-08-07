import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Configuracion = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    whatsappEnabled: false,
    defaultPhone: '',
    autoMessage: 'Adjunto encontrarás tu factura. ¡Gracias por tu preferencia!',
    language: 'es',
    currency: 'DOP',
    whatsappBusinessConnected: false
  });

  const handleSave = () => {
    // Aquí se guardaría la configuración en localStorage o backend
    localStorage.setItem('app-config', JSON.stringify(config));
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente.",
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle pt-14">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            
            {/* WhatsApp Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>
                  Configura el envío automático de facturas por WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-enabled">Activar WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite enviar facturas por WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="whatsapp-enabled"
                    checked={config.whatsappEnabled}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, whatsappEnabled: checked }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-phone">Número predeterminado</Label>
                  <Input
                    id="default-phone"
                    placeholder="+1 (809) 123-4567"
                    value={config.defaultPhone}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, defaultPhone: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto-message">Mensaje automático</Label>
                  <Textarea
                    id="auto-message"
                    placeholder="Mensaje que se enviará con las facturas"
                    value={config.autoMessage}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, autoMessage: e.target.value }))
                    }
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">WhatsApp Business API</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Conecta tu cuenta de WhatsApp Business para funciones avanzadas
                  </p>
                  <Button variant="outline" disabled>
                    Conectar WhatsApp Business (Próximamente)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Sistema</CardTitle>
                <CardDescription>
                  Configuraciones generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={config.language}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={config.currency}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOP">Pesos Dominicanos (DOP)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                        <SelectItem value="EUR">Euros (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                Guardar Configuración
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracion;