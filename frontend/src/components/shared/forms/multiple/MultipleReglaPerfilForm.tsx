import React from 'react';
import ReplicateButton from '../../../shared/ui/buttons/ReplicateButton';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MultipleReglaPerfilFormProps {
  selectedReglas: string[];
  setSelectedReglas: (value: string[]) => void;
  selectedPerfiles: string[];
  setSelectedPerfiles: (value: string[]) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  multipleReglaPerfiles: any[];
  setMultipleReglaPerfiles: (value: any[]) => void;
  reglasData: any[];
  perfilesData: any[];
  reglaPerfilData: any[]; // Datos existentes de regla_perfil
  loading: boolean;
  onInitializeReglaPerfiles: (reglas: string[], perfiles: string[]) => Promise<void>;
  onInsertReglaPerfiles: () => void;
  onCancel: () => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { reglaid?: string; perfilid?: string }) => Array<{value: any, label: string}>;
  // Props para replicación
  onReplicateClick?: () => void;
  // Prop para indicar si estamos en modo replicación (solo una regla)
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

const MultipleReglaPerfilForm: React.FC<MultipleReglaPerfilFormProps> = ({
  selectedReglas,
  setSelectedReglas,
  selectedPerfiles,
  setSelectedPerfiles,
  selectedStatus,
  setSelectedStatus,
  multipleReglaPerfiles,
  setMultipleReglaPerfiles,
  reglasData,
  perfilesData,
  reglaPerfilData,
  loading,
  onInitializeReglaPerfiles,
  onInsertReglaPerfiles,
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
  const { t } = useLanguage();
  const [reglasDropdownOpen, setReglasDropdownOpen] = React.useState(false);
  const [perfilesDropdownOpen, setPerfilesDropdownOpen] = React.useState(false);
  
  // Estados para términos de búsqueda
  const [reglasSearchTerm, setReglasSearchTerm] = React.useState('');
  const [perfilesSearchTerm, setPerfilesSearchTerm] = React.useState('');
  
  // Estados para reglas y perfiles seleccionados con checkboxes
  const [selectedReglasCheckboxes, setSelectedReglasCheckboxes] = React.useState<string[]>([]);
  const [selectedPerfilesCheckboxes, setSelectedPerfilesCheckboxes] = React.useState<string[]>([]);
  const [combinacionesStatus, setCombinacionesStatus] = React.useState<{[key: string]: boolean}>({});

  // Cerrar dropdowns cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setReglasDropdownOpen(false);
        setPerfilesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sincronizar checkboxes con selectedReglas
  React.useEffect(() => {
    if (selectedReglas.length !== selectedReglasCheckboxes.length || 
        !selectedReglas.every(id => selectedReglasCheckboxes.includes(id))) {
      setSelectedReglasCheckboxes(selectedReglas);
    }
  }, [selectedReglas]);

  // Sincronizar checkboxes con selectedPerfiles
  React.useEffect(() => {
    if (selectedPerfiles.length !== selectedPerfilesCheckboxes.length || 
        !selectedPerfiles.every(id => selectedPerfilesCheckboxes.includes(id))) {
      setSelectedPerfilesCheckboxes(selectedPerfiles);
    }
  }, [selectedPerfiles]);

  // Actualizar selectedReglas y selectedPerfiles cuando cambien los checkboxes
  React.useEffect(() => {
    setSelectedReglas(selectedReglasCheckboxes);
  }, [selectedReglasCheckboxes, setSelectedReglas]);

  React.useEffect(() => {
    setSelectedPerfiles(selectedPerfilesCheckboxes);
  }, [selectedPerfilesCheckboxes, setSelectedPerfiles]);

  // Generar las combinaciones para multipleReglaPerfiles
  React.useEffect(() => {
    if (selectedReglasCheckboxes.length > 0 && selectedPerfilesCheckboxes.length > 0) {
      const combinaciones: Array<{
        reglaid: number;
        perfilid: number;
        statusid: number;
      }> = [];
      
      selectedReglasCheckboxes.forEach((reglaId) => {
        selectedPerfilesCheckboxes.forEach((perfilId) => {
          const key = `${reglaId}-${perfilId}`;
          combinaciones.push({
            reglaid: parseInt(reglaId),
            perfilid: parseInt(perfilId),
            statusid: combinacionesStatus[key] !== false ? 1 : 0 // Por defecto true (activo)
          });
        });
      });
      
      setMultipleReglaPerfiles(combinaciones);
    } else {
      setMultipleReglaPerfiles([]);
    }
  }, [selectedReglasCheckboxes, selectedPerfilesCheckboxes, combinacionesStatus, setMultipleReglaPerfiles]);

  // Obtener reglas disponibles (solo activas)
  const getReglasDisponibles = () => {
    return reglasData.filter(regla => regla.statusid === 1);
  };

  // Obtener perfiles disponibles (solo activos)
  const getPerfilesDisponibles = () => {
    return perfilesData.filter(perfil => perfil.statusid === 1);
  };

  // Filtrar reglas por término de búsqueda
  const reglasDisponibles = getReglasDisponibles();
  
  const filteredReglas = reglasDisponibles.filter(regla => {
    const nombreMatch = regla.nombre?.toLowerCase().includes(reglasSearchTerm.toLowerCase());
    return nombreMatch;
  });

  // Filtrar perfiles por término de búsqueda
  const filteredPerfiles = getPerfilesDisponibles().filter(perfil =>
    perfil.perfil?.toLowerCase().includes(perfilesSearchTerm.toLowerCase()) ||
    perfil.descripcion?.toLowerCase().includes(perfilesSearchTerm.toLowerCase())
  );

  const handleReglaToggle = (reglaId: string) => {
    setSelectedReglasCheckboxes(prev => 
      prev.includes(reglaId) 
        ? prev.filter(id => id !== reglaId)
        : [...prev, reglaId]
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

  const handleSelectAllReglas = () => {
    const allReglaIds = filteredReglas.map(r => r.reglaid.toString());
    setSelectedReglasCheckboxes(allReglaIds);
  };

  const handleSelectAllPerfiles = () => {
    const allPerfilIds = filteredPerfiles.map(p => p.perfilid.toString());
    setSelectedPerfilesCheckboxes(allPerfilIds);
  };

  const handleClearAllReglas = () => {
    setSelectedReglasCheckboxes([]);
  };

  const handleClearAllPerfiles = () => {
    setSelectedPerfilesCheckboxes([]);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contenedor 1: Reglas disponibles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              REGLAS DISPONIBLES
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllReglas}
                className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 font-mono"
              >
                SELECCIONAR TODAS
              </button>
              <button
                onClick={handleClearAllReglas}
                className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 font-mono"
              >
                LIMPIAR
              </button>
            </div>
          </div>
          
          <div className="relative dropdown-container">
            <input
              type="text"
              placeholder="Buscar reglas..."
              value={reglasSearchTerm}
              onChange={(e) => setReglasSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            
            <div className="mt-2 max-h-60 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded custom-scrollbar">
              {filteredReglas.map((regla) => (
                <label
                  key={regla.reglaid}
                  className="flex items-center p-3 hover:bg-neutral-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedReglasCheckboxes.includes(regla.reglaid.toString())}
                    onChange={() => handleReglaToggle(regla.reglaid.toString())}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium font-mono">
                      {regla.nombre || `Regla ${regla.reglaid}`}
                    </div>
                  </div>
                </label>
              ))}
              {filteredReglas.length === 0 && (
                <div className="p-3 text-neutral-400 text-center font-mono">
                  {reglasSearchTerm ? 'No se encontraron reglas' : 'No hay reglas disponibles'}
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
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllPerfiles}
                className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 font-mono"
              >
                SELECCIONAR TODOS
              </button>
              <button
                onClick={handleClearAllPerfiles}
                className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 font-mono"
              >
                LIMPIAR
              </button>
            </div>
          </div>
          
          <div className="relative dropdown-container">
            <input
              type="text"
              placeholder="Buscar perfiles..."
              value={perfilesSearchTerm}
              onChange={(e) => setPerfilesSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            
            <div className="mt-2 max-h-60 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded custom-scrollbar">
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
                  {perfilesSearchTerm ? 'No se encontraron perfiles' : 'No hay perfiles disponibles'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Grid de combinaciones */}
      {multipleReglaPerfiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            COMBINACIONES REGLA - PERFIL ({multipleReglaPerfiles.length})
          </h4>
          <div className="max-h-96 overflow-y-auto bg-neutral-800 border border-neutral-600 rounded custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              {multipleReglaPerfiles.map((combinacion, index) => {
                const regla = reglasData.find(r => r.reglaid === combinacion.reglaid);
                const perfil = perfilesData.find(p => p.perfilid === combinacion.perfilid);
                const key = `${combinacion.reglaid}-${combinacion.perfilid}`;
                const isActive = combinacionesStatus[key] !== false;
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      isActive 
                        ? 'bg-green-900 border-green-600' 
                        : 'bg-neutral-700 border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-mono text-sm">
                          {regla?.nombre || `Regla ${combinacion.reglaid}`}
                        </div>
                        <div className="text-neutral-400 font-mono text-xs">
                          {perfil?.perfil || `Perfil ${combinacion.perfilid}`}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handleCombinacionStatusToggle(key)}
                        className="ml-2 text-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onInsertReglaPerfiles}
          disabled={loading || multipleReglaPerfiles.filter(c => c.statusid === 1).length === 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        {/* Botón de replicar */}
        {onReplicateClick && !isReplicateMode && (
          <ReplicateButton
            onClick={onReplicateClick}
            disabled={selectedReglasCheckboxes.length === 0 || selectedPerfilesCheckboxes.length === 0}
          />
        )}
        
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

export default MultipleReglaPerfilForm;

