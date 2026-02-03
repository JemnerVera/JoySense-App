/**
 * Utilidades para filtrar nodos por filtros globales
 * Aplicable a todos los dashboards
 */

import { NodeData } from '../types/NodeData';

/**
 * Filtra nodos basado en los filtros globales del sidebar (país, empresa, fundo)
 * Estos filtros se aplican DESPUÉS de que el backend retorna los nodos autorizados por RLS
 * 
 * @param nodes - Array de nodos desde el backend (ya filtrados por RLS)
 * @param paisSeleccionado - ID del país seleccionado (string)
 * @param empresaSeleccionada - ID de la empresa seleccionada (string)
 * @param fundoSeleccionado - ID del fundo seleccionado (string)
 * @returns Array de nodos filtrados según los filtros globales
 */
export const filterNodesByGlobalFilters = (
  nodes: NodeData[] | any[],
  paisSeleccionado?: string,
  empresaSeleccionada?: string,
  fundoSeleccionado?: string
): NodeData[] | any[] => {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  let filtered = [...nodes];

  // Filtrar por país
  if (paisSeleccionado && paisSeleccionado !== '') {
    filtered = filtered.filter((node) => {
      const paisId = node.ubicacion?.fundo?.empresa?.pais?.paisid;
      return paisId?.toString() === paisSeleccionado;
    });
  }

  // Filtrar por empresa
  if (empresaSeleccionada && empresaSeleccionada !== '') {
    filtered = filtered.filter((node) => {
      const empresaId = node.ubicacion?.fundo?.empresa?.empresaid;
      return empresaId?.toString() === empresaSeleccionada;
    });
  }

  // Filtrar por fundo
  if (fundoSeleccionado && fundoSeleccionado !== '') {
    filtered = filtered.filter((node) => {
      const fundoId = node.ubicacion?.fundoid;
      return fundoId?.toString() === fundoSeleccionado;
    });
  }

  return filtered;
};

/**
 * Hook para usar los filtros globales y aplicarlos a nodos
 * Retorna una función que filtra nodos considerando los filtros actuales
 */
export const getNodeFilterFn = (
  paisSeleccionado?: string,
  empresaSeleccionada?: string,
  fundoSeleccionado?: string
) => {
  return (node: NodeData | any): boolean => {
    // Filtrar por país
    if (paisSeleccionado && paisSeleccionado !== '') {
      const paisId = node.ubicacion?.fundo?.empresa?.pais?.paisid;
      if (paisId?.toString() !== paisSeleccionado) {
        return false;
      }
    }

    // Filtrar por empresa
    if (empresaSeleccionada && empresaSeleccionada !== '') {
      const empresaId = node.ubicacion?.fundo?.empresa?.empresaid;
      if (empresaId?.toString() !== empresaSeleccionada) {
        return false;
      }
    }

    // Filtrar por fundo
    if (fundoSeleccionado && fundoSeleccionado !== '') {
      const fundoId = node.ubicacion?.fundoid;
      if (fundoId?.toString() !== fundoSeleccionado) {
        return false;
      }
    }

    return true;
  };
};
