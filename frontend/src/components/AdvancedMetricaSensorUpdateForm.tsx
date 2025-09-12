import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface AdvancedMetricaSensorUpdateFormProps {
  selectedRows: any[];
  onUpdate: (updatedData: any[]) => void;
  onCancel: () => void;
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  entidadesData: any[];
  tiposData: any[];
  nodosData: any[];
  metricasData: any[];
}

export function AdvancedMetricaSensorUpdateForm({
  selectedRows,
  onUpdate,
  onCancel,
  getUniqueOptionsForField,
  entidadesData,
  tiposData,
  nodosData,
  metricasData
}: AdvancedMetricaSensorUpdateFormProps) {
  // Función robusta para extraer la entidad de las filas seleccionadas
  const getEntidadFromSelectedRows = () => {
    if (selectedRows.length === 0) return null;
    
    // Obtener el primer tipoid de las filas seleccionadas
    const firstTipoid = selectedRows[0]?.tipoid;
    if (!firstTipoid) return null;
    
    // Buscar el tipo para obtener la entidad
    const tipo = tiposData.find(t => t.tipoid === firstTipoid);
    if (!tipo?.entidadid) return null;
    
    // Buscar la entidad
    const entidad = entidadesData.find(e => e.entidadid === tipo.entidadid);
    return entidad;
  };
  
  const entidad = useMemo(() => getEntidadFromSelectedRows(), [selectedRows]);
  const entidadId = entidad?.entidadid;
  
  console.log('🔍 Debug - Filas seleccionadas:', selectedRows);
  console.log('🔍 Debug - Primer tipoid:', selectedRows[0]?.tipoid);
  console.log('🔍 Debug - Entidad encontrada:', entidad);
  
  // Estados para los tipos, nodos y métricas seleccionados
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedNodos, setSelectedNodos] = useState<string[]>([]);
  const [selectedMetricas, setSelectedMetricas] = useState<string[]>([]);
  
  // Estados para dropdowns
  const [tiposDropdownOpen, setTiposDropdownOpen] = useState(false);
  const [nodosDropdownOpen, setNodosDropdownOpen] = useState(false);
  const [metricasDropdownOpen, setMetricasDropdownOpen] = useState(false);
  
  // Estados para búsqueda
  const [tiposSearchTerm, setTiposSearchTerm] = useState('');
  const [nodosSearchTerm, setNodosSearchTerm] = useState('');
  const [metricasSearchTerm, setMetricasSearchTerm] = useState('');

  // Función robusta para obtener tipos únicos de las filas seleccionadas
  const getTiposFromSelectedRows = () => {
    if (selectedRows.length === 0) return [];
    
    // Extraer tipoid únicos de las filas seleccionadas
    const tiposSet = new Set(selectedRows.map(row => row.tipoid?.toString()).filter(Boolean));
    return Array.from(tiposSet);
  };
  
  // Función robusta para obtener nodos únicos de las filas seleccionadas
  const getNodosFromSelectedRows = () => {
    if (selectedRows.length === 0) return [];
    
    // Extraer nodoid únicos de las filas seleccionadas
    const nodosSet = new Set(selectedRows.map(row => row.nodoid?.toString()).filter(Boolean));
    return Array.from(nodosSet);
  };
  
  // Función robusta para obtener métricas únicas de las filas seleccionadas
  const getMetricasFromSelectedRows = () => {
    if (selectedRows.length === 0) return [];
    
    // Extraer metricaid únicos de las filas seleccionadas que están ACTIVAS
    const metricasSet = new Set(
      selectedRows
        .flatMap(row => row.originalRows || [row])
        .filter(row => row.statusid === 1) // Solo métricas activas
        .map(row => row.metricaid?.toString())
        .filter(Boolean)
    );
    return Array.from(metricasSet);
  };

  // Inicializar datos basados en las filas seleccionadas
  useEffect(() => {
    if (selectedRows.length > 0) {
      const tiposUnicos = getTiposFromSelectedRows();
      const nodosUnicos = getNodosFromSelectedRows();
      const metricasUnicas = getMetricasFromSelectedRows();
      
      console.log('🔍 Debug - Tipos extraídos:', tiposUnicos);
      console.log('🔍 Debug - Nodos extraídos:', nodosUnicos);
      console.log('🔍 Debug - Métricas extraídas:', metricasUnicas);
      console.log('🔍 Debug - Filas seleccionadas completas:', selectedRows);
      
      // Debug: Mostrar el status de las filas originales
      const allOriginalRows = selectedRows.flatMap(row => row.originalRows || [row]);
      console.log('🔍 Debug - Filas originales con status:', allOriginalRows.map(row => ({
        nodoid: row.nodoid,
        tipoid: row.tipoid,
        metricaid: row.metricaid,
        statusid: row.statusid
      })));
      
      setSelectedTipos(tiposUnicos);
      setSelectedNodos(nodosUnicos);
      setSelectedMetricas(metricasUnicas);
    }
  }, [selectedRows.length, selectedRows[0]?.tipoid, selectedRows[0]?.nodoid, selectedRows[0]?.metricaid]);

  const handleUpdate = () => {
    // Crear las entradas actualizadas
    const updatedEntries: any[] = [];
    const firstRow = selectedRows[0]; // Obtener la primera fila para datos de auditoría
    
    console.log('🔍 Debug - handleUpdate:', {
      selectedNodos,
      selectedTipos,
      selectedMetricas,
      selectedRowsLength: selectedRows.length
    });
    
    // Obtener todas las filas originales (individuales) de las filas agrupadas
    const allOriginalRows = selectedRows.flatMap(row => row.originalRows || [row]);
    
    console.log('🔍 Debug - Filas originales:', allOriginalRows);
    
    // Para cada combinación de nodo-tipo-métrica seleccionada
    selectedNodos.forEach(nodoId => {
      selectedTipos.forEach(tipoId => {
        selectedMetricas.forEach(metricaId => {
          // Verificar si esta combinación ya existe en las filas originales
          const existingRow = allOriginalRows.find(row => 
            row.nodoid?.toString() === nodoId && 
            row.tipoid?.toString() === tipoId && 
            row.metricaid?.toString() === metricaId
          );
          
          if (existingRow) {
            // Actualizar la entrada existente con status activo
            updatedEntries.push({
              ...existingRow,
              statusid: 1, // Activo
              usermodifiedid: firstRow?.usermodifiedid,
              datemodified: new Date().toISOString()
            });
          } else {
            // Crear nueva entrada
            updatedEntries.push({
              nodoid: parseInt(nodoId),
              tipoid: parseInt(tipoId),
              metricaid: parseInt(metricaId),
              statusid: 1, // Activo
              usercreatedid: firstRow?.usercreatedid,
              datecreated: new Date().toISOString(),
              usermodifiedid: firstRow?.usermodifiedid,
              datemodified: new Date().toISOString()
            });
          }
        });
      });
    });
    
    // Agregar entradas desactivadas para métricas que se deseleccionaron
    allOriginalRows.forEach(originalRow => {
      const stillExists = updatedEntries.some(entry => 
        entry.nodoid === originalRow.nodoid &&
        entry.tipoid === originalRow.tipoid &&
        entry.metricaid === originalRow.metricaid
      );
      
      if (!stillExists) {
        // Esta entrada ya no está seleccionada, desactivarla
        updatedEntries.push({
          ...originalRow,
          statusid: 2, // Inactivo
          usermodifiedid: firstRow?.usermodifiedid,
          datemodified: new Date().toISOString()
        });
      }
    });
    
    console.log('🔍 Debug - Entradas actualizadas:', updatedEntries);
    
    onUpdate(updatedEntries);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-orange-500 mb-6 font-mono tracking-wider">
        ACTUALIZAR SENSOR MÉTRICA
      </h3>
      
      {/* Entidad (solo lectura) */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          ENTIDAD
        </label>
        <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-400 font-mono">
          {entidad?.entidad || 'N/A'}
        </div>
      </div>

      {/* Tipos */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          TIPO
        </label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setTiposDropdownOpen(!tiposDropdownOpen)}
            className="w-full px-3 py-2 border rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
          >
            <span className={selectedTipos.length > 0 ? 'text-white' : 'text-neutral-400'}>
              {selectedTipos.length > 0 
                ? selectedTipos.map(id => {
                    const tipo = tiposData.find(t => t.tipoid.toString() === id);
                    return tipo ? tipo.tipo : id;
                  }).join(', ')
                : 'SELECCIONAR TIPOS'
              }
            </span>
            <span className="text-neutral-400">▼</span>
          </div>
          
          {tiposDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  placeholder="🔍 Buscar tipos..."
                  value={tiposSearchTerm}
                  onChange={(e) => setTiposSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {getUniqueOptionsForField('tipoid', { entidadid: entidadId })
                  .filter(option => 
                    option.label.toLowerCase().includes(tiposSearchTerm.toLowerCase())
                  )
                  .map(option => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTipos.includes(option.value.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTipos([...selectedTipos, option.value.toString()]);
                          } else {
                            setSelectedTipos(selectedTipos.filter(id => id !== option.value.toString()));
                          }
                        }}
                        className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                      />
                      <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Containers para Nodos y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Container Nodos */}
        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
            NODO
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {/* Nodos de las filas seleccionadas */}
            {getNodosFromSelectedRows().map((nodoId) => {
              const nodo = nodosData.find(n => n.nodoid.toString() === nodoId);
              return (
                <label key={nodoId} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                  <input
                    type="checkbox"
                    checked={selectedNodos.includes(nodoId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNodos([...selectedNodos, nodoId]);
                      } else {
                        setSelectedNodos(selectedNodos.filter(id => id !== nodoId));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-white text-sm font-mono tracking-wider">{nodo?.nodo?.toUpperCase() || nodoId}</span>
                </label>
              );
            })}
            
            {/* Nodos adicionales disponibles para la entidad */}
            {entidadId && getUniqueOptionsForField('nodoid', { entidadid: entidadId })
              .filter(option => !getNodosFromSelectedRows().includes(option.value.toString()))
              .map((option) => (
                <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                  <input
                    type="checkbox"
                    checked={selectedNodos.includes(option.value.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNodos([...selectedNodos, option.value.toString()]);
                      } else {
                        setSelectedNodos(selectedNodos.filter(id => id !== option.value.toString()));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                </label>
              ))}
          </div>
        </div>

        {/* Container Métricas */}
        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
            MÉTRICA
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {/* Métricas de las filas seleccionadas */}
            {getMetricasFromSelectedRows().map((metricaId) => {
              const metrica = metricasData.find(m => m.metricaid.toString() === metricaId);
              return (
                <label key={metricaId} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                  <input
                    type="checkbox"
                    checked={selectedMetricas.includes(metricaId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetricas([...selectedMetricas, metricaId]);
                      } else {
                        setSelectedMetricas(selectedMetricas.filter(id => id !== metricaId));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-white text-sm font-mono tracking-wider">{metrica?.metrica?.toUpperCase() || metricaId}</span>
                </label>
              );
            })}
            
            {/* Métricas adicionales disponibles para la entidad */}
            {entidadId && getUniqueOptionsForField('metricaid', { entidadid: entidadId })
              .filter(option => !getMetricasFromSelectedRows().includes(option.value.toString()))
              .map((option) => (
                <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                  <input
                    type="checkbox"
                    checked={selectedMetricas.includes(option.value.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetricas([...selectedMetricas, option.value.toString()]);
                      } else {
                        setSelectedMetricas(selectedMetricas.filter(id => id !== option.value.toString()));
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleUpdate}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors font-mono"
        >
          ➕ GUARDAR
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors font-mono"
        >
          ❌ CANCELAR
        </button>
      </div>
    </div>
  );
}
