// ============================================================================
// HOOK: useMassiveUmbralApplication - Lógica de aplicación de umbrales
// ============================================================================

import { FormData, SelectedNode, UmbralDataToApply } from '../types';

interface UseMassiveUmbralApplicationProps {
  formData: FormData;
  selectedNodes: SelectedNode[];
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  localizacionesData?: any[];
  onApply: (data: UmbralDataToApply[]) => void;
}

export const useMassiveUmbralApplication = ({
  formData,
  selectedNodes,
  getUniqueOptionsForField,
  localizacionesData,
  onApply
}: UseMassiveUmbralApplicationProps) => {
  const handleApply = () => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length === 0) return;

    const dataToApply: UmbralDataToApply[] = [];

    // Crear datos para cada combinación de nodo-tipo-métrica
    for (const node of selectedNodesData) {
      // Obtener tipos específicos para este nodo
      if (formData.entidadid) {
        const tiposDelNodo = getUniqueOptionsForField('tipoid', { 
          entidadid: formData.entidadid.toString(),
          nodoids: [node.nodoid] // Solo este nodo específico
        });

        for (const tipoOption of tiposDelNodo) {
          const tipo = {
            tipoid: parseInt(tipoOption.value.toString()),
            tipo: tipoOption.label,
            selected: true
          };
          
          for (const metrica of formData.metricasData) {
            // Solo procesar métricas seleccionadas
            if (metrica.selected) {
              // Verificar si esta combinación nodo-tipo-métrica existe en metricasensor
              const existeEnMetricasensor = getUniqueOptionsForField('metricaid', { 
                nodoids: [node.nodoid].join(',') 
              }).some(m => m.value === metrica.metricaid);
              
              if (!existeEnMetricasensor) {
                continue;
              }
              
              const umbralDelTipo = metrica.umbralesPorTipo[tipo.tipoid];
              
              // Solo incluir si el umbral tiene todos los campos requeridos
              if (umbralDelTipo && umbralDelTipo.minimo && umbralDelTipo.maximo && umbralDelTipo.criticidadid && umbralDelTipo.umbral) {
                // Obtener ubicacionid desde la tabla localizacion
                const localizacion = localizacionesData?.find(loc => loc.nodoid === node.nodoid);
                if (!localizacion || !localizacion.ubicacionid) {
                  console.error('❌ Nodo sin localización o ubicacionid:', { 
                    nodo: node.nodo, 
                    nodoid: node.nodoid, 
                    localizacion: localizacion 
                  });
                  continue; // Saltar este umbral si no tiene localización
                }
                
                const umbralData: UmbralDataToApply = {
                  ubicacionid: localizacion.ubicacionid,
                  nodoid: node.nodoid,
                  tipoid: tipo.tipoid,
                  metricaid: metrica.metricaid,
                  criticidadid: umbralDelTipo.criticidadid,
                  umbral: umbralDelTipo.umbral,
                  minimo: parseFloat(umbralDelTipo.minimo),
                  maximo: parseFloat(umbralDelTipo.maximo),
                  statusid: 1 // Activo por defecto
                };
                
                dataToApply.push(umbralData);
              }
            }
          }
        }
      }
    }

    onApply(dataToApply);
  };

  return {
    handleApply
  };
};

