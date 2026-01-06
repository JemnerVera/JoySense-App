// ============================================================================
// UTILITY: getUniqueOptionsForField - Obtener opciones únicas para campos de formulario
// ============================================================================

interface RelatedData {
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  localizacionesData?: any[];
  entidadesData?: any[];
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  criticidadesData?: any[];
  perfilesData?: any[];
  userData?: any[];
  sensorsData?: any[];
  codigotelefonosData?: any[];
  canalesData?: any[];
  [key: string]: any[] | undefined;
}

interface GetUniqueOptionsForFieldParams {
  columnName: string;
  selectedTable: string;
  relatedDataForStatus: RelatedData;
}

export const getUniqueOptionsForField = ({
  columnName,
  selectedTable,
  relatedDataForStatus
}: GetUniqueOptionsForFieldParams): Array<{ value: any; label: string }> => {
  
  // Caso especial para jefeid en tabla perfil: mostrar "nivel - perfil"
  if (columnName === 'jefeid' && selectedTable === 'perfil') {
    const perfiles = relatedDataForStatus.perfilesData || [];
    return perfiles
      .filter((p: any) => p.statusid === 1) // Solo perfiles activos
      .map((item: any) => ({
        value: item.perfilid,
        label: `${item.nivel} - ${item.perfil}` || `ID: ${item.perfilid}`
      }))
      .sort((a: any, b: any) => {
        // Ordenar por nivel ascendente, luego por nombre
        const nivelA = parseInt(a.label.split(' - ')[0]) || 999;
        const nivelB = parseInt(b.label.split(' - ')[0]) || 999;
        if (nivelA !== nivelB) return nivelA - nivelB;
        return a.label.localeCompare(b.label);
      });
  }
  
  // Mapeo de campos a tablas relacionadas
  const fieldToTableMap: Record<string, { table: string; key: string; label: string | string[] }> = {
    'paisid': { table: 'paisesData', key: 'paisid', label: 'pais' },
    'empresaid': { table: 'empresasData', key: 'empresaid', label: 'empresa' },
    'fundoid': { table: 'fundosData', key: 'fundoid', label: 'fundo' },
    'ubicacionid': { table: 'ubicacionesData', key: 'ubicacionid', label: 'ubicacion' },
    'localizacionid': { table: 'localizacionesData', key: 'localizacionid', label: 'localizacion' },
    'entidadid': { table: 'entidadesData', key: 'entidadid', label: 'entidad' },
    'nodoid': { table: 'nodosData', key: 'nodoid', label: 'nodo' },
    'tipoid': { table: 'tiposData', key: 'tipoid', label: 'tipo' },
    'metricaid': { table: 'metricasData', key: 'metricaid', label: 'metrica' },
    'criticidadid': { table: 'criticidadesData', key: 'criticidadid', label: 'criticidad' },
    'perfilid': { table: 'perfilesData', key: 'perfilid', label: 'perfil' },
    'usuarioid': { table: 'userData', key: 'usuarioid', label: ['firstname', 'lastname'] },
    'sensorid': { table: 'sensorsData', key: 'sensorid', label: 'sensorid' },
    'codigotelefonoid': { table: 'codigotelefonosData', key: 'codigotelefonoid', label: 'paistelefono' },
    'canalid': { table: 'canalesData', key: 'canalid', label: 'canal' }
  };

  const mapping = fieldToTableMap[columnName];
  if (!mapping) {
    return [];
  }

  const data = relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus] as any[];
  if (!data) {
    return [];
  }

  // Filtrar por statusid = 1 (activos) para campos de selección
  // Esto asegura que solo se muestren opciones activas en los dropdowns
  const activeData = data.filter((item: any) => {
    // Para campos que tienen statusid, solo mostrar activos
    if (item.statusid !== undefined) {
      return item.statusid === 1;
    }
    // Si no tiene statusid, incluir todos
    return true;
  });

  return activeData.map((item: any) => {
    let label = '';
    if (Array.isArray(mapping.label)) {
      // Para otros campos con múltiples labels, concatenar con espacio
      label = mapping.label.map(l => item[l]).filter(Boolean).join(' ');
    } else {
      // Para sensorid, mostrar solo el ID ya que no hay campo descriptivo
      if (mapping.label === 'sensorid') {
        label = `ID: ${item[mapping.key]}`;
      } else {
        label = item[mapping.label] || '';
      }
    }
    return {
      value: item[mapping.key],
      label: label || `ID: ${item[mapping.key]}`
    };
  });
};

