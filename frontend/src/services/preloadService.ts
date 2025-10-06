// Servicio de preload para componentes críticos
interface PreloadConfig {
  priority: 'high' | 'medium' | 'low';
  preloadOnIdle: boolean;
  preloadOnHover: boolean;
}

interface ComponentPreloadConfig {
  [key: string]: PreloadConfig;
}

class PreloadService {
  private preloadedComponents = new Set<string>();
  private preloadQueue: Array<() => Promise<any>> = [];
  private isIdle = false;

  constructor() {
    this.setupIdleDetection();
  }

  /**
   * Configuración de preload por componente
   */
  private preloadConfig: ComponentPreloadConfig = {
    // Componentes críticos - preload inmediato
    'SystemParameters': { priority: 'high', preloadOnIdle: true, preloadOnHover: false },
    'DashboardMain': { priority: 'high', preloadOnIdle: true, preloadOnHover: false },
    
    // Componentes de uso frecuente - preload en idle
    'NormalInsertForm': { priority: 'medium', preloadOnIdle: true, preloadOnHover: true },
    'MassiveUmbralForm': { priority: 'medium', preloadOnIdle: true, preloadOnHover: true },
    'MultipleMetricaSensorForm': { priority: 'medium', preloadOnIdle: true, preloadOnHover: true },
    'DashboardHierarchy': { priority: 'medium', preloadOnIdle: true, preloadOnHover: true },
    
    // Componentes de uso ocasional - preload en hover
    'UmbralesMain': { priority: 'low', preloadOnIdle: false, preloadOnHover: true },
    'AlertasMain': { priority: 'low', preloadOnIdle: false, preloadOnHover: true },
    'MensajesMain': { priority: 'low', preloadOnIdle: false, preloadOnHover: true },
  };

  /**
   * Detectar cuando el navegador está idle
   */
  private setupIdleDetection(): void {
    if ('requestIdleCallback' in window) {
      const scheduleIdlePreload = () => {
        window.requestIdleCallback(() => {
          this.isIdle = true;
          this.processIdlePreloads();
          this.isIdle = false;
        });
      };

      // Preload después de 2 segundos de inactividad
      setTimeout(scheduleIdlePreload, 2000);
      
      // Preload en eventos de usuario
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, scheduleIdlePreload, { once: true });
      });
    } else {
      // Fallback para navegadores sin requestIdleCallback
      setTimeout(() => {
        this.isIdle = true;
        this.processIdlePreloads();
        this.isIdle = false;
      }, 3000);
    }
  }

  /**
   * Preload de componente crítico
   */
  async preloadComponent(componentName: string, importFunction: () => Promise<any>): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      console.log(`🎯 Componente ${componentName} ya preloaded`);
      return;
    }

    try {
      console.log(`🚀 Preloading ${componentName}...`);
      const startTime = performance.now();
      
      await importFunction();
      this.preloadedComponents.add(componentName);
      
      const endTime = performance.now();
      console.log(`✅ ${componentName} preloaded en ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`❌ Error preloading ${componentName}:`, error);
    }
  }

  /**
   * Preload de componentes críticos inmediato
   */
  async preloadCriticalComponents(): Promise<void> {
    const criticalComponents = Object.entries(this.preloadConfig)
      .filter(([_, config]) => config.priority === 'high')
      .map(([name, _]) => name);

    console.log('🔥 Preloading componentes críticos:', criticalComponents);
    
    // Preload en paralelo
    const preloadPromises = criticalComponents.map(name => {
      const importFunction = this.getImportFunction(name);
      return this.preloadComponent(name, importFunction);
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Procesar preloads en idle
   */
  private async processIdlePreloads(): Promise<void> {
    if (!this.isIdle) return;

    const idleComponents = Object.entries(this.preloadConfig)
      .filter(([name, config]) => 
        config.preloadOnIdle && 
        config.priority === 'medium' && 
        !this.preloadedComponents.has(name)
      );

    if (idleComponents.length === 0) return;

    console.log('⏳ Procesando preloads en idle:', idleComponents.map(([name]) => name));

    // Preload uno por uno para no bloquear
    for (const [name] of idleComponents) {
      if (!this.isIdle) break; // Salir si ya no estamos idle
      
      const importFunction = this.getImportFunction(name);
      await this.preloadComponent(name, importFunction);
      
      // Pequeña pausa entre preloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Preload en hover
   */
  setupHoverPreload(element: HTMLElement, componentName: string): (() => void) | undefined {
    const config = this.preloadConfig[componentName];
    if (!config?.preloadOnHover) return;

    let hoverTimeout: number;

    const handleMouseEnter = () => {
      hoverTimeout = window.setTimeout(() => {
        const importFunction = this.getImportFunction(componentName);
        this.preloadComponent(componentName, importFunction);
      }, 200); // Preload después de 200ms de hover
    };

    const handleMouseLeave = () => {
      clearTimeout(hoverTimeout);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      clearTimeout(hoverTimeout);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }

  /**
   * Obtener función de import para un componente
   */
  private getImportFunction(componentName: string): () => Promise<any> {
    const importMap: { [key: string]: () => Promise<any> } = {
      'SystemParameters': () => import('../components/SystemParameters'),
      'DashboardMain': () => import('../components/Dashboard/DashboardMain'),
      'NormalInsertForm': () => import('../components/NormalInsertForm'),
      'MassiveUmbralForm': () => import('../components/MassiveUmbralForm'),
      'MultipleMetricaSensorForm': () => import('../components/MultipleMetricaSensorForm'),
      'DashboardHierarchy': () => import('../components/DashboardHierarchy'),
      'UmbralesMain': () => import('../components/Umbrales/UmbralesMain'),
      'AlertasMain': () => import('../components/Reportes/AlertasMain'),
      'MensajesMain': () => import('../components/Reportes/MensajesMain'),
    };

    return importMap[componentName] || (() => Promise.resolve());
  }

  /**
   * Verificar si un componente está preloaded
   */
  isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  /**
   * Obtener estadísticas de preload
   */
  getPreloadStats(): { preloaded: string[]; total: number; config: ComponentPreloadConfig } {
    return {
      preloaded: Array.from(this.preloadedComponents),
      total: this.preloadedComponents.size,
      config: this.preloadConfig
    };
  }

  /**
   * Limpiar preloads (para testing)
   */
  clearPreloads(): void {
    this.preloadedComponents.clear();
  }
}

// Instancia global del servicio
export const preloadService = new PreloadService();

export default preloadService;
