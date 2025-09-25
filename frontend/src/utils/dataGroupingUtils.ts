/**
 * Utilidades para agrupar datos de tablas específicas
 */

/**
 * Agrupa datos de MetricaSensor por nodo y tipo de sensor
 */
export function groupMetricaSensorData(data: any[]) {
  const grouped: { [key: string]: any[] } = {};
  
  data.forEach(item => {
    const key = `${item.nodo_id}-${item.tipo_id}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}

/**
 * Agrupa datos de Sensor por nodo
 */
export function groupSensorData(data: any[]) {
  const grouped: { [key: string]: any[] } = {};
  
  data.forEach(item => {
    const key = item.nodo_id;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}

/**
 * Agrupa datos de UsuarioPerfil por usuario
 */
export function groupUsuarioPerfilData(data: any[]) {
  const grouped: { [key: string]: any[] } = {};
  
  data.forEach(item => {
    const key = item.usuario_id;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}
