
interface UseMultipleSelectionProps {
  selectedTable: string;
  searchByCriteria: any;
}

export const useMultipleSelection = (selectedTable: string, searchByCriteria: any) => {
  const findTimestampBySecondsMatches = (row: any, allData: any[]) => {
    if (!row.datecreated) return [];

    const rowDate = new Date(row.datecreated);
    const rowSeconds = Math.floor(rowDate.getTime() / 1000);

    return allData.filter(dataRow => {
      if (!dataRow.datecreated) return false;
      const dataDate = new Date(dataRow.datecreated);
      const dataSeconds = Math.floor(dataDate.getTime() / 1000);
      return dataSeconds === rowSeconds;
    });
  };

  const findNearTimestampMatches = (row: any, allData: any[], toleranceMs: number) => {
    if (!row.datecreated) return [];

    const rowTime = new Date(row.datecreated).getTime();

    return allData.filter(dataRow => {
      if (!dataRow.datecreated) return false;
      const dataTime = new Date(dataRow.datecreated).getTime();
      const timeDiff = Math.abs(rowTime - dataTime);
      return timeDiff <= toleranceMs;
    });
  };

  const findBusinessLogicMatches = (row: any, allData: any[]) => {
    const matches: any[] = [];

    // Para sensor: buscar por nodoid y tipoid
    if (selectedTable === 'sensor') {
      const sensorMatches = allData.filter(dataRow => 
        dataRow.nodoid === row.nodoid && dataRow.tipoid === row.tipoid
      );
      matches.push(...sensorMatches);
    }

    // Para metricasensor: buscar por nodoid, tipoid y metricaid
    if (selectedTable === 'metricasensor') {
      const metricaMatches = allData.filter(dataRow => 
        dataRow.nodoid === row.nodoid && 
        dataRow.tipoid === row.tipoid && 
        dataRow.metricaid === row.metricaid
      );
      matches.push(...metricaMatches);
    }

    // Para usuarioperfil: buscar por usuarioid y perfilid
    if (selectedTable === 'usuarioperfil') {
      const perfilMatches = allData.filter(dataRow => 
        dataRow.usuarioid === row.usuarioid && dataRow.perfilid === row.perfilid
      );
      matches.push(...perfilMatches);
    }

    // Para umbral: buscar por nodoid, tipoid, metricaid y criticidadid
    if (selectedTable === 'umbral') {
      const umbralMatches = allData.filter(dataRow => 
        dataRow.nodoid === row.nodoid && 
        dataRow.tipoid === row.tipoid && 
        dataRow.metricaid === row.metricaid &&
        dataRow.criticidadid === row.criticidadid
      );
      matches.push(...umbralMatches);
    }

    return matches;
  };

  const findBusinessCriteriaMatches = (row: any, allData: any[]) => {
    const matches: any[] = [];

    const normalizeDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch {
        return dateString;
      }
    };

    // Buscar por criterios de negocio específicos
    if (selectedTable === 'sensor') {
      // Buscar sensores del mismo nodo y tipo
      const sameNodeType = allData.filter(dataRow => 
        dataRow.nodoid === row.nodoid && dataRow.tipoid === row.tipoid
      );
      matches.push(...sameNodeType);

      // Buscar sensores creados en la misma fecha
      if (row.datecreated) {
        const sameDate = allData.filter(dataRow => 
          dataRow.datecreated && 
          normalizeDate(dataRow.datecreated) === normalizeDate(row.datecreated)
        );
        matches.push(...sameDate);
      }
    }

    if (selectedTable === 'metricasensor') {
      // Buscar métricas del mismo nodo, tipo y métrica
      const sameNodeTypeMetric = allData.filter(dataRow => 
        dataRow.nodoid === row.nodoid && 
        dataRow.tipoid === row.tipoid && 
        dataRow.metricaid === row.metricaid
      );
      matches.push(...sameNodeTypeMetric);
    }

    if (selectedTable === 'usuarioperfil') {
      // Buscar perfiles del mismo usuario
      const sameUser = allData.filter(dataRow => 
        dataRow.usuarioid === row.usuarioid
      );
      matches.push(...sameUser);

      // Buscar perfiles del mismo tipo
      const sameProfile = allData.filter(dataRow => 
        dataRow.perfilid === row.perfilid
      );
      matches.push(...sameProfile);
    }

    return matches;
  };

  const findEntriesByTimestamp = (row: any, tableData: any[], updateData: any[]) => {
    console.log('🔍 findEntriesByTimestamp called:', {
      selectedTable,
      rowId: row.nodoid || row.usuarioid || 'unknown',
      tableDataLength: tableData.length,
      updateDataLength: updateData.length
    });

    const allData = [...tableData, ...updateData];

    // 1. Buscar por timestamp exacto (mismo segundo)
    const exactMatches = findTimestampBySecondsMatches(row, allData);
    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // 2. Buscar por timestamp cercano (dentro de 5 segundos)
    const nearMatches = findNearTimestampMatches(row, allData, 5000);
    if (nearMatches.length > 0) {
      return nearMatches;
    }

    // 3. Buscar por lógica de negocio
    const businessMatches = findBusinessLogicMatches(row, allData);
    if (businessMatches.length > 0) {
      return businessMatches;
    }

    // 4. Buscar por criterios de negocio
    const criteriaMatches = findBusinessCriteriaMatches(row, allData);
    if (criteriaMatches.length > 0) {
      return criteriaMatches;
    }

    // 5. Si no hay matches, usar searchByCriteria como fallback
    if (searchByCriteria) {
      const searchMatches = allData.filter((dataRow: any) => {
        return searchByCriteria(dataRow, row);
      });
      
      if (searchMatches.length > 0) {
        return searchMatches;
      }
    }

    return [row];
  };

  return { findEntriesByTimestamp };
};
