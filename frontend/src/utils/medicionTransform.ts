/**
 * Utilidades para transformación de datos de mediciones
 * Extraído de ModernDashboard.tsx y MetricaPorLoteModal.tsx
 */

/**
 * Transforma datos del backend al formato MedicionData con campos normalizados
 * Maneja el caso donde localizacion puede ser un array (resultado de Supabase)
 */
export function transformMedicionData(data: any[]): any[] {
  return data.map(m => {
    const localizacion = m.localizacion 
      ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) 
      : null;
    
    const sensor = localizacion?.sensor 
      ? (Array.isArray(localizacion.sensor) ? localizacion.sensor[0] : localizacion.sensor) 
      : null;
    
    return {
      ...m,
      localizacion: localizacion ? {
        ...localizacion,
        sensor: sensor
      } : null,
      metricaid: Number(m.metricaid ?? localizacion?.metricaid ?? 0),
      nodoid: Number(m.nodoid ?? localizacion?.nodoid ?? 0),
      sensorid: Number(m.sensorid ?? localizacion?.sensorid ?? 0),
      tipoid: Number(m.tipoid ?? sensor?.tipoid ?? localizacion?.sensor?.tipoid ?? 0),
      ubicacionid: Number(m.ubicacionid ?? localizacion?.nodo?.ubicacionid ?? 0)
    };
  });
}
