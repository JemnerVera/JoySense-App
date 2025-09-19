import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useSimpleChangeDetection } from '../hooks/useSimpleChangeDetection';

interface ProtectedTableSelectorProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  formData: Record<string, any>;
  multipleData: any[];
  massiveFormData?: Record<string, any>;
}

const ProtectedTableSelector: React.FC<ProtectedTableSelectorProps> = ({
  selectedTable,
  onTableSelect,
  activeSubTab,
  formData,
  multipleData,
  massiveFormData = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showModal } = useModal();
  const { hasSignificantChanges } = useSimpleChangeDetection();

  // Definir los grupos de tablas
  const tableGroups = {
    // Grupo 1: Estructura organizacional
    group1: [
      { value: 'pais', label: 'País' },
      { value: 'empresa', label: 'Empresa' },
      { value: 'fundo', label: 'Fundo' },
      { value: 'ubicacion', label: 'Ubicación' },
      { value: 'localizacion', label: 'Localización' },
      { value: 'entidad', label: 'Entidad' }
    ],
    
    // Grupo 2: Tipos y dispositivos
    group2: [
      { value: 'tipo', label: 'Tipo' },
      { value: 'nodo', label: 'Nodo' },
      { value: 'sensor', label: 'Sensor' },
      { value: 'metricasensor', label: 'Métrica Sensor' },
      { value: 'metrica', label: 'Métrica' }
    ],
    
    // Grupo 3: Umbrales y configuraciones
    group3: [
      { value: 'umbral', label: 'Umbral' },
      { value: 'perfilumbral', label: 'Perfil Umbral' },
      { value: 'audit_log_umbral', label: 'Audit Log Umbral' },
      { value: 'criticidad', label: 'Criticidad' }
    ],
    
    // Grupo 4: Comunicación y usuarios
    group4: [
      { value: 'medio', label: 'Medio' },
      { value: 'contacto', label: 'Contacto' },
      { value: 'usuario', label: 'Usuario' },
      { value: 'usuarioperfil', label: 'Usuario Perfil' },
      { value: 'perfil', label: 'Perfil' }
    ]
  };

  // Función para manejar la selección de tabla
  const handleTableSelect = (tableValue: string) => {
    console.log('🔄 ProtectedTableSelector clicked - PREVENTING default behavior');
    
    // Si el modal ya está abierto, no hacer nada
    if (isModalOpen) {
      console.log('🔄 Modal already open, ignoring click');
      return;
    }
    
    // Si es la misma tabla, no hacer nada
    if (tableValue === selectedTable) {
      setIsOpen(false);
      return;
    }

    // Verificar si hay cambios sin guardar
    const hasChanges = hasSignificantChanges(formData, selectedTable, activeSubTab, multipleData, massiveFormData);
    
    console.log('🔄 hasChanges result for parameter change:', hasChanges);
    
    if (hasChanges) {
      console.log('🔄 Showing modal for parameter change - PREVENTING parameter change');
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar el parámetro
      showModal(
        'parameter',
        selectedTable,
        tableValue,
        () => {
          console.log('🔄 Confirming parameter change to:', tableValue);
          setIsModalOpen(false);
          // Solo cambiar el parámetro DESPUÉS de confirmar
          onTableSelect(tableValue);
          setIsOpen(false);
        },
        () => {
          console.log('🔄 Parameter change cancelled, staying in:', selectedTable);
          setIsModalOpen(false);
          // No hacer nada, quedarse en el parámetro actual
          setIsOpen(false);
        }
      );
    } else {
      console.log('🔄 No changes, proceeding with parameter change');
      // No hay cambios, proceder normalmente
      onTableSelect(tableValue);
      setIsOpen(false);
    }
  };

  // Función para determinar a qué grupo pertenece una tabla
  const getTableGroup = (tableValue: string): keyof typeof tableGroups | null => {
    for (const [groupKey, tables] of Object.entries(tableGroups)) {
      if (tables.some(table => table.value === tableValue)) {
        return groupKey as keyof typeof tableGroups;
      }
    }
    return null;
  };

  // Función para generar las tablas ordenadas
  const getOrderedTables = (): Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }> => {
    const selectedGroup = selectedTable ? getTableGroup(selectedTable) : null;
    
    if (!selectedGroup) {
      // Si no hay selección, mostrar orden por defecto
      return [
        ...tableGroups.group1,
        { value: 'separator1', label: '───────────────', disabled: true },
        ...tableGroups.group2,
        { value: 'separator2', label: '───────────────', disabled: true },
        ...tableGroups.group3,
        { value: 'separator3', label: '───────────────', disabled: true },
        ...tableGroups.group4
      ];
    }

    // Reordenar para que el grupo seleccionado aparezca primero
    const orderedGroups: Array<{
      value: string;
      label: string;
      disabled?: boolean;
    }> = [];
    
    // Agregar el grupo seleccionado primero
    orderedGroups.push(...tableGroups[selectedGroup]);
    
    // Agregar los demás grupos en orden con separadores
    const remainingGroups = Object.entries(tableGroups).filter(([groupKey]) => groupKey !== selectedGroup);
    
    remainingGroups.forEach(([groupKey, tables], index) => {
      // Agregar separador antes de cada grupo (excepto el primero)
      if (index === 0) {
        orderedGroups.push({ value: `separator_${index}`, label: '───────────────', disabled: true });
      }
      orderedGroups.push(...tables);
      
      // Agregar separador después de cada grupo (excepto el último)
      if (index < remainingGroups.length - 1) {
        orderedGroups.push({ value: `separator_${index + 1}`, label: '───────────────', disabled: true });
      }
    });
    
    return orderedGroups;
  };

  const tables = getOrderedTables();
  const selectedOption = tables.find(table => table.value === selectedTable);
  const filteredTables = tables.filter(table => 
    table.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTableSelect('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Botón principal */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:bg-neutral-700 transition-colors flex items-center justify-between font-mono"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className={`${selectedOption ? 'text-white' : 'text-neutral-400'} truncate tracking-wider`}>
              {selectedOption ? selectedOption.label.toUpperCase() : 'SELECCIONAR'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {selectedOption && (
              <span
                onClick={handleClear}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
            {/* Barra de búsqueda */}
            <div className="p-2 border-b border-neutral-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH..."
                className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                autoFocus
              />
            </div>
            
            {/* Lista de opciones */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredTables.length > 0 ? (
                filteredTables.map((table) => (
                  <button
                    key={table.value}
                    onClick={() => !table.disabled && handleTableSelect(table.value)}
                    disabled={table.disabled}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                      table.disabled 
                        ? 'text-neutral-400 bg-neutral-800 cursor-not-allowed' 
                        : selectedOption?.value === table.value 
                          ? 'bg-orange-500 text-white' 
                          : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {table.label.toUpperCase()}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-neutral-400 font-mono">
                  NO RESULTS
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay para cerrar el dropdown */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProtectedTableSelector;
