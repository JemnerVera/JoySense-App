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
  carpetasData?: any[];
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
  reglasData?: any[];
  [key: string]: any[] | undefined;
}

interface GetUniqueOptionsForFieldParams {
  columnName: string;
  selectedTable: string;
  relatedDataForStatus: RelatedData;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  ubicacionSeleccionada?: any | null;
  localizacionSeleccionada?: any | null;
}

export const getUniqueOptionsForField = ({
  columnName,
  selectedTable,
  relatedDataForStatus,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  ubicacionSeleccionada,
  localizacionSeleccionada
}: GetUniqueOptionsForFieldParams): Array<{ value: any; label: string }> => {
  
  const empresas = relatedDataForStatus.empresasData || [];
  const fundos = relatedDataForStatus.fundosData || [];
  const ubicaciones = relatedDataForStatus.ubicacionesData || [];
  const nodos = relatedDataForStatus.nodosData || [];
  const localizaciones = relatedDataForStatus.localizacionesData || [];

  const getEmpresasIdsPorPais = (paisId: string): string[] => 
    empresas.filter(e => e.paisid?.toString() === paisId).map(e => e.empresaid?.toString());

  const getFundosIdsPorEmpresa = (empresaId: string): string[] => 
    fundos.filter(f => f.empresaid?.toString() === empresaId).map(f => f.fundoid?.toString());

  const getUbicacionesIdsPorFundo = (fundoId: string): string[] => 
    ubicaciones.filter(u => u.fundoid?.toString() === fundoId).map(u => u.ubicacionid?.toString());

  const getNodosIdsPorUbicacion = (ubicacionId: string): string[] => 
    nodos.filter(n => n.ubicacionid?.toString() === ubicacionId).map(n => n.nodoid?.toString());

  const getLocalizacionesIdsPorNodo = (nodoId: string): string[] => 
    localizaciones.filter(l => l.nodoid?.toString() === nodoId).map(l => l.localizacionid?.toString());

  const getLocalizacionesIdsPorUbicacion = (ubicacionId: string): string[] => 
    localizaciones.filter(l => l.ubicacionid?.toString() === ubicacionId).map(l => l.localizacionid?.toString());

  // Función helper para filtrar datos según filtros globales
  const filterDataByGlobalFilters = (data: any[], idField: string): any[] => {
    if (!data) return [];
    
    return data.filter((item: any) => {
      const idValue = item[idField]?.toString();
      if (!idValue) return false;

      if (columnName === 'empresaid' && paisSeleccionado) {
        return item.paisid?.toString() === paisSeleccionado;
      }
      if (columnName === 'fundoid' && empresaSeleccionada) {
        return item.empresaid?.toString() === empresaSeleccionada;
      }
      if (columnName === 'fundoid' && paisSeleccionado && !empresaSeleccionada) {
        const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
        return empresaIds.includes(item.empresaid?.toString());
      }
      if (columnName === 'ubicacionid' && fundoSeleccionado) {
        return item.fundoid?.toString() === fundoSeleccionado;
      }
      if (columnName === 'ubicacionid' && empresaSeleccionada && !fundoSeleccionado) {
        const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
        return fundoIds.includes(item.fundoid?.toString());
      }
      if (columnName === 'ubicacionid' && paisSeleccionado && !empresaSeleccionada) {
        const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
        const fundoIds = empresaIds.flatMap(eid => getFundosIdsPorEmpresa(eid));
        return fundoIds.includes(item.fundoid?.toString());
      }
      if (columnName === 'nodoid' && ubicacionSeleccionada) {
        const ubiId = ubicacionSeleccionada.ubicacionid?.toString() || ubicacionSeleccionada.toString();
        return item.ubicacionid?.toString() === ubiId;
      }
      if (columnName === 'nodoid' && fundoSeleccionado && !ubicacionSeleccionada) {
        const ubiIds = getUbicacionesIdsPorFundo(fundoSeleccionado);
        return ubiIds.includes(item.ubicacionid?.toString());
      }
      if (columnName === 'nodoid' && empresaSeleccionada && !fundoSeleccionado) {
        const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
        const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
        return ubiIds.includes(item.ubicacionid?.toString());
      }
      if (columnName === 'localizacionid' && selectedTable === 'localizacion') {
        if (localizacionSeleccionada) {
          const locId = localizacionSeleccionada.localizacionid?.toString() || localizacionSeleccionada.toString();
          return item.localizacionid?.toString() === locId;
        }
        if (ubicacionSeleccionada) {
          const ubiId = ubicacionSeleccionada.ubicacionid?.toString() || ubicacionSeleccionada.toString();
          return item.ubicacionid?.toString() === ubiId;
        }
        if (fundoSeleccionado) {
          const ubiIds = getUbicacionesIdsPorFundo(fundoSeleccionado);
          return ubiIds.includes(item.ubicacionid?.toString());
        }
        if (empresaSeleccionada) {
          const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
          const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
          return ubiIds.includes(item.ubicacionid?.toString());
        }
        if (paisSeleccionado) {
          const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
          const fundoIds = empresaIds.flatMap(eid => getFundosIdsPorEmpresa(eid));
          const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
          return ubiIds.includes(item.ubicacionid?.toString());
        }
      }
      return true;
    });
  };
  
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

  // Caso especial para ubicacionid en tabla nodo: mostrar "FUNDO - UBICACION"
  if (columnName === 'ubicacionid' && selectedTable === 'nodo') {
    const ubicaciones = relatedDataForStatus.ubicacionesData || [];
    const fundos = relatedDataForStatus.fundosData || [];
    
    const fundosMap = new Map(fundos.map((f: any) => [f.fundoid, f.fundo]));
    
    return ubicaciones
      .filter((u: any) => u.statusid === 1)
      .map((item: any) => {
        const fundoName = fundosMap.get(item.fundoid) || '';
        const ubicacionName = item.ubicacion || '';
        const label = fundoName ? `${fundoName} - ${ubicacionName}` : ubicacionName || `ID: ${item.ubicacionid}`;
        return {
          value: item.ubicacionid,
          label: label
        };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }

  // Caso especial para nodoid en tabla localizacion: mostrar "FUNDO - UBICACION - NODO"
  if (columnName === 'nodoid' && selectedTable === 'localizacion') {
    const nodos = relatedDataForStatus.nodosData || [];
    const ubicaciones = relatedDataForStatus.ubicacionesData || [];
    const fundos = relatedDataForStatus.fundosData || [];
    
    const ubicacionesMap = new Map(ubicaciones.map((u: any) => [u.ubicacionid, { fundoid: u.fundoid, ubicacion: u.ubicacion }]));
    const fundosMap = new Map(fundos.map((f: any) => [f.fundoid, f.fundo]));
    
    return nodos
      .filter((n: any) => n.statusid === 1)
      .map((item: any) => {
        const ubicacionData = ubicacionesMap.get(item.ubicacionid);
        const fundoid = ubicacionData?.fundoid;
        const fundoName = fundoid ? fundosMap.get(fundoid) || '' : '';
        const ubicacionName = ubicacionData?.ubicacion || '';
        const nodoName = item.nodo || '';
        const label = fundoName && ubicacionName ? `${fundoName} - ${ubicacionName} - ${nodoName}` : nodoName || `ID: ${item.nodoid}`;
        return {
          value: item.nodoid,
          label: label
        };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
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

  // Caso especial para sensorid en tabla localizacion: mostrar "sensor - tipo"
  if (columnName === 'sensorid' && selectedTable === 'localizacion') {
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

  // Caso especial para localizacionid en tabla entidad: agrupar por nombre de localización
  // Mostrar solo UNA opción por localización única con todos los IDs de esa localización
  if (columnName === 'localizacionid' && selectedTable === 'entidad') {
    const localizaciones = relatedDataForStatus.localizacionesData || [];
    
    // Crear un mapa de nombres a IDs
    const localizacionesPorNombre = new Map<string, number[]>();
    
    localizaciones
      .filter((l: any) => l.statusid === 1) // Solo activas
      .forEach((item: any) => {
        const locName = item.localizacion || '';
        if (!localizacionesPorNombre.has(locName)) {
          localizacionesPorNombre.set(locName, []);
        }
        localizacionesPorNombre.get(locName)?.push(item.localizacionid);
      });
    
    // Convertir a opciones con un identificador único para cada nombre
    const options: Array<{ value: any; label: string; _allIds?: number[] }> = [];
    let optionIndex = 0;
    
    localizacionesPorNombre.forEach((ids, nombre) => {
      options.push({
        value: optionIndex, // Usar índice como identificador único
        label: nombre || 'Sin nombre',
        _allIds: ids // Adjuntar los IDs de todos los localizacionid para este nombre
      });
      optionIndex++;
    });
    
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }
  
  // Mapeo de campos a tablas relacionadas
  const fieldToTableMap: Record<string, { table: string; key: string; label: string | string[] }> = {
    'paisid': { table: 'paisesData', key: 'paisid', label: 'pais' },
    'empresaid': { table: 'empresasData', key: 'empresaid', label: 'empresa' },
    'fundoid': { table: 'fundosData', key: 'fundoid', label: 'fundo' },
    'ubicacionid': { table: 'ubicacionesData', key: 'ubicacionid', label: 'ubicacion' },
    'localizacionid': { table: 'localizacionesData', key: 'localizacionid', label: 'localizacion' },
    'entidadid': { table: 'entidadesData', key: 'entidadid', label: 'entidad' },
    'carpetaid': { table: 'carpetasData', key: 'carpetaid', label: 'carpeta' },
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
  let filteredByStatus = data.filter((item: any) => {
    // Para campos que tienen statusid, solo mostrar activos
    if (item.statusid !== undefined) {
      return item.statusid === 1;
    }
    // Si no tiene statusid, incluir todos
    return true;
  });

  // Aplicar filtros globales para campos de jerarquía geográfica
  const fieldsWithGlobalFilter = ['empresaid', 'fundoid', 'ubicacionid', 'nodoid', 'localizacionid'];
  if (fieldsWithGlobalFilter.includes(columnName)) {
    filteredByStatus = filterDataByGlobalFilters(filteredByStatus, mapping.key);
  }

  // Mapear a opciones y eliminar duplicados por value
  const optionsMap = new Map<any, { value: any; label: string }>();
  
  filteredByStatus.forEach((item: any) => {
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

