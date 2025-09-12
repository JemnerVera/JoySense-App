import React, { useState, useMemo } from 'react';

interface AdvancedUsuarioPerfilUpdateFormProps {
  selectedRows: any[];
  onUpdate: (updatedEntries: any[]) => Promise<void>;
  onCancel: () => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { usuarioid?: string; perfilid?: string }) => Array<{value: any, label: string}>;
  usuariosData: any[];
  perfilesData: any[];
}

export function AdvancedUsuarioPerfilUpdateForm({
  selectedRows,
  onUpdate,
  onCancel,
  getUniqueOptionsForField,
  usuariosData,
  perfilesData
}: AdvancedUsuarioPerfilUpdateFormProps) {
  
  const getUsuarioFromSelectedRows = () => {
    if (selectedRows.length === 0) return null;
    
    // Obtener el primer usuarioid de las filas seleccionadas
    const firstUsuarioid = selectedRows[0]?.usuarioid;
    if (!firstUsuarioid) return null;
    
    // Buscar el usuario
    const usuario = usuariosData.find(u => u.usuarioid === firstUsuarioid);
    return usuario;
  };
  
  const usuario = useMemo(() => getUsuarioFromSelectedRows(), [selectedRows]);
  const usuarioid = usuario?.usuarioid;
  
  // Estados para los perfiles seleccionados
  const [selectedPerfiles, setSelectedPerfiles] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para dropdowns
  const [perfilesDropdownOpen, setPerfilesDropdownOpen] = useState(false);
  
  // Estados para búsqueda
  const [perfilesSearchTerm, setPerfilesSearchTerm] = useState('');

  // Función robusta para obtener perfiles únicos de las filas seleccionadas
  const getUniquePerfilesFromRows = () => {
    const perfilesSet = new Set<number>();
    selectedRows.forEach(row => {
      if (row.perfilid) {
        perfilesSet.add(row.perfilid);
      }
    });
    return Array.from(perfilesSet).map(perfilid => perfilid.toString());
  };

  // Obtener perfiles únicos de las filas seleccionadas
  const uniquePerfiles = useMemo(() => getUniquePerfilesFromRows(), [selectedRows]);

  // Inicializar perfiles seleccionados con los de las filas seleccionadas
  React.useEffect(() => {
    if (uniquePerfiles.length > 0) {
      setSelectedPerfiles(uniquePerfiles);
    }
  }, [uniquePerfiles]);

  // Obtener perfiles disponibles para el usuario
  const getPerfilesDisponibles = () => {
    return perfilesData.filter(perfil => perfil.statusid === 1);
  };

  // Filtrar perfiles por término de búsqueda
  const filteredPerfiles = getPerfilesDisponibles().filter(perfil =>
    perfil.perfil?.toLowerCase().includes(perfilesSearchTerm.toLowerCase()) ||
    perfil.descripcion?.toLowerCase().includes(perfilesSearchTerm.toLowerCase())
  );

  const handlePerfilToggle = (perfilId: string) => {
    setSelectedPerfiles(prev => 
      prev.includes(perfilId) 
        ? prev.filter(id => id !== perfilId)
        : [...prev, perfilId]
    );
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Crear entradas para actualizar
      const updatedEntries = selectedRows.map(originalRow => {
        const perfilId = originalRow.perfilid;
        const isSelected = selectedPerfiles.includes(perfilId.toString());
        
        return {
          usuarioid: originalRow.usuarioid,
          perfilid: originalRow.perfilid,
          statusid: isSelected ? 1 : 0, // 1 = activo, 0 = inactivo
          usercreatedid: originalRow.usercreatedid,
          datecreated: originalRow.datecreated,
          usermodifiedid: originalRow.usermodifiedid,
          datemodified: new Date().toISOString()
        };
      });
      
      console.log('🔍 Debug - Entradas actualizadas:', updatedEntries.length);
      console.log('🔍 Debug - Entradas a enviar:', updatedEntries.map(entry => ({
        usuarioid: entry.usuarioid,
        perfilid: entry.perfilid,
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
        ACTUALIZAR USUARIO PERFIL
      </h3>
      
      {/* Usuario (solo lectura) */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          USUARIO
        </label>
        <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-400 font-mono">
          {usuario?.nombre || 'N/A'} ({usuario?.email || 'N/A'})
        </div>
      </div>

      {/* Perfiles */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          PERFILES
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPerfilesDropdownOpen(!perfilesDropdownOpen)}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500 hover:bg-neutral-600 transition-colors"
          >
            {selectedPerfiles.length > 0 
              ? `${selectedPerfiles.length} perfil(es) seleccionado(s)`
              : 'Seleccionar perfiles...'
            }
          </button>
          
          {perfilesDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-600 rounded shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Buscar perfiles..."
                  value={perfilesSearchTerm}
                  onChange={(e) => setPerfilesSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredPerfiles.map((perfil) => (
                  <label
                    key={perfil.perfilid}
                    className="flex items-center p-3 hover:bg-neutral-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPerfiles.includes(perfil.perfilid.toString())}
                      onChange={() => handlePerfilToggle(perfil.perfilid.toString())}
                      className="mr-3 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{perfil.perfil}</div>
                      <div className="text-neutral-400 text-sm">{perfil.descripcion}</div>
                    </div>
                  </label>
                ))}
                {filteredPerfiles.length === 0 && (
                  <div className="p-3 text-neutral-400 text-center">
                    {perfilesSearchTerm ? 'No se encontraron perfiles' : 'No hay perfiles disponibles'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información de las filas seleccionadas */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-orange-500 mb-3 font-mono tracking-wider">
          COMBINACIONES SELECCIONADAS
        </h4>
        <div className="bg-neutral-800 border border-neutral-600 rounded p-4">
          <div className="space-y-2">
            {selectedRows.map((row, index) => {
              const perfil = perfilesData.find(p => p.perfilid === row.perfilid);
              const isSelected = selectedPerfiles.includes(row.perfilid.toString());
              
              return (
                <div
                  key={`${row.usuarioid}-${row.perfilid}`}
                  className={`flex items-center justify-between p-2 rounded ${
                    isSelected ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {perfil?.perfil || `Perfil ${row.perfilid}`}
                    </div>
                    <div className="text-neutral-400 text-sm">
                      {perfil?.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isSelected ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdating ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
