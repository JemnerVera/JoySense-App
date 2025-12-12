// ============================================================================
// HOOK: useMassiveUmbralValidation - Validación de nodos y formulario
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { SelectedNode, SelectedTipo, FormData, ValidationResult } from '../types';

interface UseMassiveUmbralValidationProps {
  selectedNodes: SelectedNode[];
  nodeSensorTypes: {[nodoid: number]: SelectedTipo[]};
  formData: FormData;
  assignedSensorTypes: SelectedTipo[];
}

export const useMassiveUmbralValidation = ({
  selectedNodes,
  nodeSensorTypes,
  formData,
  assignedSensorTypes
}: UseMassiveUmbralValidationProps) => {
  const [hasShownInconsistencyWarning, setHasShownInconsistencyWarning] = useState(false);

  // Función para verificar si todos los nodos seleccionados tienen los mismos tipos de sensores
  const validateNodeSensorTypes = (): ValidationResult => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length <= 1) {
      return { isValid: true, message: '', groupedNodes: {}, nodoAnalysis: [] };
    }

    const nodeTypes = selectedNodesData.map(node => {
      const types = nodeSensorTypes[node.nodoid] || [];
      return {
        nodoid: node.nodoid,
        nodo: node.nodo,
        types: types.map(t => t.tipo).sort(),
        count: types.length,
        typesKey: types.map(t => t.tipo).sort().join('|') // Clave única para agrupar
      };
    });

    // Agrupar nodos por cantidad y tipos de sensores
    const groupedNodes: {[key: string]: {count: number, types: string[], nodos: any[]}} = {};
    
    nodeTypes.forEach(nt => {
      const key = `${nt.count}-${nt.typesKey}`;
      if (!groupedNodes[key]) {
        groupedNodes[key] = {
          count: nt.count,
          types: nt.types,
          nodos: []
        };
      }
      groupedNodes[key].nodos.push(nt);
    });

    // Si solo hay un grupo, todos los nodos son consistentes
    if (Object.keys(groupedNodes).length === 1) {
      return { isValid: true, message: '', groupedNodes: {}, nodoAnalysis: [] };
    }

    // Crear mensaje agrupado (mantener para compatibilidad)
    const message = Object.values(groupedNodes).map(group => {
      const nodosStr = group.nodos.map(n => n.nodo).join(', ');
      const tipoStr = group.count !== 1 ? 'tipos' : 'tipo';
      return `Nodo${group.nodos.length > 1 ? 's' : ''} ${nodosStr} posee${group.nodos.length > 1 ? 'n' : ''} ${group.count.toString().padStart(2, '0')} ${tipoStr} de sensor.`;
    }).join('\n');

    return { isValid: false, message, groupedNodes, nodoAnalysis: nodeTypes };
  };

  const validationResult = useMemo(() => validateNodeSensorTypes(), [selectedNodes, nodeSensorTypes]);
  
  // Actualizar el flag cuando se detectan inconsistencias
  useEffect(() => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length > 1 && !validationResult.isValid && validationResult.groupedNodes && Object.keys(validationResult.groupedNodes).length > 0) {
      setHasShownInconsistencyWarning(true);
    } else if (selectedNodesData.length <= 1 || validationResult.isValid) {
      // Solo resetear si todos los nodos son consistentes o hay 1 o menos nodos
      setHasShownInconsistencyWarning(false);
    }
  }, [selectedNodes, validationResult]);

  // Validar formulario
  const isFormValid = () => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    const hasNodes = selectedNodesData.length > 0;
    const hasAssignedTipos = assignedSensorTypes.length > 0;
    const hasMetricas = formData.metricasData.some(metrica => {
      if (!metrica.selected) return false;
      return Object.values(metrica.umbralesPorTipo).some(umbral => 
        umbral && umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
      );
    });
    const hasValidNodeTypes = validationResult.isValid;
    
    return formData.fundoid && 
           formData.entidadid && 
           hasNodes && 
           hasAssignedTipos && 
           hasMetricas &&
           hasValidNodeTypes;
  };

  // Validación mejorada para mostrar qué falta
  const validationErrors = [];
  if (!formData.fundoid) validationErrors.push('Fundo');
  if (!formData.entidadid) validationErrors.push('Entidad');
  const selectedNodesCount = selectedNodes.filter(node => node.selected).length;
  if (selectedNodesCount === 0) validationErrors.push('Nodos');
  if (assignedSensorTypes.length === 0) validationErrors.push('Tipos de sensores');
  const validMetricasCount = formData.metricasData.filter(m => 
    m.selected && Object.values(m.umbralesPorTipo).some(umbral => 
      umbral && umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
    )
  ).length;
  if (validMetricasCount === 0) validationErrors.push('Métricas con umbrales completos');

  return {
    validationResult,
    hasShownInconsistencyWarning,
    setHasShownInconsistencyWarning,
    isFormValid,
    validationErrors,
    selectedNodesCount,
    assignedTiposCount: assignedSensorTypes.length,
    validMetricasCount,
    totalCombinations: selectedNodesCount * assignedSensorTypes.length * validMetricasCount
  };
};

