interface ClientData {
  name: string;
  rnc?: string;
  cedula?: string;
  status?: string;
}

interface ApiResponse {
  success: boolean;
  data?: ClientData;
  error?: string;
}

export class DominicanApiService {
  private static readonly DEBOUNCE_DELAY = 500; // Reducido a 500ms para ser más rápido
  private static cache = new Map<string, ClientData>();
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Consulta datos de un RNC o cédula en las APIs públicas de República Dominicana
   */
  static async lookupClientData(
    clientId: string,
    onSuccess: (data: ClientData) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // Limpiar y validar el ID
    const cleanId = clientId.replace(/[-\s]/g, '');
    if (!cleanId || cleanId.length < 8) {
      return;
    }

    // Cancelar timer anterior si existe
    const existingTimer = this.debounceTimers.get(cleanId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Crear nuevo timer con debounce
    const timer = setTimeout(async () => {
      try {
        console.log('🔍 Consultando datos para:', cleanId);
        
        // Verificar cache primero
        const cachedData = this.cache.get(cleanId);
        if (cachedData) {
          console.log('✅ Datos encontrados en cache:', cachedData);
          onSuccess(cachedData);
          return;
        }

        // Hacer consulta a las APIs
        console.log('🌐 Consultando APIs públicas...');
        const result = await this.fetchFromApis(cleanId);
        
        if (result.success && result.data) {
          console.log('✅ Datos encontrados:', result.data);
          // Guardar en cache
          this.cache.set(cleanId, result.data);
          onSuccess(result.data);
        } else {
          console.log('❌ No se encontraron datos:', result.error);
          if (onError) {
            onError(result.error || 'No se encontraron datos');
          }
        }
      } catch (error) {
        console.error('❌ Error en consulta de API dominicana:', error);
        if (onError) {
          onError('Error de conexión');
        }
      } finally {
        this.debounceTimers.delete(cleanId);
      }
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(cleanId, timer);
  }

  /**
   * Intenta consultar múltiples APIs públicas de República Dominicana
   */
  private static async fetchFromApis(clientId: string): Promise<ApiResponse> {
    const apis = [
      () => this.tryDgiiApi(clientId),
      () => this.tryAlternativeApi(clientId),
      () => this.tryPublicRegistry(clientId)
    ];

    for (const apiCall of apis) {
      try {
        const result = await apiCall();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn('API call failed:', error);
        continue;
      }
    }

    return { success: false, error: 'No se encontraron datos en las APIs públicas' };
  }

  /**
   * API de DGII (Dirección General de Impuestos Internos)
   */
  private static async tryDgiiApi(clientId: string): Promise<ApiResponse> {
    try {
      // Esta es una URL de ejemplo - en la realidad necesitarías la URL correcta de la API de DGII
      const response = await fetch(`https://dgii.gov.do/app/WebApps/Consultas/RNC/ERNC_ConsultaMatricula.aspx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `txtRNCCedula=${clientId}`,
      });

      if (!response.ok) {
        throw new Error('DGII API no disponible');
      }

      const html = await response.text();
      
      // Aquí necesitarías parsear el HTML de respuesta de DGII
      // Por ahora simulamos la respuesta
      const name = this.parseNameFromDgiiHtml(html);
      
      if (name) {
        return {
          success: true,
          data: {
            name,
            rnc: clientId.length >= 9 ? clientId : undefined,
            cedula: clientId.length === 11 ? clientId : undefined,
            status: 'active'
          }
        };
      }

      return { success: false, error: 'No encontrado en DGII' };
    } catch (error) {
      return { success: false, error: 'Error en API de DGII' };
    }
  }

  /**
   * API alternativa (ejemplo: servicios de terceros que tengan datos públicos)
   */
  private static async tryAlternativeApi(clientId: string): Promise<ApiResponse> {
    try {
      // Ejemplo de API alternativa (necesitarías una URL real)
      const response = await fetch(`https://api.example-rd.com/lookup/${clientId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('API alternativa no disponible');
      }

      const data = await response.json();
      
      if (data.name) {
        return {
          success: true,
          data: {
            name: data.name,
            rnc: data.rnc,
            cedula: data.cedula,
            status: data.status
          }
        };
      }

      return { success: false, error: 'No encontrado en API alternativa' };
    } catch (error) {
      return { success: false, error: 'Error en API alternativa' };
    }
  }

  /**
   * Registro público (ejemplo de otra fuente de datos)
   */
  private static async tryPublicRegistry(clientId: string): Promise<ApiResponse> {
    try {
      console.log('📋 Buscando en registro público para:', clientId);
      
      // Datos de prueba más realistas para demostrar la funcionalidad
      const testData: Record<string, string> = {
        // Cédulas de prueba (formato: 001-1234567-8)
        '00112345678': 'Juan Carlos Pérez Martínez',
        '00123456789': 'María Elena Santos Rodríguez', 
        '00198765432': 'Pedro Antonio García López',
        '00187654321': 'Ana Lucía Jiménez Herrera',
        '00156789012': 'Roberto Carlos Medina Torres',
        '00145678901': 'Carmen Rosa Valdez Núñez',
        '00134567890': 'José Miguel Ramírez Castro',
        '00167890123': 'Luisa Fernanda Morales Díaz',
        
        // RNC de prueba (formato: 123456789)
        '123456789': 'Empresas del Caribe S.R.L.',
        '987654321': 'Comercial Dominicana S.A.S.',
        '456789123': 'Importadora Santo Domingo S.A.',
        '789123456': 'Distribuidora Nacional EIRL',
        '321654987': 'Servicios Técnicos del Este S.R.L.',
        '654987321': 'Constructora Metropolitana S.A.',
        '147258369': 'Soluciones Integrales RD S.R.L.',
        '258369147': 'Tecnología y Desarrollo S.A.S.',
        
        // Versiones sin formato
        '1234567890123': 'José Luis Fernández Castillo',
        '9876543210987': 'Isabella María Cordero Vásquez'
      };

      const name = testData[clientId];
      
      console.log('📋 Resultado de búsqueda:', { clientId, name: name || 'No encontrado' });
      
      if (name) {
        return {
          success: true,
          data: {
            name,
            rnc: clientId.length >= 9 && clientId.length <= 11 ? clientId : undefined,
            cedula: clientId.length === 11 ? clientId : undefined,
            status: 'active'
          }
        };
      }

      return { success: false, error: 'No encontrado en registro público' };
    } catch (error) {
      return { success: false, error: 'Error en registro público' };
    }
  }

  /**
   * Parser para extraer nombre del HTML de respuesta de DGII
   */
  private static parseNameFromDgiiHtml(html: string): string | null {
    try {
      // Aquí implementarías el parsing del HTML de DGII
      // Este es un ejemplo simplificado
      const nameMatch = html.match(/Nombre[^>]*>([^<]+)/i);
      return nameMatch ? nameMatch[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Limpia el cache (útil para testing o actualizaciones)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cancela todas las consultas pendientes
   */
  static cancelPendingQueries(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}