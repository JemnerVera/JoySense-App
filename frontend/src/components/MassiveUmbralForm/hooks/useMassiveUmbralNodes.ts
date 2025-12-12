// ============================================================================
// HOOK: useMassiveUmbralNodes - Lógica de nodos y selección
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { SelectedNode, SelectedTipo } from '../types';

interface UseMassiveUmbralNodesProps {
  fundoid: number | null;
  entidadid: number | null;
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
}

export const useMassiveUmbralNodes = ({
  fundoid,
  entidadid,
  getUniqueOptionsForField
}: UseMassiveUmbralNodesProps) => {
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);
  const [allNodesSelected, setAllNodesSelected] = useState(false);
  const [assignedSensorTypes, setAssignedSensorTypes] = useState<SelectedTipo[]>([]);
  const [nodeSensorTypes, setNodeSensorTypes] = useState<{[nodoid: number]: SelectedTipo[]}>({});

  // Cargar nodos cuando se selecciona un fundo y entidad
  useEffect(() => {
    if (fundoid && entidadid) {
      // Obtener nodos que tienen sensor pero NO tienen metricasensor (para umbral)
      // Filtrar por fundo y entidad
      const nodosOptions = getUniqueOptionsForField('nodoid', { 
        fundoid: fundoid.toString(),
        entidadid: entidadid.toString()
      });
      const nodesData: SelectedNode[] = nodosOptions.map(option => ({
        nodoid: parseInt(option.value.toString()),
        nodo: option.label,
        selected: false,
        datecreated: option.datecreated || undefined,
        ubicacionid: option.ubicacionid || undefined
      }));
      setSelectedNodes(nodesData);
      setAllNodesSelected(false);
      setAssignedSensorTypes([]); // Limpiar tipos asignados
    } else {
      setSelectedNodes([]);
      setAllNodesSelected(false);
      setAssignedSensorTypes([]);
    }
  }, [fundoid, entidadid, getUniqueOptionsForField]);

  // Manejar selección de nodos
  const handleNodeSelection = (nodoid: number, selected: boolean) => {
    setSelectedNodes(prev =>
      prev.map(node =>
        node.nodoid === nodoid ? { ...node, selected } : node
      )
    );
  };

  // Manejar selección de todos los nodos
  const handleSelectAllNodes = (selected: boolean) => {
    setSelectedNodes(prev =>
      prev.map(node => ({ ...node, selected }))
    );
    setAllNodesSelected(selected);
  };

  // Actualizar estado de "seleccionar todo" cuando cambian las selecciones individuales
  useEffect(() => {
    if (selectedNodes.length > 0) {
      const allSelected = selectedNodes.every(node => node.selected);
      setAllNodesSelected(allSelected);
    } else {
      setAllNodesSelected(false);
    }
  }, [selectedNodes]);

  // Cargar tipos de sensores asignados cuando se seleccionan nodos y entidad
  useEffect(() => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length > 0 && entidadid) {
      // Obtener tipos de sensores específicos para los nodos seleccionados
      const nodoIds = selectedNodesData.map(node => node.nodoid);
      
      // Obtener tipos de sensores filtrados por los nodos seleccionados y entidad
      const tiposOptions = getUniqueOptionsForField('tipoid', { 
        entidadid: entidadid.toString(),
        nodoids: nodoIds // Filtrar por nodos específicos
      });
      
      const assignedTypes: SelectedTipo[] = tiposOptions.map(option => ({
        tipoid: parseInt(option.value.toString()),
        tipo: option.label,
        selected: true // Todos los tipos asignados están siempre seleccionados (solo lectura)
      }));

      setAssignedSensorTypes(assignedTypes);
      
      // Cargar tipos de sensores por nodo individual para validación
      const nodeTypesMap: {[nodoid: number]: SelectedTipo[]} = {};
      for (const node of selectedNodesData) {
        const nodeTiposOptions = getUniqueOptionsForField('tipoid', {
          entidadid: entidadid.toString(),
          nodoids: [node.nodoid]
        });
        
        nodeTypesMap[node.nodoid] = nodeTiposOptions.map(option => ({
          tipoid: parseInt(option.value.toString()),
          tipo: option.label,
          selected: true
        }));
      }
      
      setNodeSensorTypes(nodeTypesMap);
    } else {
      setAssignedSensorTypes([]);
      setNodeSensorTypes({});
    }
  }, [selectedNodes, entidadid, getUniqueOptionsForField]);

  // Obtener nodos seleccionados
  const getSelectedNodes = () => {
    return selectedNodes.filter(node => node.selected);
  };

  return {
    selectedNodes,
    allNodesSelected,
    assignedSensorTypes,
    nodeSensorTypes,
    handleNodeSelection,
    handleSelectAllNodes,
    getSelectedNodes
  };
};

