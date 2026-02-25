/**
 * Utilidades para gráficos - Extraído de componentes duplicados
 * Usado por: MedicionesAreaChart, DetailedEChart, MetricMiniChart, MetricCard
 */

/**
 * Convierte color hex a rgba con transparencia
 */
export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Función para calcular el rango de fechas en días basado en fechas únicas
 */
export function calculateDateRange(xAxisData: string[]): number {
  if (xAxisData.length < 2) return 0;
  
  const uniqueDates = new Set<string>();
  xAxisData.forEach(x => {
    const dateOnly = x?.split(' ')[0];
    if (dateOnly) {
      uniqueDates.add(dateOnly);
    }
  });
  
  const uniqueDateCount = uniqueDates.size;
  
  if (uniqueDateCount === 1) {
    return 0.5;
  }
  
  if (uniqueDateCount === 2) {
    const firstDate = xAxisData[0]?.split(' ')[0];
    const lastDate = xAxisData[xAxisData.length - 1]?.split(' ')[0];
    
    if (!firstDate || !lastDate) return 1;
    
    const [d1, m1] = firstDate.split('/').map(Number);
    const [d2, m2] = lastDate.split('/').map(Number);
    
    const currentYear = new Date().getFullYear();
    let y1 = currentYear;
    let y2 = currentYear;
    
    if (m2 < m1) {
      y2 = currentYear + 1;
    }
    
    const dateFirst = new Date(y1, m1 - 1, d1);
    const dateLast = new Date(y2, m2 - 1, d2);
    
    const diffTime = Math.abs(dateLast.getTime() - dateFirst.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const firstDate = xAxisData[0]?.split(' ')[0];
  const lastDate = xAxisData[xAxisData.length - 1]?.split(' ')[0];
  
  if (!firstDate || !lastDate) return uniqueDateCount;
  
  const [d1, m1] = firstDate.split('/').map(Number);
  const [d2, m2] = lastDate.split('/').map(Number);
  
  const currentYear = new Date().getFullYear();
  let y1 = currentYear;
  let y2 = currentYear;
  
  if (m2 < m1) {
    y2 = currentYear + 1;
  }
  
  const dateFirst = new Date(y1, m1 - 1, d1);
  const dateLast = new Date(y2, m2 - 1, d2);
  
  const diffTime = Math.abs(dateLast.getTime() - dateFirst.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Función para determinar el intervalo de etiquetas del eje X según el rango
 */
export function calculateXAxisInterval(dateRangeDays: number): {
  showTime: boolean;
  intervalDays: number;
} {
  if (dateRangeDays <= 1) {
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 7) {
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 21) {
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 28) {
    return { showTime: false, intervalDays: 1 };
  } else {
    return { showTime: false, intervalDays: 3 };
  }
}

/**
 * Función para calcular un intervalo limpio para el eje Y
 */
export function calculateNiceInterval(min: number, max: number): { min: number; max: number; interval: number } {
  if (min === null || max === null || min === undefined || max === undefined) {
    return { min: undefined as any, max: undefined as any, interval: undefined as any };
  }

  const range = max - min;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
  const normalizedRange = range / magnitude;

  let interval: number;
  if (normalizedRange <= 1) {
    interval = 0.1 * magnitude;
  } else if (normalizedRange <= 2) {
    interval = 0.2 * magnitude;
  } else if (normalizedRange <= 5) {
    interval = 0.5 * magnitude;
  } else {
    interval = magnitude;
  }

  let roundedMin: number;
  if (min > 0) {
    roundedMin = Math.max(0, Math.floor(min / interval) * interval);
  } else {
    roundedMin = Math.floor(min / interval) * interval;
  }

  const roundedMax = Math.ceil(max / interval) * interval;

  return {
    min: roundedMin,
    max: roundedMax,
    interval
  };
}
