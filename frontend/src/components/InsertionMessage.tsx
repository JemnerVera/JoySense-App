import React from 'react';

interface InsertedRecord {
  id: string;
  fields: Record<string, any>;
}

interface InsertionMessageProps {
  insertedRecords: InsertedRecord[];
  tableName: string;
  onClear: () => void;
  nodosData?: any[];
  tiposData?: any[];
  ubicacionesData?: any[];
  entidadesData?: any[];
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  metricasData?: any[];
  criticidadesData?: any[];
  perfilesData?: any[];
  userData?: any[];
}

const InsertionMessage: React.FC<InsertionMessageProps> = ({
  insertedRecords,
  tableName,
  onClear,
  nodosData = [],
  tiposData = [],
  ubicacionesData = [],
  entidadesData = [],
  paisesData = [],
  empresasData = [],
  fundosData = [],
  metricasData = [],
  criticidadesData = [],
  perfilesData = [],
  userData = []
}) => {
  if (insertedRecords.length === 0) return null;

  // Función para obtener el nombre de la tabla en español
  const getTableDisplayName = (table: string): string => {
    const tableNames: Record<string, string> = {
      'pais': 'País',
      'empresa': 'Empresa',
      'fundo': 'Fundo',
      'ubicacion': 'Ubicación',
      'localizacion': 'Localización',
      'entidad': 'Entidad',
      'tipo': 'Tipo',
      'nodo': 'Nodo',
      'sensor': 'Sensor',
      'metricasensor': 'Métrica Sensor',
      'metrica': 'Métrica',
      'umbral': 'Umbral',
      'perfilumbral': 'Perfil Umbral',
      'audit_log_umbral': 'Log Auditoría Umbral',
      'criticidad': 'Criticidad',
      'medio': 'Medio',
      'contacto': 'Contacto',
      'usuario': 'Usuario',
      'usuarioperfil': 'Usuario Perfil',
      'perfil': 'Perfil'
    };
    return tableNames[table] || table;
  };

  // Función para obtener los campos a excluir según la tabla
  const getExcludedFieldsForTable = (table: string): string[] => {
    const baseExcludeFields = [
      'datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid',
      'modified_at', 'modified_by', 'auditid'
    ];
    
    // Excluir campos de relación que no corresponden a cada tabla
    const tableSpecificExcludes: Record<string, string[]> = {
      'pais': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'localizacionid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'empresa': ['empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'localizacionid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'fundo': ['fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'localizacionid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'ubicacion': ['ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'localizacionid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'localizacion': ['localizacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'entidad': ['entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'nodo': ['nodoid', 'tipoid', 'sensorid', 'metricaid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'tipo': ['tipoid', 'sensorid', 'metricaid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'sensor': ['sensorid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'metrica': ['metricaid', 'metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'metricasensor': ['metricasensorid', 'umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'umbral': ['umbralid', 'perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'perfilumbral': ['perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'criticidad': ['criticidadid', 'perfilid', 'usuarioid', 'medioid', 'contactoid'],
      'medio': ['medioid', 'contactoid', 'perfilid', 'usuarioid', 'criticidadid'],
      'contacto': ['contactoid', 'perfilid', 'usuarioid', 'medioid', 'criticidadid'],
      'usuario': ['usuarioid', 'perfilid', 'medioid', 'contactoid', 'criticidadid'],
      'usuarioperfil': ['perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid'],
      'perfil': ['perfilid', 'usuarioid', 'medioid', 'contactoid', 'criticidadid']
    };
    
    return [...baseExcludeFields, ...(tableSpecificExcludes[table] || [])];
  };

  // Función para obtener los campos importantes (excluyendo fechas, usuarios de auditoría y campos de relación irrelevantes)
  const getImportantFields = (fields: Record<string, any>): Record<string, any> => {
    const excludeFields = getExcludedFieldsForTable(tableName);
    
    const importantFields: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (!excludeFields.includes(key.toLowerCase()) && value !== null && value !== undefined && value !== '') {
        importantFields[key] = value;
      }
    });
    
    return importantFields;
  };

  // Función para formatear el nombre del campo
  const formatFieldName = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
      'pais': 'País',
      'paisabrev': 'Abreviatura',
      'abreviatura': 'Abreviatura',
      'empresa': 'Empresa',
      'empresabrev': 'Abreviatura',
      'fundo': 'Fundo',
      'fundoabrev': 'Abreviatura',
      'ubicacion': 'Ubicación',
      'localizacion': 'Localización',
      'entidad': 'Entidad',
      'tipo': 'Tipo',
      'nodo': 'Nodo',
      'sensor': 'Sensor',
      'metrica': 'Métrica',
      'umbral': 'Umbral',
      'maximo': 'Máximo',
      'minimo': 'Mínimo',
      'perfil': 'Perfil',
      'nivel': 'Nivel',
      'criticidad': 'Criticidad',
      'criticidadbrev': 'Criticidad Brev',
      'medio': 'Medio',
      'celular': 'Celular',
      'correo': 'Correo',
      'login': 'Login',
      'firstname': 'Nombre',
      'lastname': 'Apellido',
      'email': 'Email',
      'statusid': 'Status',
      'status': 'Status',
      // Campos de relación (solo se mostrarán si son relevantes para la tabla)
      'paisid': 'País',
      'empresaid': 'Empresa',
      'fundoid': 'Fundo',
      'ubicacionid': 'Ubicación',
      'entidadid': 'Entidad',
      'nodoid': 'Nodo',
      'tipoid': 'Tipo',
      'sensorid': 'Sensor',
      'metricaid': 'Métrica',
      'localizacionid': 'Localización',
      'metricasensorid': 'Métrica Sensor',
      'umbralid': 'Umbral',
      'perfilid': 'Perfil',
      'usuarioid': 'Usuario',
      'medioid': 'Medio',
      'contactoid': 'Contacto',
      'criticidadid': 'Criticidad'
    };
    
    return fieldNames[fieldName.toLowerCase()] || fieldName;
  };

  // Función para formatear el valor del campo
  const formatFieldValue = (value: any, fieldKey: string): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Activo' : 'Inactivo';
    }
    
    // Normalizar el valor para comparación (convertir a número si es posible)
    const normalizeValue = (val: any): any => {
      if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
        return Number(val);
      }
      return val;
    };
    
    const normalizedValue = normalizeValue(value);
    
    // Buscar nombres para campos de relación
    if (fieldKey === 'nodoid' && nodosData.length > 0) {
      const nodo = nodosData.find(n => normalizeValue(n.nodoid) === normalizedValue);
      return nodo ? nodo.nodo : value.toString();
    }
    
    if (fieldKey === 'tipoid' && tiposData.length > 0) {
      const tipo = tiposData.find(t => normalizeValue(t.tipoid) === normalizedValue);
      return tipo ? tipo.tipo : value.toString();
    }
    
    if (fieldKey === 'ubicacionid' && ubicacionesData.length > 0) {
      const ubicacion = ubicacionesData.find(u => normalizeValue(u.ubicacionid) === normalizedValue);
      return ubicacion ? ubicacion.ubicacion : value.toString();
    }
    
    if (fieldKey === 'entidadid' && entidadesData.length > 0) {
      const entidad = entidadesData.find(e => normalizeValue(e.entidadid) === normalizedValue);
      return entidad ? entidad.entidad : value.toString();
    }
    
    if (fieldKey === 'paisid' && paisesData.length > 0) {
      const pais = paisesData.find(p => normalizeValue(p.paisid) === normalizedValue);
      return pais ? pais.pais : value.toString();
    }
    
    if (fieldKey === 'empresaid' && empresasData.length > 0) {
      const empresa = empresasData.find(e => normalizeValue(e.empresaid) === normalizedValue);
      return empresa ? empresa.empresa : value.toString();
    }
    
    if (fieldKey === 'fundoid' && fundosData.length > 0) {
      const fundo = fundosData.find(f => normalizeValue(f.fundoid) === normalizedValue);
      return fundo ? fundo.fundo : value.toString();
    }
    
    if (fieldKey === 'metricaid' && metricasData.length > 0) {
      const metrica = metricasData.find(m => normalizeValue(m.metricaid) === normalizedValue);
      return metrica ? metrica.metrica : value.toString();
    }
    
    if (fieldKey === 'criticidadid' && criticidadesData.length > 0) {
      const criticidad = criticidadesData.find(c => normalizeValue(c.criticidadid) === normalizedValue);
      return criticidad ? criticidad.criticidad : value.toString();
    }
    
    if (fieldKey === 'perfilid' && perfilesData.length > 0) {
      const perfil = perfilesData.find(p => normalizeValue(p.perfilid) === normalizedValue);
      return perfil ? perfil.perfil : value.toString();
    }
    
    if (fieldKey === 'usuarioid' && userData.length > 0) {
      const usuario = userData.find(u => normalizeValue(u.usuarioid) === normalizedValue);
      return usuario ? `${usuario.firstname} ${usuario.lastname}` : value.toString();
    }
    
    // Manejar statusid
    if (fieldKey === 'statusid') {
      return normalizedValue === 1 ? 'Activo' : 'Inactivo';
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  };

  // Para sensor y metricasensor, mostrar solo un mensaje simple
  if (tableName === 'sensor' || tableName === 'metricasensor') {
    return (
      <div className="bg-blue-900 bg-opacity-30 border border-blue-600 border-opacity-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-blue-200 text-opacity-70 font-medium">
            Se insertaron {insertedRecords.length} entradas
          </div>
          <button
            onClick={onClear}
            className="text-gray-400 text-opacity-60 hover:text-opacity-100 transition-all duration-200"
            title="Limpiar mensaje"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Función para ordenar las columnas según la tabla
  const getOrderedFieldKeys = (fields: Record<string, any>, table: string): string[] => {
    const fieldKeys = Object.keys(fields);
    
    // Definir el orden preferido para cada tabla
    const fieldOrder: Record<string, string[]> = {
      'pais': ['pais', 'paisabrev', 'statusid'],
      'empresa': ['paisid', 'empresa', 'empresabrev', 'statusid'],
      'fundo': ['paisid', 'empresaid', 'fundo', 'fundoabrev', 'statusid'],
      'ubicacion': ['paisid', 'empresaid', 'fundoid', 'ubicacion', 'statusid'],
      'localizacion': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'localizacion', 'statusid'],
      'entidad': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidad', 'statusid'],
      'nodo': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'nodo', 'statusid'],
      'tipo': ['tipo', 'statusid'],
      'sensor': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensor', 'statusid'],
      'metrica': ['metrica', 'statusid'],
      'metricasensor': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'sensorid', 'metricaid', 'statusid'],
      'umbral': ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'metricaid', 'umbral', 'minimo', 'maximo', 'criticidadid', 'statusid'],
      'perfilumbral': ['perfilid', 'umbralid', 'statusid'],
      'criticidad': ['criticidad', 'criticidadbrev', 'statusid'],
      'medio': ['medio', 'statusid'],
      'contacto': ['contacto', 'medioid', 'celular', 'correo', 'statusid'],
      'usuario': ['login', 'firstname', 'lastname', 'email', 'statusid'],
      'usuarioperfil': ['usuarioid', 'perfilid', 'statusid'],
      'perfil': ['perfil', 'nivel', 'statusid']
    };
    
    const order = fieldOrder[table] || [];
    
    // Ordenar: primero los campos en el orden definido, luego los demás
    const ordered: string[] = [];
    const unordered: string[] = [];
    
    order.forEach(key => {
      if (fieldKeys.includes(key)) {
        ordered.push(key);
      }
    });
    
    fieldKeys.forEach(key => {
      if (!order.includes(key)) {
        unordered.push(key);
      }
    });
    
    return [...ordered, ...unordered];
  };

  // Obtener los campos importantes del primer registro para crear los headers
  const firstRecordFields = getImportantFields(insertedRecords[0]?.fields || {});
  const fieldKeys = getOrderedFieldKeys(firstRecordFields, tableName);

  return (
    <div className="bg-blue-900 bg-opacity-30 border border-blue-600 border-opacity-50 rounded-lg p-4 mb-4">
      <div className="flex justify-end items-center mb-3">
        <button
          onClick={onClear}
          className="text-gray-400 text-opacity-60 hover:text-opacity-100 transition-all duration-200"
          title="Limpiar mensaje"
        >
          ✕
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-blue-500 border-opacity-40">
              {fieldKeys.map(fieldKey => (
                <th key={fieldKey} className="text-left py-2 px-3 text-blue-200 text-opacity-70 font-medium">
                  {formatFieldName(fieldKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insertedRecords.slice(-3).map((record, index) => (
              <tr key={record.id} className="border-b border-blue-600 border-opacity-30 last:border-b-0">
                {fieldKeys.map(fieldKey => (
                  <td key={fieldKey} className="py-2 px-3 text-blue-200 text-opacity-70">
                    {formatFieldValue(record.fields[fieldKey], fieldKey)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default InsertionMessage;
