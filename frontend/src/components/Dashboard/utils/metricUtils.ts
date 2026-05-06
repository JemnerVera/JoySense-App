import type { MetricMetadata, BackendMetric } from '../../../types/metrics';

/**
 * Constantes y utilidades compartidas para ModernDashboard
 */

// Límites de datos por rango temporal
export const DATA_LIMITS = {
  RANGE_SELECTED: 20000,
  HOURS_24: 1000,
  DAYS_7: 5000,
  DAYS_14: 10000,
  DAYS_30: 20000,
  LAST_HOURS: 5000
} as const;

// Defaults de métricas: colores, rangos, descripciones, aliases
export const METRICS_DEFAULTS: Record<string, Partial<MetricMetadata>> = {
  'temperatura': {
    color: '#f59e0b',
    ranges: { min: 15, max: 35, optimal: [20, 28] },
    description: 'Temperatura del suelo/sustrato',
    aliases: ['temperatura', 'temp', 'temperature']
  },
  'humedad': {
    color: '#3b82f6',
    ranges: { min: 40, max: 90, optimal: [60, 75] },
    description: 'Humedad relativa del sustrato',
    aliases: ['humedad', 'humidity']
  },
  'conductividad': {
    color: '#10b981',
    ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
    description: 'Conductividad eléctrica',
    aliases: ['conductividad', 'electroconductividad', 'conductivity', 'ec']
  },
  'ph': {
    color: '#ef4444',
    ranges: { min: 6, max: 8, optimal: [6.5, 7.5] },
    description: 'Potencial de hidrógeno',
    aliases: ['ph']
  },
  'luz': {
    color: '#fbbf24',
    ranges: { min: 0, max: 100000, optimal: [20000, 50000] },
    description: 'Intensidad luminosa',
    aliases: ['luz', 'light']
  },
  'co2': {
    color: '#6366f1',
    ranges: { min: 300, max: 2000, optimal: [800, 1200] },
    description: 'Dióxido de carbono',
    aliases: ['co2']
  },
  'presion': {
    color: '#8b5cf6',
    ranges: { min: 900, max: 1100, optimal: [1000, 1020] },
    description: 'Presión atmosférica',
    aliases: ['presion', 'pressure']
  },
  'brix': {
    color: '#ec4899',
    ranges: { min: 0, max: 30, optimal: [10, 20] },
    description: 'Grados Brix',
    aliases: ['brix']
  }
};

// Mapeo de colores por nombre de métrica (legacy, mantener para backward compatibility)
export const METRIC_COLOR_MAP: { [key: string]: string } = {
  'temperatura': '#f59e0b',
  'temp': '#f59e0b',
  'humedad': '#3b82f6',
  'humidity': '#3b82f6',
  'conductividad': '#10b981',
  'electroconductividad': '#10b981',
  'conductivity': '#10b981',
  'ph': '#ef4444',
  'luz': '#fbbf24',
  'light': '#fbbf24',
  'co2': '#6366f1',
  'presion': '#8b5cf6',
  'pressure': '#8b5cf6',
};

// Rangos por defecto por métrica (legacy, mantener para backward compatibility)
export const METRIC_RANGES_MAP: { [key: string]: { min: number; max: number; optimal: [number, number] } } = {
  'temperatura': { min: 15, max: 35, optimal: [20, 28] },
  'temp': { min: 15, max: 35, optimal: [20, 28] },
  'humedad': { min: 40, max: 90, optimal: [60, 75] },
  'humidity': { min: 40, max: 90, optimal: [60, 75] },
  'conductividad': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'electroconductividad': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'conductivity': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'ph': { min: 6, max: 8, optimal: [6.5, 7.5] },
  'luz': { min: 0, max: 100000, optimal: [20000, 50000] },
  'light': { min: 0, max: 100000, optimal: [20000, 50000] },
  'co2': { min: 300, max: 2000, optimal: [800, 1200] },
  'presion': { min: 900, max: 1100, optimal: [1000, 1020] },
  'pressure': { min: 900, max: 1100, optimal: [1000, 1020] },
};

// Mapeo de metricaid (legacy)
export const METRIC_ID_MAP: { [key: string]: number } = {
  'temperatura': 1,
  'humedad': 2,
  'conductividad': 3,
  'brix': 4
};

// Mapeo de métrica a normalización (legacy)
export const METRIC_NORMALIZATION_MAP: { [key: string]: string } = {
  'temperatura': 'temperatura',
  'temp': 'temperatura',
  'humedad': 'humedad',
  'humidity': 'humedad',
  'conductividad': 'conductividad',
  'electroconductividad': 'conductividad',
  'conductivity': 'conductividad',
  'ec': 'conductividad',
  'ph': 'ph',
  'luz': 'luz',
  'light': 'luz',
  'co2': 'co2',
  'presion': 'presion',
  'pressure': 'presion',
};

/**
 * Utilidades de métrica
 */

function normalizeStringForComparison(str: string): string {
  return str
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .toLowerCase()
    .trim();
}

export function normalizeMetricDataKey(metricaName: string): string {
  const normalized = metricaName.toLowerCase().trim();
  return METRIC_NORMALIZATION_MAP[normalized] || normalized;
}

/**
 * Crea un registry unificado de métricas combinando defaults del frontend con datos del backend
 * @param backendMetrics - Array de métricas cargadas del backend
 * @returns Map de id normalizado a MetricMetadata completo
 */
export function createMetricsRegistry(backendMetrics: BackendMetric[]): Map<string, MetricMetadata> {
  const registry = new Map<string, MetricMetadata>();

  // Primero registrar todos los defaults
  Object.entries(METRICS_DEFAULTS).forEach(([id, defaults]) => {
    registry.set(id, {
      id,
      metricaid: undefined,
      name: id,
      unit: '',
      color: defaults.color || '#94a3b8',
      ranges: defaults.ranges || { min: 0, max: 100, optimal: [20, 80] },
      description: defaults.description,
      aliases: defaults.aliases || []
    } as MetricMetadata);
  });

  // Luego sobrescribir/actualizar con datos del backend
  if (Array.isArray(backendMetrics)) {
    backendMetrics.forEach(backend => {
      const normalized = normalizeMetricDataKey(backend.metrica);
      const existing = registry.get(normalized);

      registry.set(normalized, {
        id: normalized,
        metricaid: backend.metricaid,
        name: backend.metrica,
        unit: backend.unidad,
        color: existing?.color || '#94a3b8',
        ranges: existing?.ranges || { min: 0, max: 100, optimal: [20, 80] },
        description: existing?.description,
        aliases: existing?.aliases || []
      } as MetricMetadata);
    });
  }

  return registry;
}

/**
 * Busca una métrica en el registry por nombre, con soporte para aliases
 * @param registry - Map de métricas
 * @param name - Nombre de la métrica a buscar
 * @returns MetricMetadata si encuentra, undefined si no
 */
export function findMetricByName(registry: Map<string, MetricMetadata>, name: string): MetricMetadata | undefined {
  const normalized = normalizeStringForComparison(name);

  // Búsqueda exacta por id
  for (const [, metric] of registry) {
    if (metric.id === normalized) return metric;
  }

  // Búsqueda por aliases
  for (const [, metric] of registry) {
    if (metric.aliases?.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return metric;
    }
  }

  return undefined;
}

/**
 * Obtiene el color de una métrica desde el registry
 * @param registry - Map de métricas
 * @param metricName - Nombre de la métrica
 * @returns Color hex
 */
export function getMetricColorFromRegistry(registry: Map<string, MetricMetadata>, metricName: string): string {
  const metric = findMetricByName(registry, metricName);
  return metric?.color || '#94a3b8';
}

/**
 * Obtiene los rangos de una métrica desde el registry
 * @param registry - Map de métricas
 * @param metricName - Nombre de la métrica
 * @returns Objeto con min, max y optimal
 */
export function getMetricRangesFromRegistry(registry: Map<string, MetricMetadata>, metricName: string) {
  const metric = findMetricByName(registry, metricName);
  return metric?.ranges || { min: 0, max: 100, optimal: [20, 80] as [number, number] };
}

/**
 * Obtiene el metricaid desde el registry
 * @param registry - Map de métricas
 * @param metricName - Nombre de la métrica
 * @returns ID numérico o undefined
 */
export function getMetricIdFromRegistry(registry: Map<string, MetricMetadata>, metricName: string): number | undefined {
  const metric = findMetricByName(registry, metricName);
  return metric?.metricaid;
}

// Legacy functions para backward compatibility
export function getMetricColor(metricaName: string): string {
  const normalizedName = metricaName.toLowerCase().trim();
  return METRIC_COLOR_MAP[normalizedName] || '#94a3b8';
}

export function getMetricRanges(metricaName: string) {
  const normalizedName = metricaName.toLowerCase().trim();
  return METRIC_RANGES_MAP[normalizedName] || { min: 0, max: 100, optimal: [20, 80] as [number, number] };
}

export function getMetricIdFromDataKey(dataKey: string): number {
  return METRIC_ID_MAP[dataKey] || 1;
}

/**
 * Crea un mapeo dinámico de dataKey a metricaid basado en las métricas del backend
 * Esta función permite que nuevas métricas se agreguen sin modificar el código
 * @param metricas - Array de métricas cargadas del backend
 * @returns Mapeo de dataKey normalizado a metricaid
 */
export function createMetricIdMapFromMetricas(metricas: any[]): { [key: string]: number } {
  const map: { [key: string]: number } = {}

  if (!Array.isArray(metricas)) {
    return map
  }

  metricas.forEach(m => {
    if (m.metricaid && m.metrica) {
      const normalized = normalizeMetricDataKey(m.metrica)
      map[normalized] = m.metricaid
    }
  })

  return map
}

/**
 * Obtiene información de una métrica desde el registry usando su metricaid
 * @param registry - Map de métricas
 * @param metricaid - ID numérico de la métrica
 * @returns Objeto con nombre y unidad
 */
export function getMetricInfoFromIdRegistry(registry: Map<string, MetricMetadata>, metricaid: number): { nombre: string; unidad: string } {
  for (const [, metric] of registry) {
    if (metric.metricaid === metricaid) {
      return {
        nombre: metric.name,
        unidad: metric.unit
      };
    }
  }
  return { nombre: 'desconocida', unidad: '' };
}

// Legacy function para backward compatibility
export function getMetricInfoFromId(metricaid: number): { nombre: string; unidad: string } {
  const metricMap: { [key: number]: { nombre: string; unidad: string } } = {
    1: { nombre: 'temperatura', unidad: '°C' },
    2: { nombre: 'humedad', unidad: '%' },
    3: { nombre: 'conductividad', unidad: 'uS/cm' }
  };
  return metricMap[metricaid] || { nombre: 'desconocida', unidad: '' };
}

/**
 * Verifica si un nombre de métrica corresponde a un ID específico usando el registry
 * @param registry - Map de métricas
 * @param metricName - Nombre de la métrica a verificar
 * @param metricId - ID normalizado (ej: 'temperatura')
 * @returns true si coinciden
 */
export function matchesMetricIdRegistry(registry: Map<string, MetricMetadata>, metricName: string, metricId: string): boolean {
  const metric = findMetricByName(registry, metricName);
  if (!metric) return false;
  return metric.id === metricId || metric.aliases?.includes(metricId) || false;
}

// Legacy function para backward compatibility
export function matchesMetricId(metricName: string, metricId: string): boolean {
  const cleanedName = metricName
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .trim()
    .toLowerCase();

  if (metricId === 'temperatura' && (
    cleanedName.includes('temperatura') ||
    cleanedName.includes('temp')
  )) {
    return true;
  }

  if (metricId === 'humedad' && (
    cleanedName.includes('humedad') ||
    cleanedName.includes('humidity')
  )) {
    return true;
  }

  if (metricId === 'conductividad' && (
    cleanedName.includes('conductividad') ||
    cleanedName.includes('electroconductividad') ||
    cleanedName.includes('conductivity')
  )) {
    return true;
  }

  return false;
}
