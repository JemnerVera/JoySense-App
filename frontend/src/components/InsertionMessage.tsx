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
}

const InsertionMessage: React.FC<InsertionMessageProps> = ({
  insertedRecords,
  tableName,
  onClear,
  nodosData = [],
  tiposData = []
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

  // Función para obtener los campos importantes (excluyendo solo fechas y usuarios de auditoría)
  const getImportantFields = (fields: Record<string, any>): Record<string, any> => {
    const excludeFields = [
      'datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid',
      'modified_at', 'modified_by', 'auditid'
    ];
    
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
      'abreviatura': 'Abreviatura',
      'empresa': 'Empresa',
      'fundo': 'Fundo',
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
      // Campos de relación
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
    if (typeof value === 'boolean') {
      return value ? 'Activo' : 'Inactivo';
    }
    
    // Buscar nombres para campos de relación
    if (fieldKey === 'nodoid' && nodosData.length > 0) {
      const nodo = nodosData.find(n => n.nodoid === value);
      return nodo ? nodo.nodo : value.toString();
    }
    
    if (fieldKey === 'tipoid' && tiposData.length > 0) {
      const tipo = tiposData.find(t => t.tipoid === value);
      return tipo ? tipo.tipo : value.toString();
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

  // Obtener los campos importantes del primer registro para crear los headers
  const firstRecordFields = getImportantFields(insertedRecords[0]?.fields || {});
  const fieldKeys = Object.keys(firstRecordFields);

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
            {insertedRecords.slice(0, 3).map((record, index) => (
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
