/**
 * Utilidades para operaciones de replicación
 */

import { JoySenseService } from '../services/backend-api';

/**
 * Replica un sensor a todos los nodos del mismo tipo
 */
export async function replicateSensor(nodo: any, relatedData: any) {
  try {
    const { nodosData, tiposData } = relatedData;
    
    // Encontrar el tipo del nodo actual
    const currentNodo = nodosData.find((n: any) => n.id === nodo.id);
    if (!currentNodo) return;

    const currentTipo = tiposData.find((t: any) => t.id === currentNodo.tipo_id);
    if (!currentTipo) return;

    // Encontrar todos los nodos del mismo tipo
    const nodosDelMismoTipo = nodosData.filter((n: any) => n.tipo_id === currentTipo.id);
    
    // Replicar el sensor a cada nodo
    const replicationPromises = nodosDelMismoTipo.map(async (nodoTarget: any) => {
      try {
        await JoySenseService.insertTableRow('sensor', {
          nodo_id: nodoTarget.id,
          tipo_id: currentTipo.id,
          nombre: `Sensor ${currentTipo.nombre} - ${nodoTarget.nombre}`,
          descripcion: `Sensor replicado desde ${currentNodo.nombre}`,
          activo: true
        });
      } catch (error) {
        console.error(`Error replicando sensor a nodo ${nodoTarget.id}:`, error);
      }
    });

    await Promise.all(replicationPromises);
    return { success: true, replicated: nodosDelMismoTipo.length };
  } catch (error) {
    console.error('Error en replicación de sensor:', error);
    return { success: false, error };
  }
}

/**
 * Replica un nodo con todos sus sensores
 */
export async function replicateNodo(nodo: any, relatedData: any) {
  try {
    const { nodosData, tiposData, sensorsData } = relatedData;
    
    // Encontrar el tipo del nodo actual
    const currentNodo = nodosData.find((n: any) => n.id === nodo.id);
    if (!currentNodo) return;

    const currentTipo = tiposData.find((t: any) => t.id === currentNodo.tipo_id);
    if (!currentTipo) return;

    // Encontrar todos los nodos del mismo tipo
    const nodosDelMismoTipo = nodosData.filter((n: any) => n.tipo_id === currentTipo.id);
    
    // Obtener sensores del nodo actual
    const sensoresDelNodo = sensorsData.filter((s: any) => s.nodo_id === nodo.id);
    
    // Replicar nodo y sensores
    const replicationPromises = nodosDelMismoTipo.map(async (nodoTarget: any) => {
      try {
        // Replicar cada sensor del nodo actual al nodo objetivo
        for (const sensor of sensoresDelNodo) {
          await JoySenseService.insertTableRow('sensor', {
            nodo_id: nodoTarget.id,
            tipo_id: sensor.tipo_id,
            nombre: sensor.nombre.replace(currentNodo.nombre, nodoTarget.nombre),
            descripcion: sensor.descripcion,
            activo: sensor.activo
          });
        }
      } catch (error) {
        console.error(`Error replicando nodo a ${nodoTarget.id}:`, error);
      }
    });

    await Promise.all(replicationPromises);
    return { success: true, replicated: nodosDelMismoTipo.length };
  } catch (error) {
    console.error('Error en replicación de nodo:', error);
    return { success: false, error };
  }
}

/**
 * Replica un nodo para MetricaSensor
 */
export async function replicateNodoForMetricaSensor(nodo: any, relatedData: any) {
  try {
    const { nodosData, tiposData, metricasensorData } = relatedData;
    
    // Encontrar el tipo del nodo actual
    const currentNodo = nodosData.find((n: any) => n.id === nodo.id);
    if (!currentNodo) return;

    const currentTipo = tiposData.find((t: any) => t.id === currentNodo.tipo_id);
    if (!currentTipo) return;

    // Encontrar todos los nodos del mismo tipo
    const nodosDelMismoTipo = nodosData.filter((n: any) => n.tipo_id === currentTipo.id);
    
    // Obtener metricasensor del nodo actual
    const metricasensorDelNodo = metricasensorData.filter((ms: any) => ms.nodo_id === nodo.id);
    
    // Replicar metricasensor
    const replicationPromises = nodosDelMismoTipo.map(async (nodoTarget: any) => {
      try {
        for (const metricaSensor of metricasensorDelNodo) {
          await JoySenseService.insertTableRow('metricasensor', {
            nodo_id: nodoTarget.id,
            tipo_id: metricaSensor.tipo_id,
            metrica_id: metricaSensor.metrica_id,
            activo: metricaSensor.activo
          });
        }
      } catch (error) {
        console.error(`Error replicando metricasensor a ${nodoTarget.id}:`, error);
      }
    });

    await Promise.all(replicationPromises);
    return { success: true, replicated: nodosDelMismoTipo.length };
  } catch (error) {
    console.error('Error en replicación de metricasensor:', error);
    return { success: false, error };
  }
}
