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
  contactosData?: any[];
  umbralesData?: any[];
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

  // Caso especial para sensorid en tabla metricasensor: mostrar "sensor - tipo"
  if (columnName === 'sensorid' && selectedTable === 'metricasensor') {
    const sensors = relatedDataForStatus.sensorsData || [];
    const tipos = relatedDataForStatus.tiposData || [];
    
    // Crear un mapa de tipos por tipoid para búsqueda rápida
    const tiposMap = new Map(tipos.map((t: any) => [t.tipoid, t.tipo]));
    
    return sensors
      .filter((s: any) => s.statusid === 1) // Solo sensores activos
      .map((item: any) => {
        const sensorName = item.sensor || '';
        const tipoName = tiposMap.get(item.tipoid) || '';
        const label = tipoName ? `${sensorName} - ${tipoName}` : sensorName || `ID: ${item.sensorid}`;
        return {
          value: item.sensorid,
          label: label
        };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }

  // Caso especial para usuarioid en tabla contacto: solo mostrar usuarios que NO tienen contacto
  if (columnName === 'usuarioid' && selectedTable === 'contacto') {
    const usuarios = relatedDataForStatus.userData || [];
    const contactos = relatedDataForStatus.contactosData || [];
    
    // Obtener IDs de usuarios que ya tienen contacto (activo o inactivo)
    const usuariosConContacto = new Set(
      contactos.map((c: any) => Number(c.usuarioid))
    );
    
    // Filtrar usuarios que NO tienen contacto
    const usuariosSinContacto = usuarios.filter((u: any) => {
      const usuarioidNum = Number(u.usuarioid);
      return !usuariosConContacto.has(usuarioidNum);
    });
    
    return usuariosSinContacto.map((item: any) => {
      const labelFields = ['firstname', 'lastname'];
      const label = labelFields.map(l => item[l]).filter(Boolean).join(' ');
      return {
        value: item.usuarioid,
        label: label || `Usuario ${item.usuarioid}`
      };
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
    'sensorid': { table: 'sensorsData', key: 'sensorid', label: 'sensor' },
    'codigotelefonoid': { table: 'codigotelefonosData', key: 'codigotelefonoid', label: 'paistelefono' },
    'canalid': { table: 'canalesData', key: 'canalid', label: 'canal' },
    'umbralid': { table: 'umbralesData', key: 'umbralid', label: 'umbral' },
    'reglaid': { table: 'reglasData', key: 'reglaid', label: 'nombre' }
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

  // Mapear a opciones y eliminar duplicados por value
  const optionsMap = new Map<any, { value: any; label: string }>();
  
  activeData.forEach((item: any) => {
    let label = '';
    if (Array.isArray(mapping.label)) {
      // Para otros campos con múltiples labels, concatenar con espacio
      label = mapping.label.map(l => item[l]).filter(Boolean).join(' ');
    } else {
      // Para sensorid, mostrar el nombre del sensor
      label = item[mapping.label] || '';
    }
    
    const value = item[mapping.key];
    const finalLabel = label || `ID: ${value}`;
    
    // Solo agregar si no existe ya (evitar duplicados por value)
    if (!optionsMap.has(value)) {
      optionsMap.set(value, {
        value: value,
        label: finalLabel
      });
    }
  });
  
  // Convertir Map a Array y ordenar por label
  const options = Array.from(optionsMap.values()).sort((a, b) => {
    return a.label.localeCompare(b.label);
  });
  
  return options;
};

