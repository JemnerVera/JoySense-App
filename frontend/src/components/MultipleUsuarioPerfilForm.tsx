import React from 'react';
import ReplicateButton from './ReplicateButton';

interface MultipleUsuarioPerfilFormProps {
  selectedUsuarios: string[];
  setSelectedUsuarios: (value: string[]) => void;
  selectedPerfiles: string[];
  setSelectedPerfiles: (value: string[]) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  multipleUsuarioPerfiles: any[];
  setMultipleUsuarioPerfiles: (value: any[]) => void;
  usuariosData: any[];
  perfilesData: any[];
  loading: boolean;
  onInitializeUsuarioPerfiles: (usuarios: string[], perfiles: string[]) => Promise<void>;
  onInsertUsuarioPerfiles: () => void;
  onCancel: () => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { usuarioid?: string; perfilid?: string }) => Array<{value: any, label: string}>;
  // Props para replicación
  onReplicateClick?: () => void;
  // Prop para indicar si estamos en modo replicación (solo un usuario)
  isReplicateMode?: boolean;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
}

const MultipleUsuarioPerfilForm: React.FC<MultipleUsuarioPerfilFormProps> = ({
  selectedUsuarios,
  setSelectedUsuarios,
  selectedPerfiles,
  setSelectedPerfiles,
  selectedStatus,
  setSelectedStatus,
  multipleUsuarioPerfiles,
  setMultipleUsuarioPerfiles,
  usuariosData,
  perfilesData,
  loading,
  onInitializeUsuarioPerfiles,
  onInsertUsuarioPerfiles,
  onCancel,
  getUniqueOptionsForField,
  // Props para replicación
  onReplicateClick,
  isReplicateMode = false,
  // Filtros globales
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData
}) => {
  const [usuariosDropdownOpen, setUsuariosDropdownOpen] = React.useState(false);
  const [perfilesDropdownOpen, setPerfilesDropdownOpen] = React.useState(false);
  
  // Estados para términos de búsqueda
  const [usuariosSearchTerm, setUsuariosSearchTerm] = React.useState('');
  const [perfilesSearchTerm, setPerfilesSearchTerm] = React.useState('');
  
  // Estados para usuarios y perfiles seleccionados con checkboxes
  const [selectedUsuariosCheckboxes, setSelectedUsuariosCheckboxes] = React.useState<string[]>([]);
  const [selectedPerfilesCheckboxes, setSelectedPerfilesCheckboxes] = React.useState<string[]>([]);
  const [combinacionesStatus, setCombinacionesStatus] = React.useState<{[key: string]: boolean}>({});

  // Cerrar dropdowns cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setUsuariosDropdownOpen(false);
        setPerfilesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sincronizar checkboxes con selectedUsuarios
  React.useEffect(() => {
    if (selectedUsuarios.length !== selectedUsuariosCheckboxes.length || 
        !selectedUsuarios.every(id => selectedUsuariosCheckboxes.includes(id))) {
      setSelectedUsuariosCheckboxes(selectedUsuarios);
    }
  }, [selectedUsuarios]);

  // Sincronizar checkboxes con selectedPerfiles
  React.useEffect(() => {
    if (selectedPerfiles.length !== selectedPerfilesCheckboxes.length || 
        !selectedPerfiles.every(id => selectedPerfilesCheckboxes.includes(id))) {
      setSelectedPerfilesCheckboxes(selectedPerfiles);
    }
  }, [selectedPerfiles]);

  // Actualizar selectedUsuarios y selectedPerfiles cuando cambien los checkboxes
  React.useEffect(() => {
    setSelectedUsuarios(selectedUsuariosCheckboxes);
  }, [selectedUsuariosCheckboxes]);

  React.useEffect(() => {
    setSelectedPerfiles(selectedPerfilesCheckboxes);
  }, [selectedPerfilesCheckboxes]);

  // Generar las combinaciones para multipleUsuarioPerfiles
  React.useEffect(() => {
    if (selectedUsuariosCheckboxes.length > 0 && selectedPerfilesCheckboxes.length > 0) {
      const combinaciones: Array<{
        usuarioid: number;
        perfilid: number;
        statusid: number;
      }> = [];
      
      selectedUsuariosCheckboxes.forEach((usuarioId) => {
        selectedPerfilesCheckboxes.forEach((perfilId) => {
          const key = `${usuarioId}-${perfilId}`;
          combinaciones.push({
            usuarioid: parseInt(usuarioId),
            perfilid: parseInt(perfilId),
            statusid: combinacionesStatus[key] !== false ? 1 : 0 // Por defecto true (activo)
          });
        });
      });
      
      setMultipleUsuarioPerfiles(combinaciones);
    } else {
      setMultipleUsuarioPerfiles([]);
    }
  }, [selectedUsuariosCheckboxes, selectedPerfilesCheckboxes, combinacionesStatus]);

  // Obtener usuarios que no tienen perfil asignado
  const getUsuariosSinPerfil = () => {
    const usuariosConPerfil = new Set(
      multipleUsuarioPerfiles
        .filter(up => up.statusid === 1)
        .map(up => up.usuarioid)
    );
    
    return usuariosData.filter(usuario => 
      !usuariosConPerfil.has(usuario.usuarioid) && 
      usuario.statusid === 1
    );
  };

  // Obtener perfiles disponibles
  const getPerfilesDisponibles = () => {
    return perfilesData.filter(perfil => perfil.statusid === 1);
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsuarios = getUsuariosSinPerfil().filter(usuario =>
    usuario.nombre?.toLowerCase().includes(usuariosSearchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(usuariosSearchTerm.toLowerCase())
  );

  // Filtrar perfiles por término de búsqueda
  const filteredPerfiles = getPerfilesDisponibles().filter(perfil =>
    perfil.perfil?.toLowerCase().includes(perfilesSearchTerm.toLowerCase()) ||
    perfil.descripcion?.toLowerCase().includes(perfilesSearchTerm.toLowerCase())
  );

  const handleUsuarioToggle = (usuarioId: string) => {
    setSelectedUsuariosCheckboxes(prev => 
      prev.includes(usuarioId) 
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  const handlePerfilToggle = (perfilId: string) => {
    setSelectedPerfilesCheckboxes(prev => 
      prev.includes(perfilId) 
        ? prev.filter(id => id !== perfilId)
        : [...prev, perfilId]
    );
  };

  const handleCombinacionStatusToggle = (key: string) => {
    setCombinacionesStatus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllUsuarios = () => {
    const allUsuarioIds = filteredUsuarios.map(u => u.usuarioid.toString());
    setSelectedUsuariosCheckboxes(allUsuarioIds);
  };

  const handleSelectAllPerfiles = () => {
    const allPerfilIds = filteredPerfiles.map(p => p.perfilid.toString());
    setSelectedPerfilesCheckboxes(allPerfilIds);
  };

  const handleClearAllUsuarios = () => {
    setSelectedUsuariosCheckboxes([]);
  };

  const handleClearAllPerfiles = () => {
    setSelectedPerfilesCheckboxes([]);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenedor 1: Usuarios sin perfil */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              USUARIOS SIN PERFIL
            </h4>
          </div>
          
          <div className="relative dropdown-container">
            <input
              type="text"
              placeholder="BUSCAR USUARIOS..."
              value={usuariosSearchTerm}
              onChange={(e) => setUsuariosSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            
            <div className="mt-2 max-h-60 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded">
              {filteredUsuarios.map((usuario) => (
                <label
                  key={usuario.usuarioid}
                  className="flex items-center p-3 hover:bg-neutral-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsuariosCheckboxes.includes(usuario.usuarioid.toString())}
                    onChange={() => handleUsuarioToggle(usuario.usuarioid.toString())}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium font-mono">{usuario.nombre}</div>
                    <div className="text-neutral-400 text-sm font-mono">{usuario.email}</div>
                  </div>
                </label>
              ))}
              {filteredUsuarios.length === 0 && (
                <div className="p-3 text-neutral-400 text-center font-mono">
                  {usuariosSearchTerm ? 'NO SE ENCONTRARON USUARIOS' : 'NO HAY USUARIOS SIN PERFIL'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenedor 2: Perfiles disponibles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              PERFILES DISPONIBLES
            </h4>
          </div>
          
          <div className="relative dropdown-container">
            <input
              type="text"
              placeholder="BUSCAR PERFILES..."
              value={perfilesSearchTerm}
              onChange={(e) => setPerfilesSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            
            <div className="mt-2 max-h-60 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded">
              {filteredPerfiles.map((perfil) => (
                <label
                  key={perfil.perfilid}
                  className="flex items-center p-3 hover:bg-neutral-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPerfilesCheckboxes.includes(perfil.perfilid.toString())}
                    onChange={() => handlePerfilToggle(perfil.perfilid.toString())}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium font-mono">{perfil.perfil}</div>
                    <div className="text-neutral-400 text-sm font-mono">{perfil.descripcion}</div>
                  </div>
                </label>
              ))}
              {filteredPerfiles.length === 0 && (
                <div className="p-3 text-neutral-400 text-center font-mono">
                  {perfilesSearchTerm ? 'NO SE ENCONTRARON PERFILES' : 'NO HAY PERFILES DISPONIBLES'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenedor 3: Combinaciones generadas */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
            COMBINACIONES GENERADAS
          </h4>
          
          <div className="max-h-60 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded">
            {multipleUsuarioPerfiles.length > 0 ? (
              multipleUsuarioPerfiles.map((combinacion, index) => {
                const usuario = usuariosData.find(u => u.usuarioid === combinacion.usuarioid);
                const perfil = perfilesData.find(p => p.perfilid === combinacion.perfilid);
                const key = `${combinacion.usuarioid}-${combinacion.perfilid}`;
                
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border-b border-neutral-700 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {usuario?.nombre || `Usuario ${combinacion.usuarioid}`}
                      </div>
                      <div className="text-neutral-400 text-sm">
                        {perfil?.perfil || `Perfil ${combinacion.perfilid}`}
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={combinacionesStatus[key] !== false}
                        onChange={() => handleCombinacionStatusToggle(key)}
                        className="mr-2 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-neutral-400">
                        {combinacionesStatus[key] !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-neutral-400 text-center font-mono">
                SELECCIONA USUARIOS Y PERFILES PARA GENERAR COMBINACIONES
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onInsertUsuarioPerfiles}
          disabled={loading || multipleUsuarioPerfiles.length === 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        {/* Botón de replicar */}
        {onReplicateClick && !isReplicateMode && (
          <ReplicateButton
            onClick={onReplicateClick}
            disabled={selectedUsuariosCheckboxes.length === 0 || selectedPerfilesCheckboxes.length === 0}
          />
        )}
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
};

export default MultipleUsuarioPerfilForm;
