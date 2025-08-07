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
   * Consulta datos de un RNC o cédula en la API de DGII
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

    try {
      console.log('🔍 Consultando datos para:', cleanId);
      
      // Verificar cache primero
      const cachedData = this.cache.get(cleanId);
      if (cachedData) {
        console.log('✅ Datos encontrados en cache:', cachedData);
        onSuccess(cachedData);
        return;
      }

      // Hacer consulta a la API de DGII
      console.log('🌐 Consultando API de DGII...');
      const result = await this.fetchFromDgiiVercelApi(cleanId);
      
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
      console.error('❌ Error en consulta de API DGII:', error);
      if (onError) {
        onError('Error de conexión');
      }
    }
  }

  /**
   * Consulta la API de DGII usando el nuevo endpoint de wrobirson
   */
  private static async fetchFromDgiiVercelApi(clientId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`https://consultasdgii.wrobirson.workers.dev/rnc/${clientId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('DGII API no disponible');
      }

      const data = await response.json();
      
      if (data.nombre) {
        return {
          success: true,
          data: {
            name: data.nombre,
            rnc: clientId.length >= 9 ? clientId : undefined,
            cedula: clientId.length === 11 ? clientId : undefined,
            status: 'Encontrado'
          }
        };
      }

      return { success: false, error: 'No registrado o RNC inválido' };
    } catch (error) {
      return { success: false, error: 'Error en API de DGII' };
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