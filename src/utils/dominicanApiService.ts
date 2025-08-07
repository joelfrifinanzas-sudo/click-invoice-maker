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
  private static readonly DEBOUNCE_DELAY = 800; // 800ms de delay para evitar muchas consultas
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
        // Verificar cache primero
        const cachedData = this.cache.get(cleanId);
        if (cachedData) {
          onSuccess(cachedData);
          return;
        }

        // Hacer consulta a las APIs
        const result = await this.fetchFromApis(cleanId);
        
        if (result.success && result.data) {
          // Guardar en cache
          this.cache.set(cleanId, result.data);
          onSuccess(result.data);
        } else if (onError) {
          onError(result.error || 'No se encontraron datos');
        }
      } catch (error) {
        console.warn('Error en consulta de API dominicana:', error);
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
      // Por ahora devolvemos datos simulados para testing
      // En la implementación real, esta función consultaría un registro público real
      
      // Simular algunos datos de prueba
      const testData: Record<string, string> = {
        '00112345678': 'Juan Carlos Pérez Martínez',
        '12345678901': 'María Elena Santos Rodríguez',
        '123456789': 'Empresas del Caribe S.R.L.',
        '987654321': 'Comercial Dominicana S.A.S.'
      };

      const name = testData[clientId];
      
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