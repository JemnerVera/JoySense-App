export interface MetricMetadata {
  id: string;
  metricaid?: number;
  name: string;
  unit: string;
  color: string;
  ranges: {
    min: number;
    max: number;
    optimal: [number, number];
  };
  description?: string;
  aliases: string[];
}

export interface BackendMetric {
  metricaid: number;
  metrica: string;
  unidad: string;
  statusid?: number;
  usercreatedid?: number;
  datecreated?: string;
  usermodifiedid?: number;
  datemodified?: string;
}
