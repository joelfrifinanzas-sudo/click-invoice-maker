import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { BackButton } from '@/components/BackButton';

const Configuracion = () => {
  const { toast } = useToast();
  const { config, updateConfig, updateLanguage, updateCurrency, t } = useAppConfig();

  const handleSave = () => {
    toast({
      title: t('config.saved'),
      description: t('config.saved.description'),
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle pt-14">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <h1 className="text-3xl font-bold text-foreground">{t('config.title')}</h1>
            </div>
            
            {/* WhatsApp Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>{t('config.whatsapp')}</CardTitle>
                <CardDescription>
                  {t('config.whatsapp.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-enabled">{t('config.whatsapp.enable')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('config.whatsapp.enable.description')}
                    </p>
                  </div>
                  <Switch
                    id="whatsapp-enabled"
                    checked={config.whatsappEnabled}
                    onCheckedChange={(checked) => 
                      updateConfig({ whatsappEnabled: checked })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-phone">{t('config.defaultPhone')}</Label>
                  <Input
                    id="default-phone"
                    placeholder="+1 (809) 123-4567"
                    value={config.defaultPhone}
                    onChange={(e) => 
                      updateConfig({ defaultPhone: e.target.value })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto-message">{t('config.autoMessage')}</Label>
                  <Textarea
                    id="auto-message"
                    placeholder="Mensaje que se enviará con las facturas"
                    value={config.autoMessage}
                    onChange={(e) => 
                      updateConfig({ autoMessage: e.target.value })
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

            {/* Apariencia */}
            <Card>
              <CardHeader>
                <CardTitle>{t('config.appearance')}</CardTitle>
                <CardDescription>
                  {t('config.appearance.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="home-v2">{t('config.homeV2')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('config.homeV2.description')}
                    </p>
                  </div>
                  <Switch
                    id="home-v2"
                    checked={!!config.homeV2Enabled}
                    onCheckedChange={(checked) => updateConfig({ homeV2Enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>{t('config.system')}</CardTitle>
                <CardDescription>
                  {t('config.system.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('config.language')}</Label>
                    <Select
                      value={config.language}
                      onValueChange={updateLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">{t('language.es')}</SelectItem>
                        <SelectItem value="en">{t('language.en')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('config.currency')}</Label>
                    <Select
                      value={config.currency}
                      onValueChange={updateCurrency}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOP">{t('currency.DOP')}</SelectItem>
                        <SelectItem value="USD">{t('currency.USD')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                {t('common.save')} {t('config.title')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracion;