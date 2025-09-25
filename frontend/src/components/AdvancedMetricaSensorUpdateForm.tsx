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
  
  // console.log('🔍 Debug - Filas seleccionadas:', selectedRows);
  // console.log('🔍 Debug - Primer tipoid:', selectedRows[0]?.tipoid);
  // console.log('🔍 Debug - Entidad encontrada:', entidad);
  
  // Estados para los tipos, nodos y métricas seleccionados
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedNodos, setSelectedNodos] = useState<string[]>([]);
  const [selectedMetricas, setSelectedMetricas] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
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
    
    // Extraer nodoid únicos de las filas seleccionadas (solo los nodos que están en las filas seleccionadas)
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
      
      // console.log('🔍 Debug - Tipos extraídos:', tiposUnicos);
      // console.log('🔍 Debug - Nodos extraídos:', nodosUnicos);
      // console.log('🔍 Debug - Métricas extraídas:', metricasUnicas);
      // console.log('🔍 Debug - Filas seleccionadas completas:', selectedRows);
      
      // Debug: Mostrar el status de las filas originales
      const allOriginalRows = selectedRows.flatMap(row => row.originalRows || [row]);
      // console.log('🔍 Debug - Filas originales con status:', allOriginalRows.map(row => ({
      //   nodoid: row.nodoid,
      //   tipoid: row.tipoid,
      //   metricaid: row.metricaid,
      //   statusid: row.statusid
      // })));
      
      setSelectedTipos(tiposUnicos);
      setSelectedNodos(nodosUnicos);
      setSelectedMetricas(metricasUnicas);
    }
  }, [selectedRows.length, selectedRows[0]?.tipoid, selectedRows[0]?.nodoid, selectedRows[0]?.metricaid]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Crear las entradas actualizadas
      const updatedEntries: any[] = [];
      const firstRow = selectedRows[0]; // Obtener la primera fila para datos de auditoría
    
    // Obtener todas las filas originales (individuales) de las filas agrupadas
    const allOriginalRows = selectedRows.flatMap(row => row.originalRows || [row]);
    
    console.log('🔍 Debug - handleUpdate:', {
      selectedNodos,
      selectedTipos,
      selectedMetricas,
      selectedRowsLength: selectedRows.length,
      allOriginalRows: allOriginalRows.map(row => ({
        nodoid: row.nodoid,
        tipoid: row.tipoid,
        metricaid: row.metricaid,
        statusid: row.statusid
      }))
    });
    
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
            // Crear nueva entrada solo si no existe
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
          statusid: 0, // Inactivo
          usermodifiedid: firstRow?.usermodifiedid,
          datemodified: new Date().toISOString()
        });
      }
    });
    
    console.log('🔍 Debug - Entradas actualizadas:', updatedEntries.length);
      console.log('🔍 Debug - Entradas a enviar:', updatedEntries.map(entry => ({
        nodoid: entry.nodoid,
        tipoid: entry.tipoid,
        metricaid: entry.metricaid,
        statusid: entry.statusid,
        isNew: !entry.usercreatedid ? 'NUEVA' : 'EXISTENTE'
      })));
      
      await onUpdate(updatedEntries);
    } catch (error) {
      console.error('❌ Error en handleUpdate:', error);
    } finally {
      setIsUpdating(false);
    }
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

      {/* Tipos - Solo lectura (no se puede cambiar el tipo) */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          TIPO 🔒
        </label>
        <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
          {selectedTipos.length > 0 
            ? selectedTipos.map(id => {
                const tipo = tiposData.find(t => t.tipoid.toString() === id);
                return tipo ? tipo.tipo : id;
              }).join(', ')
            : 'NO HAY TIPOS SELECCIONADOS'
          }
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
                        // No permitir desmarcar nodos ya seleccionados (no se puede cambiar el nodo)
                        // Los nodos seleccionados permanecen marcados
                      }
                    }}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-white text-sm font-mono tracking-wider">{nodo?.nodo?.toUpperCase() || nodoId}</span>
                  {/* Icono de candado para nodos que no se pueden desmarcar */}
                  {selectedNodos.includes(nodoId) && (
                    <span className="ml-auto text-orange-500 text-sm">🔒</span>
                  )}
                </label>
              );
            })}
            
            {/* Solo mostrar nodos de las filas seleccionadas - no nodos adicionales */}
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
          disabled={isUpdating}
          className={`px-6 py-2 text-white font-bold rounded-lg transition-all duration-200 font-mono flex items-center space-x-2 ${
            isUpdating 
              ? 'bg-orange-400 cursor-not-allowed opacity-75' 
              : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 active:scale-95'
          }`}
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>GUARDANDO...</span>
            </>
          ) : (
            <>
              <span>➕</span>
              <span>GUARDAR</span>
            </>
          )}
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
