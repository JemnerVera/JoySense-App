import { useCallback } from 'react';

interface UseReglasValidationProps {
  crudRelatedData: any;
  criticidadesData: any[];
  umbralesData: any[];
}

export function useReglasValidation({
  crudRelatedData,
  criticidadesData,
  umbralesData
}: UseReglasValidationProps) {

  const getUniqueOptionsForField = useCallback((columnName: string): Array<{value: any, label: string}> => {
    // Buscar en crudRelatedData primero
    let relatedTable = crudRelatedData[columnName.replace('id', '')] ||
                       crudRelatedData[columnName] || [];

    // Si no se encuentra, buscar en criticidadesData (para criticidadid)
    if ((!Array.isArray(relatedTable) || relatedTable.length === 0) && columnName === 'criticidadid') {
      relatedTable = criticidadesData || [];
    }

    // Si no se encuentra, buscar en umbralesData (para umbralid)
    if ((!Array.isArray(relatedTable) || relatedTable.length === 0) && columnName === 'umbralid') {
      relatedTable = umbralesData || [];
    }

    if (!Array.isArray(relatedTable) || relatedTable.length === 0) {
      return [];
    }

    return relatedTable.map((item: any) => {
      const value = item[columnName] || item[`${columnName.replace('id', '')}id`];
      let label = '';

      if (columnName === 'criticidadid') {
        label = item.criticidad || `Criticidad ${value}`;
      } else if (columnName === 'perfilid') {
        label = item.perfil || `Perfil ${value}`;
      } else if (columnName === 'umbralid') {
        label = item.umbral || `Umbral ${value}`;
      } else {
        label = String(value);
      }

      return { value, label };
    });
  }, [crudRelatedData, criticidadesData, umbralesData]);

  return {
    getUniqueOptionsForField
  };
}