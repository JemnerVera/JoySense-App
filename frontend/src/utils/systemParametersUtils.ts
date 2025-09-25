/**
 * Utilidades puras para SystemParameters
 * Funciones sin estado ni efectos secundarios que pueden ser reutilizadas
 */

// Tipos para las funciones de utilidad
export interface RelatedData {
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  entidadesData?: any[];
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  localizacionesData?: any[];
  criticidadesData?: any[];
  perfilesData?: any[];
  umbralesData?: any[];
  userData?: any[];
  mediosData?: any[];
}

/**
 * Obtiene el nombre de display para una columna
 */
export const getColumnDisplayName = (columnName: string): string => {
  const columnMappings: Record<string, string> = {
    'paisid': 'País',
    'empresaid': 'Empresa',
    'fundoid': 'Fundo',
    'ubicacionid': 'Ubicación',
    'entidadid': 'Entidad',
    'nodoid': 'Nodo',
    'tipoid': 'Tipo',
    'metricaid': 'Métrica',
    'tipos': 'Tipo',
    'metricas': 'Métrica',
    'localizacionid': 'Localización',
    'criticidadid': 'Criticidad',
    'perfilid': 'Perfil',
    'umbralid': 'Umbral',
    'usuarioid': 'Usuario',
    'medioid': 'Medio',
    'paisabrev': 'Abreviatura',
    'empresabrev': 'Abreviatura',
    'empresaabrev': 'Abreviatura',
    'farmabrev': 'Abreviatura',
    'fundoabrev': 'Abreviatura',
    'ubicacionabrev': 'Abreviatura',
    'statusid': 'Status',
    'usercreatedid': 'Creado por',
    'usermodifiedid': 'Modificado por',
    'datecreated': 'Fecha de creación',
    'datemodified': 'Fecha de modificación',
    'modified_by': 'Modificado por',
    'pais': 'País',
    'empresa': 'Empresa',
    'fundo': 'Fundo',
    'ubicacion': 'Ubicación',
    'entidad': 'Entidad',
    'nodo': 'Nodo',
    'tipo': 'Tipo',
    'metrica': 'Métrica',
    'localizacion': 'Localización',
    'criticidad': 'Criticidad',
    'perfil': 'Perfil',
    'umbral': 'Umbral',
    'usuario': 'Usuario',
    'medio': 'Medio',
    'login': 'Login',
    'firstname': 'Nombre',
    'lastname': 'Apellido',
    'email': 'Email',
    'nombre': 'Nombre',
    'abreviatura': 'Abreviatura',
    'descripcion': 'Descripción',
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'valor_minimo': 'Valor Mínimo',
    'valor_maximo': 'Valor Máximo',
    'unidad': 'Unidad',
    'frecuencia': 'Frecuencia',
    'tolerancia': 'Tolerancia',
    'latitud': 'Latitud',
    'longitud': 'Longitud',
    'altitud': 'Altitud',
    'direccion': 'Dirección',
    'telefono': 'Teléfono',
    'contacto': 'Contacto',
    'observaciones': 'Observaciones',
    'fecha_inicio': 'Fecha de Inicio',
    'fecha_fin': 'Fecha de Fin',
    'estado': 'Estado',
    'tipo_sensor': 'Tipo de Sensor',
    'marca': 'Marca',
    'modelo': 'Modelo',
    'serie': 'Serie',
    'fecha_instalacion': 'Fecha de Instalación',
    'fecha_calibracion': 'Fecha de Calibración',
    'proxima_calibracion': 'Próxima Calibración',
    'rango_minimo': 'Rango Mínimo',
    'rango_maximo': 'Rango Máximo',
    'precision': 'Precisión',
    'resolucion': 'Resolución',
    'drift': 'Drift',
    'temperatura_operacion': 'Temperatura de Operación',
    'humedad_operacion': 'Humedad de Operación',
    'presion_operacion': 'Presión de Operación',
    'voltaje_operacion': 'Voltaje de Operación',
    'corriente_operacion': 'Corriente de Operación',
    'frecuencia_muestreo': 'Frecuencia de Muestreo',
    'tiempo_respuesta': 'Tiempo de Respuesta',
    'vida_util': 'Vida Útil',
    'costo': 'Costo',
    'proveedor': 'Proveedor',
    'garantia': 'Garantía',
    'manual': 'Manual',
    'certificado': 'Certificado',
    'calibracion': 'Calibración',
    'mantenimiento': 'Mantenimiento',
    'reparacion': 'Reparación',
    'reemplazo': 'Reemplazo',
    'disposicion': 'Disposición',
    'reciclaje': 'Reciclaje',
    'impacto_ambiental': 'Impacto Ambiental',
    'sostenibilidad': 'Sostenibilidad',
    'eficiencia_energetica': 'Eficiencia Energética',
    'huella_carbono': 'Huella de Carbono',
    'certificacion_iso': 'Certificación ISO',
    'certificacion_ce': 'Certificación CE',
    'certificacion_fcc': 'Certificación FCC',
    'certificacion_ul': 'Certificación UL',
    'certificacion_csa': 'Certificación CSA',
    'certificacion_iecex': 'Certificación IECEx',
    'certificacion_atex': 'Certificación ATEX',
    'certificacion_sil': 'Certificación SIL',
    'certificacion_ieee': 'Certificación IEEE',
    'certificacion_ansi': 'Certificación ANSI',
    'certificacion_astm': 'Certificación ASTM',
    'certificacion_din': 'Certificación DIN',
    'certificacion_bs': 'Certificación BS',
    'certificacion_jis': 'Certificación JIS',
    'certificacion_gb': 'Certificación GB',
    'certificacion_gost': 'Certificación GOST',
    'certificacion_sabs': 'Certificación SABS',
    'certificacion_icasa': 'Certificación ICASA',
    'certificacion_anatel': 'Certificación ANATEL',
    'certificacion_conatel': 'Certificación CONATEL',
    'certificacion_sutel': 'Certificación SUTEL',
    'certificacion_mtc': 'Certificación MTC',
    'certificacion_senatel': 'Certificación SENATEL',
    'certificacion_arcotel': 'Certificación ARCOTEL',
    'certificacion_supercom': 'Certificación SUPERCOM',
    'certificacion_mintic': 'Certificación MINTIC',
    'certificacion_ict': 'Certificación ICT',
    'certificacion_ift': 'Certificación IFT',
    'certificacion_crt': 'Certificación CRT',
    'certificacion_cofetel': 'Certificación COFETEL',
    'certificacion_ifetel': 'Certificación IFETEL',
    'certificacion_telecom': 'Certificación TELECOM',
    'certificacion_osiptel': 'Certificación OSIPTEL',
  };

  return columnMappings[columnName] || columnName;
};

/**
 * Obtiene el valor de display para una celda de tabla
 */
export const getDisplayValue = (row: any, columnName: string, relatedData: RelatedData = {}): string => {
  // Validar que row no sea null o undefined
  if (!row) {
    console.warn('⚠️ getDisplayValue: row is null or undefined');
    return 'N/A';
  }

  // Mapeo de campos de ID a sus tablas relacionadas y campos de nombre
  const idToNameMapping: Record<string, { table: string; nameField: string }> = {
    'paisid': { table: 'pais', nameField: 'pais' },
    'empresaid': { table: 'empresa', nameField: 'empresa' },
    'fundoid': { table: 'fundo', nameField: 'fundo' },
    'ubicacionid': { table: 'ubicacion', nameField: 'ubicacion' },
    'entidadid': { table: 'entidad', nameField: 'entidad' },
    'nodoid': { table: 'nodo', nameField: 'nodo' },
    'tipoid': { table: 'tipo', nameField: 'tipo' },
    'metricaid': { table: 'metrica', nameField: 'metrica' },
    'localizacionid': { table: 'localizacion', nameField: 'localizacionid' },
    'criticidadid': { table: 'criticidad', nameField: 'criticidad' },
    'perfilid': { table: 'perfil', nameField: 'perfil' },
    'umbralid': { table: 'umbral', nameField: 'umbral' },
    'usuarioid': { table: 'usuario', nameField: 'login' },
    'medioid': { table: 'medio', nameField: 'nombre' },
    'old_criticidadid': { table: 'criticidad', nameField: 'criticidad' },
    'new_criticidadid': { table: 'criticidad', nameField: 'criticidad' }
  };

  // Si es un campo de ID, buscar el nombre en los datos de las tablas relacionadas
  if (idToNameMapping[columnName]) {
    const mapping = idToNameMapping[columnName];
    const idValue = row[columnName];
    
    if (idValue) {
      // Buscar en los datos de la tabla relacionada
      let relatedDataArray: any[] = [];
      
      switch (mapping.table) {
        case 'pais':
          relatedDataArray = relatedData.paisesData || [];
          break;
        case 'empresa':
          relatedDataArray = relatedData.empresasData || [];
          console.log('🔍 getDisplayValue for empresa:', { idValue, relatedDataArray: relatedDataArray.length, empresasData: relatedData.empresasData?.length });
          break;
        case 'fundo':
          relatedDataArray = relatedData.fundosData || [];
          break;
        case 'ubicacion':
          relatedDataArray = relatedData.ubicacionesData || [];
          break;
        case 'entidad':
          relatedDataArray = relatedData.entidadesData || [];
          break;
        case 'nodo':
          relatedDataArray = relatedData.nodosData || [];
          break;
        case 'tipo':
          relatedDataArray = relatedData.tiposData || [];
          break;
        case 'metrica':
          relatedDataArray = relatedData.metricasData || [];
          break;
        case 'localizacion':
          relatedDataArray = relatedData.localizacionesData || [];
          break;
        case 'criticidad':
          relatedDataArray = relatedData.criticidadesData || [];
          break;
        case 'perfil':
          relatedDataArray = relatedData.perfilesData || [];
          break;
        case 'umbral':
          relatedDataArray = relatedData.umbralesData || [];
          break;
        case 'usuario':
          relatedDataArray = relatedData.userData || [];
          break;
        case 'medio':
          relatedDataArray = relatedData.mediosData || [];
          break;
      }

      const relatedItem = relatedDataArray.find(item => {
        const idField = `${mapping.table}id`;
        return item[idField] && item[idField].toString() === idValue.toString();
      });

      if (relatedItem) {
        return relatedItem[mapping.nameField] || idValue.toString();
      }
    }
    
    return idValue ? idValue.toString() : 'N/A';
  }

  // Para campos de usuario (usercreatedid, usermodifiedid, modified_by)
  if (columnName === 'usercreatedid' || columnName === 'usermodifiedid' || columnName === 'modified_by') {
    const userId = row[columnName];
    if (userId && relatedData.userData) {
      const user = relatedData.userData.find((u: any) => u.usuarioid === userId);
      if (user) {
        return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.login || `Usuario ${userId}`;
      }
    }
    return userId ? `Usuario ${userId}` : 'N/A';
  }

  // Para campos de status
  if (columnName === 'statusid') {
    const statusValue = row[columnName];
    return statusValue === 1 ? 'Activo' : statusValue === 0 ? 'Inactivo' : statusValue?.toString() || 'N/A';
  }

  // Para fechas
  if (columnName === 'datecreated' || columnName === 'datemodified' || columnName.includes('fecha') || columnName.includes('date')) {
    return formatDate(row[columnName]);
  }

  // Para valores booleanos
  if (typeof row[columnName] === 'boolean') {
    return row[columnName] ? 'Sí' : 'No';
  }

  // Para valores numéricos
  if (typeof row[columnName] === 'number') {
    return row[columnName].toString();
  }

  // Para valores de texto
  return row[columnName]?.toString() || 'N/A';
};

/**
 * Formatea una fecha para display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('⚠️ formatDate: Error formatting date:', dateString, error);
    return dateString;
  }
};

/**
 * Obtiene el nombre de usuario por ID
 */
export const getUserName = (userId: number, userData: any[] = []): string => {
  const user = userData.find(u => u.usuarioid === userId);
  
  if (user) {
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.login || `Usuario ${userId}`;
  }
  
  return `Usuario ${userId}`;
};

/**
 * Valida datos de inserción para una tabla específica
 */
export const validateInsertData = (tableName: string, data: any): string | null => {
  // Validaciones básicas
  if (!tableName) {
    return 'Nombre de tabla requerido';
  }

  if (!data || typeof data !== 'object') {
    return 'Datos requeridos';
  }

  // Validaciones específicas por tabla
  switch (tableName) {
    case 'pais':
      if (!data.pais || !data.paisabrev) {
        return 'País y abreviatura son obligatorios';
      }
      break;
    
    case 'empresa':
      if (!data.empresa || !data.empresaid) {
        return 'Empresa y país son obligatorios';
      }
      break;
    
    case 'fundo':
      if (!data.fundo || !data.empresaid) {
        return 'Fundo y empresa son obligatorios';
      }
      break;
    
    case 'ubicacion':
      if (!data.ubicacion || !data.fundoid) {
        return 'Ubicación y fundo son obligatorios';
      }
      break;
    
    case 'entidad':
      if (!data.entidad || !data.fundoid) {
        return 'Entidad y fundo son obligatorios';
      }
      break;
    
    case 'nodo':
      if (!data.nodo || !data.ubicacionid) {
        return 'Nodo y ubicación son obligatorios';
      }
      break;
    
    case 'tipo':
      if (!data.tipo || !data.entidadid) {
        return 'Tipo y entidad son obligatorios';
      }
      break;
    
    case 'metrica':
      if (!data.metrica || !data.unidad) {
        return 'Métrica y unidad son obligatorios';
      }
      break;
    
    case 'sensor':
      if (!data.nodoid || !data.tipoid) {
        return 'Nodo y tipo son obligatorios';
      }
      break;
    
    case 'metricasensor':
      if (!data.nodoid || !data.tipoid || !data.metricaid) {
        return 'Nodo, tipo y métrica son obligatorios';
      }
      break;
    
    case 'umbral':
      if (!data.metricasensorid || data.valor_minimo === undefined || data.valor_maximo === undefined) {
        return 'Métrica sensor, valor mínimo y máximo son obligatorios';
      }
      break;
    
    case 'usuario':
      if (!data.login || !data.email) {
        return 'Login y email son obligatorios';
      }
      break;
    
    case 'perfil':
      if (!data.perfil) {
        return 'Perfil es obligatorio';
      }
      break;
    
    case 'usuarioperfil':
      if (!data.usuarioid || !data.perfilid) {
        return 'Usuario y perfil son obligatorios';
      }
      break;
    
    case 'localizacion':
      if (!data.nodoid || !data.latitud || !data.longitud) {
        return 'Nodo, latitud y longitud son obligatorios';
      }
      break;
    
    case 'criticidad':
      if (!data.criticidad) {
        return 'Criticidad es obligatoria';
      }
      break;
    
    case 'medio':
      if (!data.nombre) {
        return 'Nombre es obligatorio';
      }
      break;
  }

  return null; // Sin errores
};
