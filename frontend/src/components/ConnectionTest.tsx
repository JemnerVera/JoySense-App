import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

const ConnectionTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<{[key: string]: string[]}>({});
  const [showDetails, setShowDetails] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Iniciando diagnóstico completo...');
      
      // 1. Listar schemas disponibles (solo sense)
      const schemas = ['sense'];
      setAvailableSchemas(schemas);
      
      // 2. Listar tablas para schema sense
      const tables: {[key: string]: string[]} = {};
      const schemaTables = await JoySenseService.listTables('sense');
      tables['sense'] = schemaTables;
      setAvailableTables(tables);
      
      // 3. Probar conexión
      const connected = await JoySenseService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        // 4. Obtener información de tablas
        const info = await JoySenseService.getTableInfo();
        setTableInfo(info);
        console.log('📊 Información de tablas:', info);
      }
      
    } catch (err) {
      console.error('❌ Error en diagnóstico:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Diagnosticando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">🔌 Diagnóstico de Conexión:</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? '✅ Conectado' : '❌ Error de Conexión'}
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver más'}
        </button>
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="mt-4 space-y-4">
          {/* Schema sense */}
          <div>
            <h3 className="text-md font-medium mb-2">📋 Schema sense:</h3>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-green-600">✅ Schema: sense</div>
              {availableTables['sense'] && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600">Tablas disponibles:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {availableTables['sense'].map(table => (
                      <span key={table} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de tablas */}
          {tableInfo && (
            <div>
              <h3 className="text-md font-medium mb-2">📊 Información de Tablas:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Mediciones</div>
                  <div className="text-lg font-semibold">{tableInfo.medicionCount}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Países</div>
                  <div className="text-lg font-semibold">{tableInfo.paisCount}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Empresas</div>
                  <div className="text-lg font-semibold">{tableInfo.empresaCount}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Fundos</div>
                  <div className="text-lg font-semibold">{tableInfo.fundoCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div>
              <h3 className="text-md font-medium mb-2 text-red-600">❌ Error:</h3>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          )}

          {/* Botón de reintentar */}
          <button
            onClick={testConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🔄 Reintentar Diagnóstico
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
