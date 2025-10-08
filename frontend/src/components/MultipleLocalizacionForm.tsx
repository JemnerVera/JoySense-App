// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface MultipleLocalizacionFormProps {
  selectedUbicaciones: string[];
  setSelectedUbicaciones: (value: string[]) => void;
  selectedNodos: string[];
  setSelectedNodos: (value: string[]) => void;
  selectedEntidades: string[];
  setSelectedEntidades: (value: string[]) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  multipleLocalizaciones: any[];
  setMultipleLocalizaciones: (value: any[]) => void;
  ubicacionesData: any[];
  nodosData: any[];
  entidadesData: any[];
  loading: boolean;
  onInitializeLocalizaciones: (ubicaciones: string[], nodos: string[], entidades: string[]) => Promise<void>;
  onInsertLocalizaciones: () => void;
  onCancel: () => void;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  // Campos adicionales para localización
  latitud?: string;
  setLatitud?: (value: string) => void;
  longitud?: string;
  setLongitud?: (value: string) => void;
  referencia?: string;
  setReferencia?: (value: string) => void;
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

const MultipleLocalizacionForm: React.FC<MultipleLocalizacionFormProps> = ({
  selectedUbicaciones,
  setSelectedUbicaciones,
  selectedNodos,
  setSelectedNodos,
  selectedEntidades,
  setSelectedEntidades,
  selectedStatus,
  setSelectedStatus,
  multipleLocalizaciones,
  setMultipleLocalizaciones,
  ubicacionesData,
  nodosData,
  entidadesData,
  loading,
  onInitializeLocalizaciones,
  onInsertLocalizaciones,
  onCancel,
  // Filtros globales
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData,
  // Campos adicionales
  latitud,
  setLatitud,
  longitud,
  setLongitud,
  referencia,
  setReferencia
}) => {

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [ubicacionesDropdownOpen, setUbicacionesDropdownOpen] = React.useState(false);
  const [nodosDropdownOpen, setNodosDropdownOpen] = React.useState(false);
  const [entidadesDropdownOpen, setEntidadesDropdownOpen] = React.useState(false);
  
  // Estados para términos de búsqueda
  const [ubicacionesSearchTerm, setUbicacionesSearchTerm] = React.useState('');
  const [nodosSearchTerm, setNodosSearchTerm] = React.useState('');
  const [entidadesSearchTerm, setEntidadesSearchTerm] = React.useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cerrar dropdowns cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setUbicacionesDropdownOpen(false);
        setNodosDropdownOpen(false);
        setEntidadesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Agregar useEffect para generar combinaciones automáticamente
  React.useEffect(() => {
    if (selectedUbicaciones.length > 0 && selectedNodos.length > 0 && selectedEntidades.length > 0) {
      // Generar combinaciones automáticamente cuando se seleccionen ubicaciones, nodos y entidades
      onInitializeLocalizaciones(selectedUbicaciones, selectedNodos, selectedEntidades).catch(console.error);
    } else {
      // Limpiar localizaciones si no hay selección completa
      setMultipleLocalizaciones([]);
    }
  }, [selectedUbicaciones, selectedNodos, selectedEntidades, onInitializeLocalizaciones]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Función para obtener el nombre de un país por ID
  const getPaisName = (paisId: string) => {
    const pais = paisesData?.find(p => p.paisid.toString() === paisId);
    return pais ? pais.pais : `País ${paisId}`;
  };

  // Función para obtener el nombre de una empresa por ID
  const getEmpresaName = (empresaId: string) => {
    const empresa = empresasData?.find(e => e.empresaid.toString() === empresaId);
    return empresa ? empresa.empresa : `Empresa ${empresaId}`;
  };

  // Función para obtener el nombre de un fundo por ID
  const getFundoName = (fundoId: string) => {
    const fundo = fundosData?.find(f => f.fundoid.toString() === fundoId);
    return fundo ? fundo.fundo : `Fundo ${fundoId}`;
  };

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = () => {
    const contextualFields = [];
    
    if (paisSeleccionado) {
      contextualFields.push(
        <div key="pais-contextual" className="bg-neutral-800/50 border border-neutral-600 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono tracking-wider">
            PAÍS
          </label>
          <div className="text-white font-mono text-sm bg-neutral-700 p-3 rounded border border-neutral-500">
            {getPaisName(paisSeleccionado)}
          </div>
        </div>
      );
    }
    
    if (empresaSeleccionada) {
      contextualFields.push(
        <div key="empresa-contextual" className="bg-neutral-800/50 border border-neutral-600 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono tracking-wider">
            EMPRESA
          </label>
          <div className="text-white font-mono text-sm bg-neutral-700 p-3 rounded border border-neutral-500">
            {getEmpresaName(empresaSeleccionada)}
          </div>
        </div>
      );
    }
    
    if (fundoSeleccionado) {
      contextualFields.push(
        <div key="fundo-contextual" className="bg-neutral-800/50 border border-neutral-600 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono tracking-wider">
            FUNDO
          </label>
          <div className="text-white font-mono text-sm bg-neutral-700 p-3 rounded border border-neutral-500">
            {getFundoName(fundoSeleccionado)}
          </div>
        </div>
      );
    }

    if (contextualFields.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {contextualFields}
        </div>
      );
    }
    return null;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      
      {/* Fila contextual con filtros globales */}
      {renderContextualRow()}
      
      {/* Selección de Ubicaciones, Nodos, Entidades y Status */}
      <div className="space-y-6">
        {/* Segunda fila: Entidad, Ubicación, Nodo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">ENTIDAD</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setEntidadesDropdownOpen(!entidadesDropdownOpen)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
          >
            <span className={selectedEntidades.length > 0 ? 'text-white' : 'text-neutral-400'}>
              {selectedEntidades.length > 0 
                ? selectedEntidades.map(id => {
                    const entidad = entidadesData.find(e => e.entidadid.toString() === id);
                    return entidad ? entidad.entidad.toUpperCase() : id;
                  }).join(', ')
                 : 'SELECCIONAR ENTIDAD'
              }
            </span>
            <span className="text-neutral-400">▼</span>
          </div>
          
          {entidadesDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={entidadesSearchTerm}
                  onChange={(e) => setEntidadesSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-24 overflow-y-auto custom-scrollbar">
                {entidadesData
                  .filter(entidad => 
                    entidad.entidad.toLowerCase().includes(entidadesSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => a.entidad.localeCompare(b.entidad))
                  .map(entidad => (
                  <label
                    key={entidad.entidadid}
                    className="flex items-center px-3 py-2 hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntidades.includes(entidad.entidadid.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntidades([...selectedEntidades, entidad.entidadid.toString()]);
                        } else {
                          setSelectedEntidades(selectedEntidades.filter(id => id !== entidad.entidadid.toString()));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">{entidad.entidad.toUpperCase()}</span>
                  </label>
                ))}
                {entidadesData.filter(entidad => 
                  entidad.entidad.toLowerCase().includes(entidadesSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                    NO SE ENCONTRARON RESULTADOS
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>

        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">UBICACIÓN</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setUbicacionesDropdownOpen(!ubicacionesDropdownOpen)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
          >
            <span className={selectedUbicaciones.length > 0 ? 'text-white' : 'text-neutral-400'}>
              {selectedUbicaciones.length > 0 
                ? selectedUbicaciones.map(id => {
                    const ubicacion = ubicacionesData.find(u => u.ubicacionid.toString() === id);
                    return ubicacion ? ubicacion.ubicacion.toUpperCase() : id;
                  }).join(', ')
                 : 'SELECCIONAR UBICACIÓN'
              }
            </span>
            <span className="text-neutral-400">▼</span>
          </div>
          
          {ubicacionesDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={ubicacionesSearchTerm}
                  onChange={(e) => setUbicacionesSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-24 overflow-y-auto custom-scrollbar">
                {ubicacionesData
                  .filter(ubicacion => 
                    ubicacion.ubicacion.toLowerCase().includes(ubicacionesSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion))
                  .map(ubicacion => (
                  <label
                    key={ubicacion.ubicacionid}
                    className="flex items-center px-3 py-2 hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUbicaciones.includes(ubicacion.ubicacionid.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUbicaciones([...selectedUbicaciones, ubicacion.ubicacionid.toString()]);
                        } else {
                          setSelectedUbicaciones(selectedUbicaciones.filter(id => id !== ubicacion.ubicacionid.toString()));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">{ubicacion.ubicacion.toUpperCase()}</span>
                  </label>
                ))}
                {ubicacionesData.filter(ubicacion => 
                  ubicacion.ubicacion.toLowerCase().includes(ubicacionesSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                    NO SE ENCONTRARON RESULTADOS
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>

        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">NODO</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setNodosDropdownOpen(!nodosDropdownOpen)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
          >
            <span className={selectedNodos.length > 0 ? 'text-white' : 'text-neutral-400'}>
              {selectedNodos.length > 0 
                ? selectedNodos.map(id => {
                    const nodo = nodosData.find(n => n.nodoid.toString() === id);
                    return nodo ? nodo.nodo.toUpperCase() : id;
                  }).join(', ')
                 : 'SELECCIONAR NODO'
              }
            </span>
            <span className="text-neutral-400">▼</span>
          </div>
          
          {nodosDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={nodosSearchTerm}
                  onChange={(e) => setNodosSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-24 overflow-y-auto custom-scrollbar">
                {nodosData
                  .filter(nodo => 
                    nodo.nodo.toLowerCase().includes(nodosSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => a.nodo.localeCompare(b.nodo))
                  .map(nodo => (
                  <label
                    key={nodo.nodoid}
                    className="flex items-center px-3 py-2 hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNodos.includes(nodo.nodoid.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNodos([...selectedNodos, nodo.nodoid.toString()]);
                        } else {
                          setSelectedNodos(selectedNodos.filter(id => id !== nodo.nodoid.toString()));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">{nodo.nodo.toUpperCase()}</span>
                  </label>
                ))}
                {nodosData.filter(nodo => 
                  nodo.nodo.toLowerCase().includes(nodosSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                    NO SE ENCONTRARON RESULTADOS
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
        </div>

      </div>

      {/* Vista previa de localizaciones a crear */}
      {multipleLocalizaciones.length > 0 && (
        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
            LOCALIZACIONES A CREAR: {multipleLocalizaciones.length} ENTRADAS
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {multipleLocalizaciones.map((localizacion, index) => (
              <div key={index} className="bg-neutral-700 border border-neutral-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-orange-500 font-bold font-mono">#{index + 1}</span>
                    <span className="text-white text-sm font-mono">
                      UBICACIÓN: {ubicacionesData.find(u => u.ubicacionid.toString() === localizacion.ubicacionid.toString())?.ubicacion?.toUpperCase() || localizacion.ubicacionid}
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-white text-sm font-mono">
                      NODO: {nodosData.find(n => n.nodoid.toString() === localizacion.nodoid.toString())?.nodo?.toUpperCase() || localizacion.nodoid}
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-white text-sm font-mono">
                      ENTIDAD: {entidadesData.find(e => e.entidadid.toString() === localizacion.entidadid.toString())?.entidad?.toUpperCase() || localizacion.entidadid}
                    </span>
                  </div>
                  <span className="text-orange-500">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tercera fila: Campos de coordenadas - Latitud, Longitud, Referencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            LATITUD
          </label>
          <input
            type="text"
            value={latitud || ''}
            onChange={(e) => setLatitud?.(e.target.value)}
            placeholder="Ej: -12.0464"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          />
        </div>
        
        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            LONGITUD
          </label>
          <input
            type="text"
            value={longitud || ''}
            onChange={(e) => setLongitud?.(e.target.value)}
            placeholder="Ej: -77.0428"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          />
        </div>
        
        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            REFERENCIA
          </label>
          <input
            type="text"
            value={referencia || ''}
            onChange={(e) => setReferencia?.(e.target.value)}
            placeholder="Ej: Cerca del portón principal"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          />
        </div>
      </div>

      {/* Cuarta fila: Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div></div> {/* Espacio vacío */}
        <div></div> {/* Espacio vacío */}
        <div>
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">STATUS</label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="localizacion-status"
              checked={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.checked)}
              className="w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="text-white font-mono tracking-wider">
              {selectedStatus ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={onInsertLocalizaciones}
          disabled={loading || multipleLocalizaciones.length === 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
};

export default MultipleLocalizacionForm;
