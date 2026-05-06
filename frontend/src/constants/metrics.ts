/**
 * Constantes para métricas
 * Valores fijos utilizados en dashboards y visualizaciones
 */

export const METRICS = {
  DEFAULT_ID: 1, // Temperatura (métrica por defecto para dashboards)
} as const;

export type MetricsId = typeof METRICS[keyof typeof METRICS];
