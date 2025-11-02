/**
 * Utilidades puras para SystemParameters
 * Funciones sin estado ni efectos secundarios que pueden ser reutilizadas
 */

import { useLanguage } from '../contexts/LanguageContext';

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
 * Obtiene el nombre de display para una columna (versión estática)
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
    'grado': 'Grado',
    'escalamiento': 'Escalamiento',
    'escalon': 'Escalón',
    'perfil': 'Perfil',
    'nivel': 'Nivel',
    'jefeid': 'Jefe',
    'umbral': 'Umbral',
    'usuario': 'Usuario',
    'medio': 'Medio',
    'login': 'Login',
    'firstname': 'Nombre',
    'lastname': 'Apellido',
    'email': 'Email',
    'abreviatura': 'Abreviatura',
    'descripcion': 'Descripción',
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'valor_minimo': 'Valor Mínimo',
    'valor_maximo': 'Valor Máximo',
    'frecuencia': 'Frecuencia',
    'tolerancia': 'Tolerancia',
    'altitud': 'Altitud',
    'direccion': 'Dirección',
    'contacto': 'Contacto',
    'celular': 'Celular',
    'codigotelefonoid': 'Código País',
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
 * Obtiene el nombre de display para una columna con traducciones dinámicas
 */
export const getColumnDisplayNameTranslated = (columnName: string, t: (key: string) => string): string => {
  const columnMappings: Record<string, string> = {
    'paisid': t('table_headers.country'),
    'empresaid': t('table_headers.company'),
    'fundoid': t('table_headers.fund'),
    'ubicacionid': t('table_headers.location'),
    'entidadid': t('table_headers.entity'),
    'nodoid': t('table_headers.node'),
    'tipoid': t('table_headers.type'),
    'metricaid': t('table_headers.metric'),
    'tipos': t('table_headers.type'),
    'metricas': t('table_headers.metric'),
    'localizacionid': t('table_headers.localization'),
    'criticidadid': t('table_headers.criticality'),
    'perfilid': t('table_headers.profile'),
    'umbralid': t('table_headers.threshold'),
    'usuarioid': t('table_headers.user'),
    'medioid': t('table_headers.medium'),
    'paisabrev': t('table_headers.abbreviation'),
    'empresabrev': t('table_headers.abbreviation'),
    'empresaabrev': t('table_headers.abbreviation'),
    'farmabrev': t('table_headers.abbreviation'),
    'fundoabrev': t('table_headers.abbreviation'),
    'ubicacionabrev': t('table_headers.abbreviation'),
    'statusid': t('table_headers.status'),
    'password_hash': t('table_headers.password'),
    'usercreatedid': t('table_headers.created_by'),
    'usermodifiedid': t('table_headers.modified_by'),
    'datecreated': t('table_headers.creation_date'),
    'datemodified': t('table_headers.modification_date'),
    'modified_by': t('table_headers.modified_by'),
    'pais': t('table_headers.country'),
    'empresa': t('table_headers.company'),
    'fundo': t('table_headers.fund'),
    'ubicacion': t('table_headers.location'),
    'entidad': t('table_headers.entity'),
    'nodo': t('table_headers.node'),
    'tipo': t('table_headers.type'),
    'metrica': t('table_headers.metric'),
    'localizacion': t('table_headers.localization'),
    'latitud': t('table_headers.latitude'),
    'longitud': t('table_headers.longitude'),
    'referencia': t('table_headers.reference'),
    'criticidad': t('table_headers.criticality'),
    'grado': t('table_headers.grade'),
    'escalamiento': t('table_headers.escalation'),
    'escalon': t('table_headers.step'),
    'nombre': t('table_headers.name'),
    'apellido': t('table_headers.last_name'),
    'firstname': t('table_headers.name'),
    'lastname': t('table_headers.last_name'),
    'telefono': t('table_headers.phone_number'),
    'correo': t('table_headers.email_address'),
    'unidad': t('table_headers.unit'),
    'perfil': 'Perfil', // No hay traducción específica
    'nivel': 'Nivel', // No hay traducción específica
    'jefeid': 'Jefe', // No hay traducción específica
    'umbral': 'Umbral', // No hay traducción específica
    'usuario': 'Usuario', // No hay traducción específica
    'medio': 'Medio', // No hay traducción específica
    'login': 'Login', // No hay traducción específica
    'email': 'Email', // No hay traducción específica
    'abreviatura': t('table_headers.abbreviation'),
    'descripcion': 'Descripción', // No hay traducción específica
    'activo': t('status.active'),
    'inactivo': t('status.inactive'),
    // Mantener el resto de los campos como estaban
    'valor_minimo': 'Valor Mínimo',
    'valor_maximo': 'Valor Máximo',
    'frecuencia': 'Frecuencia',
    'tolerancia': 'Tolerancia',
    'altitud': 'Altitud',
    'direccion': 'Dirección',
    'contacto': 'Contacto',
    'celular': 'Celular',
    'codigotelefonoid': 'Código País',
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

// Cache eficiente para valores de display
const displayValueCache = new Map<string, string>();

/**
 * Limpia el cache de valores de display
 */
export const clearDisplayValueCache = () => {
  displayValueCache.clear();
};

/**
 * Obtiene el array de datos relacionados de forma eficiente
 */
const getRelatedDataArray = (tableName: string, relatedData: RelatedData): any[] => {
  switch (tableName) {
    case 'pais': return relatedData.paisesData || [];
    case 'empresa': return relatedData.empresasData || [];
    case 'fundo': return relatedData.fundosData || [];
    case 'ubicacion': return relatedData.ubicacionesData || [];
    case 'entidad': return relatedData.entidadesData || [];
    case 'nodo': return relatedData.nodosData || [];
    case 'tipo': return relatedData.tiposData || [];
    case 'metrica': return relatedData.metricasData || [];
    case 'localizacion': return relatedData.localizacionesData || [];
    case 'criticidad': return relatedData.criticidadesData || [];
    case 'perfil': return relatedData.perfilesData || [];
    case 'umbral': return relatedData.umbralesData || [];
    case 'usuario': return relatedData.userData || [];
    case 'medio': return relatedData.mediosData || [];
    default: return [];
  }
};

/**
 * Obtiene el valor de display para una celda de tabla - VERSIÓN OPTIMIZADA
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

  // Para campos que son IDs de tablas relacionadas - VERSIÓN SÚPER OPTIMIZADA
  if (idToNameMapping[columnName]) {
    const mapping = idToNameMapping[columnName];
    const idValue = row[columnName];
    
    if (idValue) {
      // Crear clave de cache eficiente
      const cacheKey = `${mapping.table}_${idValue}`;
      
      // Verificar cache primero (más rápido)
      if (displayValueCache.has(cacheKey)) {
        return displayValueCache.get(cacheKey)!;
      }
      
      // Obtener datos relacionados de forma eficiente
      const relatedDataArray = getRelatedDataArray(mapping.table, relatedData);
      
      // Si no hay datos, retornar ID directamente (más eficiente que "N/A")
      if (relatedDataArray.length === 0) {
        return idValue.toString();
      }

      // Buscar el item relacionado
      const idField = `${mapping.table}id`;
      const relatedItem = relatedDataArray.find(item => 
        item[idField] && item[idField].toString() === idValue.toString()
      );

      if (relatedItem) {
        const displayValue = relatedItem[mapping.nameField] || idValue.toString();
        // Cachear solo si es diferente al ID (optimización de memoria)
        if (displayValue !== idValue.toString()) {
          displayValueCache.set(cacheKey, displayValue);
        }
        return displayValue;
      }
    }
    
    return idValue ? idValue.toString() : 'N/A';
  }

  // Para campos de usuario - VERSIÓN OPTIMIZADA
  if (columnName === 'usercreatedid' || columnName === 'usermodifiedid' || columnName === 'modified_by') {
    const userId = row[columnName];
    if (userId) {
      // Crear clave de cache para usuario
      const userCacheKey = `user_${userId}`;
      
      // Verificar cache primero
      if (displayValueCache.has(userCacheKey)) {
        return displayValueCache.get(userCacheKey)!;
      }
      
      if (relatedData.userData && relatedData.userData.length > 0) {
        const user = relatedData.userData.find((u: any) => u.usuarioid === userId);
        if (user) {
          const displayValue = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.login || `Usuario ${userId}`;
          // Cachear el resultado
          displayValueCache.set(userCacheKey, displayValue);
          return displayValue;
        }
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
