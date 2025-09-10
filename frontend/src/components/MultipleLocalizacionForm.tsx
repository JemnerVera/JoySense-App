import React from 'react';

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
}

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
  onCancel
}) => {
  const [ubicacionesDropdownOpen, setUbicacionesDropdownOpen] = React.useState(false);
  const [nodosDropdownOpen, setNodosDropdownOpen] = React.useState(false);
  const [entidadesDropdownOpen, setEntidadesDropdownOpen] = React.useState(false);

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

  return (
    <div className="space-y-6">
      {/* Selección de Ubicaciones, Nodos, Entidades y Status */}
      <div className="space-y-6">
        {/* Primera fila: Ubicación, Nodo, Entidad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-lg font-bold text-white mb-2">Ubicación</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setUbicacionesDropdownOpen(!ubicacionesDropdownOpen)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-opacity-80 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
          >
            <span className={selectedUbicaciones.length > 0 ? 'text-white' : 'text-gray-400'}>
              {selectedUbicaciones.length > 0 
                ? selectedUbicaciones.map(id => {
                    const ubicacion = ubicacionesData.find(u => u.ubicacionid.toString() === id);
                    return ubicacion ? ubicacion.ubicacion : id;
                  }).join(', ')
                 : 'Seleccionar ubicacion'
              }
            </span>
            <span className="text-gray-400">▼</span>
          </div>
          
          {ubicacionesDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {ubicacionesData
                .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion))
                .map(ubicacion => (
                  <label
                    key={ubicacion.ubicacionid}
                    className="flex items-center px-3 py-2 hover:bg-gray-500 cursor-pointer"
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
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-opacity-80 text-sm">{ubicacion.ubicacion}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
        </div>

        <div>
          <label className="block text-lg font-bold text-white mb-2">Nodo</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setNodosDropdownOpen(!nodosDropdownOpen)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-opacity-80 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
          >
            <span className={selectedNodos.length > 0 ? 'text-white' : 'text-gray-400'}>
              {selectedNodos.length > 0 
                ? selectedNodos.map(id => {
                    const nodo = nodosData.find(n => n.nodoid.toString() === id);
                    return nodo ? nodo.nodo : id;
                  }).join(', ')
                 : 'Seleccionar nodo'
              }
            </span>
            <span className="text-gray-400">▼</span>
          </div>
          
          {nodosDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {nodosData
                .sort((a, b) => a.nodo.localeCompare(b.nodo))
                .map(nodo => (
                  <label
                    key={nodo.nodoid}
                    className="flex items-center px-3 py-2 hover:bg-gray-500 cursor-pointer"
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
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-opacity-80 text-sm">{nodo.nodo}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
        </div>

        <div>
          <label className="block text-lg font-bold text-white mb-2">Entidad</label>
        <div className="relative dropdown-container">
          <div
            onClick={() => setEntidadesDropdownOpen(!entidadesDropdownOpen)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-opacity-80 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
          >
            <span className={selectedEntidades.length > 0 ? 'text-white' : 'text-gray-400'}>
              {selectedEntidades.length > 0 
                ? selectedEntidades.map(id => {
                    const entidad = entidadesData.find(e => e.entidadid.toString() === id);
                    return entidad ? entidad.entidad : id;
                  }).join(', ')
                 : 'Seleccionar entidad'
              }
            </span>
            <span className="text-gray-400">▼</span>
          </div>
          
          {entidadesDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {entidadesData
                .sort((a, b) => a.entidad.localeCompare(b.entidad))
                .map(entidad => (
                  <label
                    key={entidad.entidadid}
                    className="flex items-center px-3 py-2 hover:bg-gray-500 cursor-pointer"
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
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-opacity-80 text-sm">{entidad.entidad}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
        </div>
        </div>

        {/* Segunda fila: Status al extremo derecho */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div></div> {/* Espacio vacío */}
          <div></div> {/* Espacio vacío */}
          <div>
            <label className="block text-lg font-bold text-white mb-2">Status</label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="localizacion-status"
                checked={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.checked)}
                className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-white">
                {selectedStatus ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa de localizaciones a crear */}
      {multipleLocalizaciones.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-bold text-white mb-4">
            Localizaciones a crear:
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {multipleLocalizaciones.map((localizacion, index) => (
              <div key={index} className="bg-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 font-bold">#{index + 1}</span>
                    <span className="text-white text-sm">
                      Ubicación: {ubicacionesData.find(u => u.ubicacionid.toString() === localizacion.ubicacionid.toString())?.ubicacion || localizacion.ubicacionid}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-white text-sm">
                      Nodo: {nodosData.find(n => n.nodoid.toString() === localizacion.nodoid.toString())?.nodo || localizacion.nodoid}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-white text-sm">
                      Entidad: {entidadesData.find(e => e.entidadid.toString() === localizacion.entidadid.toString())?.entidad || localizacion.entidadid}
                    </span>
                  </div>
                  <span className="text-green-400">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={onInsertLocalizaciones}
          disabled={loading || multipleLocalizaciones.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>➕</span>
          <span>{loading ? 'Guardando...' : `Guardar`}</span>
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
        >
          <span>❌</span>
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
};

export default MultipleLocalizacionForm;
