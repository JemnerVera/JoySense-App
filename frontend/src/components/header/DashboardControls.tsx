import React, { useState, useRef, useEffect } from 'react';

interface DashboardControlsProps {
  paises: any[];
  empresas: any[];
  selectedPais: any;
  selectedEmpresa: any;
  onPaisChange: (pais: any) => void;
  onEmpresaChange: (empresa: any) => void;
  onResetFilters: () => void;
  fundos?: any[];
  ubicaciones?: any[];
  selectedFundo?: any;
  selectedUbicacion?: any;
  onFundoChange?: (fundo: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  startDate?: string;
  endDate?: string;
  onDateFilter?: (start: string, end: string) => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  selectedPais,
  selectedEmpresa,
  onResetFilters,
  fundos = [],
  ubicaciones = [],
  selectedFundo,
  selectedUbicacion,
  onFundoChange,
  onUbicacionChange,
  startDate = '',
  endDate = '',
  onDateFilter
}) => {
  console.log('🔍 DashboardControls - Props recibidas:', {
    selectedPais: !!selectedPais,
    selectedEmpresa: !!selectedEmpresa,
    fundos: fundos.length,
    ubicaciones: ubicaciones.length,
    selectedFundo: !!selectedFundo,
    selectedUbicacion: !!selectedUbicacion
  });
  
  // Debug específico para el problema de ubicaciones
  console.log('🔍 DashboardControls - Debug ubicaciones:', {
    selectedFundo: selectedFundo,
    ubicaciones: ubicaciones,
    condicionUbicacion: !!(selectedPais && selectedEmpresa && selectedFundo)
  });
  // Función helper para formatear fechas correctamente
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Agregar 1 día para corregir el offset
      date.setDate(date.getDate() + 1);
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'short' });
      return `${day} ${month}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  const [isFundoDropdownOpen, setIsFundoDropdownOpen] = useState(false);
  const [isUbicacionDropdownOpen, setIsUbicacionDropdownOpen] = useState(false);
  const [isFechasDropdownOpen, setIsFechasDropdownOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  
  const fundoDropdownRef = useRef<HTMLDivElement>(null);
  const ubicacionDropdownRef = useRef<HTMLDivElement>(null);
  const fechasDropdownRef = useRef<HTMLDivElement>(null);

  // Sincronizar fechas locales con props
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fundoDropdownRef.current && !fundoDropdownRef.current.contains(event.target as Node)) {
        setIsFundoDropdownOpen(false);
      }
      if (ubicacionDropdownRef.current && !ubicacionDropdownRef.current.contains(event.target as Node)) {
        setIsUbicacionDropdownOpen(false);
      }
      if (fechasDropdownRef.current && !fechasDropdownRef.current.contains(event.target as Node)) {
        setIsFechasDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFundoDropdown = () => {
    setIsFundoDropdownOpen(!isFundoDropdownOpen);
    setIsUbicacionDropdownOpen(false);
    setIsFechasDropdownOpen(false);
  };

  const toggleUbicacionDropdown = () => {
    setIsUbicacionDropdownOpen(!isUbicacionDropdownOpen);
    setIsFundoDropdownOpen(false);
    setIsFechasDropdownOpen(false);
  };

  const toggleFechasDropdown = () => {
    setIsFechasDropdownOpen(!isFechasDropdownOpen);
    setIsFundoDropdownOpen(false);
    setIsUbicacionDropdownOpen(false);
  };

  const handleFundoSelect = (fundo: any) => {
    if (onFundoChange) {
      onFundoChange(fundo);
    }
    setIsFundoDropdownOpen(false);
  };

  const handleUbicacionSelect = (ubicacion: any) => {
    if (onUbicacionChange) {
      onUbicacionChange(ubicacion);
    }
    setIsUbicacionDropdownOpen(false);
  };

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setLocalStartDate(newStartDate);
    setLocalEndDate(newEndDate);
    if (onDateFilter) {
      onDateFilter(newStartDate, newEndDate);
    }
    
    // NO cerrar automáticamente el dropdown - el usuario debe cerrarlo manualmente
    // o seleccionar explícitamente una fecha
  };

  const handleResetFilters = () => {
    // Mostrar el modal de confirmación directamente aquí
    setShowResetConfirmation(true);
  };

  const confirmReset = () => {
    // Llamar a la función del padre para limpiar los estados
    if (onResetFilters) onResetFilters();
    
    // Cerrar todos los dropdowns
    setIsFundoDropdownOpen(false);
    setIsUbicacionDropdownOpen(false);
    setIsFechasDropdownOpen(false);
    setShowResetConfirmation(false);
    
    // Limpiar fechas locales
    setLocalStartDate('');
    setLocalEndDate('');
  };

  const cancelReset = () => {
    setShowResetConfirmation(false);
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Solo mostrar filtros específicos del dashboard, no los filtros globales */}
        <div className="text-sm text-gray-400">
          Dashboard - Usa los filtros globales en el sidebar
        </div>
      </div>

      {/* Modal de confirmación para reiniciar */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-6">⚠️</div>
              <p className="text-gray-300 mb-8 text-lg">
                ¿Estás a punto de borrar los parámetros. ¿Estás seguro de continuar?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={confirmReset}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sí
                </button>
                <button
                  onClick={cancelReset}
                  className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
