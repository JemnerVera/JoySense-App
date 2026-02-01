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

// Mapeo de colores por nombre de métrica
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

// Rangos por defecto por métrica
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

// Mapeo de metricaid
export const METRIC_ID_MAP: { [key: string]: number } = {
  'temperatura': 1,
  'humedad': 2,
  'conductividad': 3
};

// Mapeo de métrica a normalización
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

export function getMetricColor(metricaName: string): string {
  const normalizedName = metricaName.toLowerCase().trim();
  return METRIC_COLOR_MAP[normalizedName] || '#94a3b8';
}

export function getMetricRanges(metricaName: string) {
  const normalizedName = metricaName.toLowerCase().trim();
  return METRIC_RANGES_MAP[normalizedName] || { min: 0, max: 100, optimal: [20, 80] as [number, number] };
}

export function normalizeMetricDataKey(metricaName: string): string {
  const normalized = metricaName.toLowerCase().trim();
  return METRIC_NORMALIZATION_MAP[normalized] || normalized;
}

export function getMetricIdFromDataKey(dataKey: string): number {
  return METRIC_ID_MAP[dataKey] || 1;
}

export function getMetricInfoFromId(metricaid: number): { nombre: string; unidad: string } {
  const metricMap: { [key: number]: { nombre: string; unidad: string } } = {
    1: { nombre: 'temperatura', unidad: '°C' },
    2: { nombre: 'humedad', unidad: '%' },
    3: { nombre: 'conductividad', unidad: 'uS/cm' }
  };
  return metricMap[metricaid] || { nombre: 'desconocida', unidad: '' };
}

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
