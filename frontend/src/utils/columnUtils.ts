/**
 * Utilidades para manejo de columnas en tablas
 * Funciones puras para calcular columnas visibles y reordenarlas
 */

import type { ColumnInfo } from '../types/systemParameters';

/**
 * Filtra columnas según la tabla seleccionada
 */
export const filterColumnsByTable = (
  columns: ColumnInfo[],
  tableName: string,
  selectedContactType?: 'phone' | 'email' | null
): ColumnInfo[] => {
  if (!columns || columns.length === 0) {
    return [];
  }

  // Tablas con configuraciones específicas
  const tableColumnMaps: Record<string, string[]> = {
    'pais': ['pais', 'paisabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'empresa': ['paisid', 'empresa', 'empresabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'fundo': ['paisid', 'empresaid', 'fundo', 'fundoabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'ubicacion': ['paisid', 'empresaid', 'fundoid', 'ubicacion', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'entidad': ['entidad', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'metrica': ['metrica', 'unidad', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'tipo': ['tipo', 'statusid', 'entidadid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'localizacion': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'nodoid', 'latitud', 'longitud', 'referencia', 'statusid', 'entidadid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'sensor': ['nodoid', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'metricasensor': ['nodoid', 'metricaid', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'umbral': ['ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'umbral', 'maximo', 'minimo', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'perfilumbral': ['perfilid', 'umbralid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'audit_log_umbral': ['auditid', 'umbralid', 'old_minimo', 'new_minimo', 'old_maximo', 'new_maximo', 'old_criticidadid', 'new_criticidadid', 'modified_by', 'modified_at', 'accion'],
    'criticidad': ['criticidad', 'grado', 'frecuencia', 'escalamiento', 'escalon', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'usuario': ['login', 'firstname', 'lastname', 'email', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'perfil': ['perfil', 'nivel', 'jefeid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'usuarioperfil': ['usuarioid', 'perfilid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'mensaje': ['alertaid', 'contactoid', 'mensaje', 'fecha', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'alerta': ['umbralid', 'medicionid', 'fecha', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
    'perfil_geografia_permiso': ['permisoid', 'perfilid', 'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'puede_ver', 'puede_insertar', 'puede_actualizar', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'],
  };

  // Caso especial para nodo
  if (tableName === 'nodo') {
    return columns.filter(col => 
      ['nodo', 'deveui', 'statusid', 'appeui', 'appkey', 'atpin', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)
    );
  }

  // Caso especial para contacto
  if (tableName === 'contacto') {
    if (selectedContactType === 'email') {
      return columns.filter(col => 
        ['usuarioid', 'correo', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)
      );
    } else {
      return columns.filter(col => 
        ['usuarioid', 'celular', 'codigotelefonoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)
      );
    }
  }

  // Para tablas con configuración específica
  if (tableColumnMaps[tableName]) {
    return columns.filter(col => tableColumnMaps[tableName].includes(col.columnName));
  }

  // Para cualquier otra tabla, incluir campos de auditoría y campos que no terminen en 'id' (excepto los especiales)
  return columns.filter(col => 
    !col.columnName.endsWith('id') || 
    col.columnName === 'usercreatedid' || 
    col.columnName === 'statusid' || 
    col.columnName === 'usermodifiedid' || 
    col.columnName === 'datecreated' || 
    col.columnName === 'datemodified'
  );
};

/**
 * Inyecta columnas faltantes para formularios (como paisid en fundo)
 */
export const injectMissingColumns = (
  columns: ColumnInfo[],
  tableName: string
): ColumnInfo[] => {
  const injected = [...columns];

  if (tableName === 'fundo') {
    if (!injected.some(col => col.columnName === 'paisid')) {
      injected.unshift({
        columnName: 'paisid',
        dataType: 'integer',
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: true,
        defaultValue: null
      } as ColumnInfo);
    }
  }

  if (tableName === 'ubicacion') {
    if (!injected.some(col => col.columnName === 'paisid')) {
      injected.unshift({
        columnName: 'paisid',
        dataType: 'integer',
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: true,
        defaultValue: null
      } as ColumnInfo);
    }
    if (!injected.some(col => col.columnName === 'empresaid')) {
        injected.unshift({
          columnName: 'empresaid',
          dataType: 'integer',
          isNullable: false,
          isIdentity: false,
          isPrimaryKey: false,
          isForeignKey: true,
          defaultValue: null
        } as ColumnInfo);
    }
  }

  if (tableName === 'localizacion') {
    ['paisid', 'empresaid', 'fundoid'].forEach(colName => {
      if (!injected.some(col => col.columnName === colName)) {
        injected.unshift({
          columnName: colName,
          dataType: 'integer',
          isNullable: false,
          isIdentity: false,
          isPrimaryKey: false,
          isForeignKey: true,
          defaultValue: null
        } as ColumnInfo);
      }
    });
  }

  return injected;
};

/**
 * Reordena columnas según reglas específicas por tabla
 */
export const reorderColumns = (
  columns: ColumnInfo[],
  tableName: string,
  forTable: boolean = true
): ColumnInfo[] => {
  const statusColumn = columns.find(col => col.columnName === 'statusid');
  const auditColumns = columns.filter(col => 
    ['usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)
  );
  const otherColumns = columns.filter(col => 
    !['statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)
  );

  const reordered: ColumnInfo[] = [];

  // Caso especial para nodo
  if (tableName === 'nodo') {
    reordered.push(...otherColumns.filter(col => ['nodo', 'deveui'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['appeui', 'appkey', 'atpin'].includes(col.columnName)));
    reordered.push(...auditColumns);
    if (statusColumn) reordered.push(statusColumn);
    return reordered;
  }

  // Reordenamiento específico por tabla
  if (tableName === 'pais') {
    reordered.push(...otherColumns.filter(col => ['pais'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['paisabrev'].includes(col.columnName)));
  } else if (tableName === 'empresa') {
    reordered.push(...otherColumns.filter(col => ['paisid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['empresa'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['empresabrev'].includes(col.columnName)));
  } else if (tableName === 'fundo') {
    if (forTable) {
      // Para tabla: Empresa, Fundo, Abreviatura
      reordered.push(...otherColumns.filter(col => ['empresaid'].includes(col.columnName)));
      reordered.push(...otherColumns.filter(col => ['fundo'].includes(col.columnName)));
      reordered.push(...otherColumns.filter(col => ['fundoabrev'].includes(col.columnName)));
    } else {
      // Para formulario: País, Empresa, Fundo, Abreviatura
      reordered.push(...otherColumns.filter(col => ['paisid'].includes(col.columnName)));
      reordered.push(...otherColumns.filter(col => ['empresaid'].includes(col.columnName)));
      reordered.push(...otherColumns.filter(col => ['fundo'].includes(col.columnName)));
      reordered.push(...otherColumns.filter(col => ['fundoabrev'].includes(col.columnName)));
    }
  } else if (tableName === 'ubicacion') {
    reordered.push(...otherColumns.filter(col => ['fundoid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['ubicacion'].includes(col.columnName)));
  } else if (tableName === 'localizacion') {
    reordered.push(...otherColumns.filter(col => ['entidadid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['ubicacionid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['latitud', 'longitud', 'referencia'].includes(col.columnName)));
  } else if (tableName === 'tipo') {
    reordered.push(...otherColumns.filter(col => ['entidadid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['tipo'].includes(col.columnName)));
  } else if (tableName === 'metricasensor') {
    if (forTable) {
      // Para tabla agrupada: Nodo, Tipos, Metricas
      reordered.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));
      // Agregar columnas virtuales
      reordered.push({
        columnName: 'tipos',
        dataType: 'varchar',
        isNullable: true,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null
      } as ColumnInfo);
      reordered.push({
        columnName: 'metricas',
        dataType: 'varchar',
        isNullable: true,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null
      } as ColumnInfo);
    } else {
      // Para Estado desagregado: mantener orden original
      reordered.push(...otherColumns);
    }
  } else if (tableName === 'sensor') {
    if (forTable) {
      // Para tabla agrupada: Nodo, Tipos
      reordered.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));
      reordered.push({
        columnName: 'tipos',
        dataType: 'varchar',
        isNullable: true,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null
      } as ColumnInfo);
    } else {
      // Para Estado desagregado: mantener orden original
      reordered.push(...otherColumns);
    }
  } else if (tableName === 'usuarioperfil') {
    if (forTable) {
      // Para tabla agrupada: Usuario, Perfiles
      reordered.push({
        columnName: 'usuario',
        dataType: 'varchar',
        isNullable: true,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null
      } as ColumnInfo);
      reordered.push({
        columnName: 'perfiles',
        dataType: 'varchar',
        isNullable: true,
        isIdentity: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null
      } as ColumnInfo);
    } else {
      // Para Estado desagregado: mantener orden original
      reordered.push(...otherColumns);
    }
  } else if (tableName === 'umbral') {
    reordered.push(...otherColumns.filter(col => ['ubicacionid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['tipoid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['metricaid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['minimo'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['maximo'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['criticidadid'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['umbral'].includes(col.columnName)));
  } else if (tableName === 'usuario') {
    reordered.push(...otherColumns.filter(col => ['login'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['firstname'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['lastname'].includes(col.columnName)));
    reordered.push(...otherColumns.filter(col => ['email'].includes(col.columnName)));
  } else {
    // Para otras tablas, mantener orden original
    reordered.push(...otherColumns);
  }

  // Agregar columnas de auditoría
  reordered.push(...auditColumns);

  // Agregar status al final
  if (statusColumn) {
    reordered.push(statusColumn);
  }

  return reordered;
};

/**
 * Calcula las columnas visibles para una tabla
 */
export const getVisibleColumns = (
  columns: ColumnInfo[],
  tableName: string,
  forTable: boolean = true,
  selectedContactType?: 'phone' | 'email' | null
): ColumnInfo[] => {
  if (!columns || columns.length === 0) {
    return [];
  }

  // 1. Filtrar columnas según la tabla
  let filtered = filterColumnsByTable(columns, tableName, selectedContactType);

  // 2. Para formularios (Crear/Actualizar), excluir permisoid de perfil_geografia_permiso
  if (!forTable && tableName === 'perfil_geografia_permiso') {
    filtered = filtered.filter(col => col.columnName !== 'permisoid');
  }

  // 3. Inyectar columnas faltantes (solo para formularios)
  if (!forTable) {
    filtered = injectMissingColumns(filtered, tableName);
  }

  // 4. Reordenar columnas
  const reordered = reorderColumns(filtered, tableName, forTable);

  return reordered;
};

