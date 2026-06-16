/**
 * Utilidades para transformación de datos de mediciones
 * Extraído de ModernDashboard.tsx y MetricaPorLoteModal.tsx
 */

/** Respuesta de fn_get_mediciones_nodo_detallado */
export interface RpcMedicionDetalladaRow {
  medicionid?: number;
  localizacionid?: number;
  localizacion_nombre?: string;
  fecha?: string;
  medicion?: number | string;
  metricaid?: number;
  metrica_nombre?: string;
  metrica?: string;
  unidad?: string;
  sensorid?: number;
  sensor_nombre?: string;
  sensor?: string;
  tipoid?: number;
  tipo_nombre?: string;
  tipo?: string;
}

/**
 * Transforma filas de fn_get_mediciones_nodo_detallado al formato MedicionData.
 */
export function transformRpcMedicionesDetallado(
  rows: RpcMedicionDetalladaRow[],
  nodoid: number
): any[] {
  return rows.map((rpcData) => ({
    medicionid: rpcData.medicionid || 0,
    localizacionid: rpcData.localizacionid || 0,
    fecha: rpcData.fecha,
    medicion: Number(rpcData.medicion),
    localizacion: {
      localizacionid: rpcData.localizacionid || 0,
      localizacion: rpcData.localizacion_nombre || '',
      nodoid,
      metricaid: rpcData.metricaid,
      sensorid: rpcData.sensorid || 0,
      metrica: {
        metricaid: rpcData.metricaid,
        metrica: rpcData.metrica_nombre || rpcData.metrica || '',
        unidad: rpcData.unidad || '',
      },
      sensor: rpcData.sensorid
        ? {
            sensorid: rpcData.sensorid,
            sensor: rpcData.sensor_nombre || rpcData.sensor || '',
            nombre: rpcData.sensor_nombre || rpcData.sensor || '',
            modelo: '',
            deveui: '',
            tipoid: rpcData.tipoid || 0,
            tipo: {
              tipoid: rpcData.tipoid || 0,
              tipo: rpcData.tipo_nombre || rpcData.tipo || 'Sensor',
            },
          }
        : undefined,
    },
    metricaid: rpcData.metricaid,
    nodoid,
    sensorid: rpcData.sensorid || 0,
    tipoid: rpcData.tipoid || 0,
    ubicacionid: 0,
  }));
}

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
