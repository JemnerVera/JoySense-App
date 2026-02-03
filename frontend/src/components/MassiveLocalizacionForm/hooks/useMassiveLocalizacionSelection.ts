// ============================================================================
// HOOK: useMassiveLocalizacionSelection
// Maneja la selección de nodos y localizaciones
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { SelectedNodo, SelectedLocalizacion } from '../types';
import { JoySenseService } from '../../../services/backend-api';

interface UseMassiveLocalizacionSelectionProps {
  nodoid: number | null;
  localizacionid: number | null;
}

export const useMassiveLocalizacionSelection = ({
  nodoid,
  localizacionid
}: UseMassiveLocalizacionSelectionProps) => {
  const [selectedNodo, setSelectedNodo] = useState<SelectedNodo | null>(null);
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<SelectedLocalizacion | null>(null);
  const [nodosData, setNodosData] = useState<any[]>([]);

  // Cargar todos los nodos al montar
  useEffect(() => {
    const loadNodos = async () => {
      try {
        const nodos = await JoySenseService.getTableData('nodo', 1000);
        setNodosData(nodos || []);
      } catch (error) {
        console.error('Error cargando nodos:', error);
        setNodosData([]);
      }
    };
    loadNodos();
  }, []);

  const handleNodoSelection = useCallback((nodoid: number | null) => {
    if (nodoid === null) {
      setSelectedNodo(null);
      setSelectedLocalizacion(null);
      return;
    }

    // Convertir a número en caso de que sea objeto
    const nodoidNum = typeof nodoid === 'object' && nodoid !== null ? (nodoid as any).value : nodoid;
    const parsedNodoid = nodoidNum ? parseInt(nodoidNum.toString()) : null;

    if (!parsedNodoid) {
      setSelectedNodo(null);
      return;
    }

    // Buscar el nodo en los datos cargados
    const nodoData = nodosData.find((n: any) => n.nodoid === parsedNodoid);
    
    if (nodoData) {
      setSelectedNodo({
        nodoid: parsedNodoid,
        nodo: nodoData.nodo || `Nodo ${parsedNodoid}`,
        selected: true,
        ubicacionid: nodoData.ubicacionid
      });
      setSelectedLocalizacion(null);
    }
  }, [nodosData]);

  const handleLocalizacionSelection = useCallback((localizacionid: number | null) => {
    if (localizacionid === null) {
      setSelectedLocalizacion(null);
      return;
    }

    if (!selectedNodo) return;

    // No necesitamos hacer lookup de localizaciones
    // Ya que el usuario ingresa el nombre directamente
  }, [selectedNodo]);

  return {
    selectedNodo,
    selectedLocalizacion,
    handleNodoSelection,
    handleLocalizacionSelection
  };
};
