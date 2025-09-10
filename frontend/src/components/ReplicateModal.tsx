import React, { useState, useEffect } from 'react';

interface ReplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplicate: (selectedEntry: any) => void;
  tableName: string;
  tableData: any[];
  visibleColumns: any[];
  loading?: boolean;
  relatedData?: any[]; // Para mostrar datos relacionados (ej: sensores de un nodo)
  relatedColumns?: any[]; // Columnas para los datos relacionados
  nodosData?: any[]; // Datos de nodos para búsquedas
  tiposData?: any[]; // Datos de tipos para búsquedas
  metricasData?: any[]; // Datos de métricas para búsquedas
  originalTable?: string; // Tabla original que se está replicando
}

const ReplicateModal: React.FC<ReplicateModalProps> = ({
  isOpen,
  onClose,
  onReplicate,
  tableName,
  tableData,
  visibleColumns,
  loading = false,
  relatedData = [],
  relatedColumns = [],
  nodosData = [],
  tiposData = [],
  metricasData = [],
  originalTable = ''
}) => {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Limpiar selección cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedEntry(null);
    }
  }, [isOpen]);

  // Usar todos los datos sin filtrado
  const filteredData = tableData;

  // Función para obtener los sensores del nodo seleccionado
  const getSensorsForSelectedNode = () => {
    if (!selectedEntry || tableName !== 'nodo' || !relatedData.length) return [];
    return relatedData.filter(sensor => sensor.nodoid === selectedEntry.nodoid);
  };

  // Función para obtener las métricas sensor del nodo seleccionado
  const getMetricasForSelectedNode = () => {
    if (!selectedEntry || tableName !== 'nodo' || !relatedData.length) return [];
    return relatedData.filter(metrica => metrica.nodoid === selectedEntry.nodoid);
  };

  // Función para obtener el nombre de la columna para display
  const getColumnDisplayName = (columnName: string) => {
    const displayNames: Record<string, string> = {
      'nodoid': 'Nodo',
      'tipoid': 'Tipo',
      'metricaid': 'Métrica',
      'usercreatedid': 'Creado por',
      'datecreated': 'Fecha Creación',
      'usermodifiedid': 'Modificado por',
      'datemodified': 'Fecha Modificación',
      'statusid': 'Status',
      'nodo': 'Nodo',
      'deveui': 'DevEUI',
      'appeui': 'AppEUI',
      'appkey': 'AppKey',
      'atpin': 'AT Pin'
    };
    return displayNames[columnName] || columnName;
  };

  // Función para formatear el valor de una celda
  const formatCellValue = (value: any, columnName: string, sensor: any) => {
    if (value === null || value === undefined) return '';
    
    if (columnName === 'datecreated' || columnName === 'datemodified') {
      return new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (columnName === 'statusid') {
      return value === 1 ? 'Activo' : 'Inactivo';
    }
    
    if (columnName === 'nodoid') {
      // Buscar el nombre del nodo
      const nodo = nodosData.find(n => n.nodoid === value);
      return nodo ? nodo.nodo : value;
    }
    
    if (columnName === 'tipoid') {
      // Buscar el nombre del tipo
      const tipo = tiposData.find(t => t.tipoid === value);
      return tipo ? tipo.tipo : value;
    }
    
    if (columnName === 'metricaid') {
      // Buscar el nombre de la métrica
      const metrica = metricasData.find(m => m.metricaid === value);
      return metrica ? metrica.metrica : value;
    }
    
    if (columnName === 'usercreatedid' || columnName === 'usermodifiedid') {
      // Aquí podrías buscar el nombre del usuario, pero por ahora mostramos el ID
      return value;
    }
    
    return value.toString();
  };

  // Función para obtener el texto de display de una entrada
  const getEntryDisplayText = (entry: any) => {
    // Para nodos, mostrar solo el nombre del nodo
    if (tableName === 'nodo' && entry.nodo) {
      return entry.nodo;
    }
    
    // Para otros tipos, usar la lógica original
    const displayFields = visibleColumns
      .filter(col => !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName))
      .slice(0, 3) // Mostrar máximo 3 campos
      .map(col => {
        const value = entry[col.columnName];
        if (value === null || value === undefined) return '';
        return value.toString();
      })
      .filter(value => value !== '')
      .join(' - ');
    
    return displayFields || 'Entrada sin datos visibles';
  };

  const handleReplicate = () => {
    if (selectedEntry) {
      onReplicate(selectedEntry);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-orange-500 font-mono tracking-wider">
            🔄 REPLICAR {tableName.toUpperCase()}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Combobox de selección */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-2 font-mono tracking-wider">
            SELECCIONAR NODO
          </label>
          <select
            value={selectedEntry ? (tableName === 'nodo' ? selectedEntry.nodoid : selectedEntry.id) : ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const entry = filteredData.find(entry => {
                if (tableName === 'nodo') return entry.nodoid.toString() === selectedId;
                return entry.id.toString() === selectedId;
              });
              setSelectedEntry(entry || null);
            }}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          >
            <option value="" disabled>
              SELECCIONAR NODO...
            </option>
            {filteredData.map((entry, index) => (
              <option 
                key={tableName === 'nodo' ? entry.nodoid : entry.id || index} 
                value={tableName === 'nodo' ? entry.nodoid : entry.id}
              >
                {getEntryDisplayText(entry)}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de datos del nodo seleccionado */}
              {selectedEntry && tableName === 'nodo' && originalTable === 'nodo' && (
                <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-600">
                          {Object.entries(selectedEntry)
                            .filter(([key, value]) => 
                              !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(key) &&
                              value !== null && value !== undefined && value !== ''
                            )
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <th key={key} className="text-left py-2 px-2 text-neutral-300 font-medium font-mono tracking-wider">
                                {getColumnDisplayName(key)}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-neutral-600">
                          {Object.entries(selectedEntry)
                            .filter(([key, value]) => 
                              !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(key) &&
                              value !== null && value !== undefined && value !== ''
                            )
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <td key={key} className="py-2 px-2 text-white">
                                {formatCellValue(value, key, selectedEntry)}
                              </td>
                            ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

        {/* Tabla de sensores del nodo seleccionado */}
              {selectedEntry && tableName === 'nodo' && originalTable === 'sensor' && (
                <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
            {getSensorsForSelectedNode().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-600">
                      {relatedColumns
                        .filter(col => !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName))
                        .map(col => (
                          <th key={col.columnName} className="text-left py-2 px-2 text-neutral-300 font-medium">
                            {getColumnDisplayName(col.columnName)}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getSensorsForSelectedNode().map((sensor, index) => (
                      <tr key={index} className="border-b border-neutral-600">
                        {relatedColumns
                          .filter(col => !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName))
                          .map(col => (
                            <td key={col.columnName} className="py-2 px-2 text-white">
                              {formatCellValue(sensor[col.columnName], col.columnName, sensor)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">
                No hay sensores asociados a este nodo.
              </div>
            )}
          </div>
              )}

        {/* Tabla de métricas sensor del nodo seleccionado */}
              {selectedEntry && tableName === 'nodo' && originalTable === 'metricasensor' && (
                <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
            {getMetricasForSelectedNode().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-600">
                      {relatedColumns
                        .filter(col => !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName))
                        .map(col => (
                          <th key={col.columnName} className="text-left py-2 px-2 text-neutral-300 font-medium">
                            {getColumnDisplayName(col.columnName)}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getMetricasForSelectedNode().map((metrica, index) => (
                      <tr key={index} className="border-b border-neutral-600">
                        {relatedColumns
                          .filter(col => !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName))
                          .map(col => (
                            <td key={col.columnName} className="py-2 px-2 text-white">
                              {formatCellValue(metrica[col.columnName], col.columnName, metrica)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">
                No hay métricas sensor asociadas a este nodo.
              </div>
            )}
          </div>
              )}

        {/* Vista simplificada para otros tipos de tabla */}
        {selectedEntry && tableName !== 'nodo' && (
          <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">
              Datos que se replicarán:
            </h4>
            <div className="space-y-2">
              {Object.entries(selectedEntry)
                .filter(([key, value]) => 
                  !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(key) &&
                  value !== null && value !== undefined && value !== ''
                )
                .slice(0, 5) // Mostrar máximo 5 campos
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-neutral-400 capitalize">{key}:</span>
                    <span className="text-white">{value?.toString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={handleReplicate}
            disabled={!selectedEntry}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 font-mono tracking-wider ${
              selectedEntry
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <span>🔄</span>
            <span>REPLICAR</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
          >
            <span>❌</span>
            <span>CANCELAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplicateModal;
