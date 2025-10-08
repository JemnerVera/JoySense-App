import React from 'react';
import DynamicHierarchy from './ParametersHierarchy';

interface DashboardMainProps {
  selectedPais?: any;
  selectedEmpresa?: any;
  selectedFundo?: any;
  selectedEntidad?: any;
  selectedUbicacion?: any;
  startDate?: string;
  endDate?: string;
  onFundoChange?: (fundo: any) => void;
  onEntidadChange?: (entidad: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  onDateFilter?: (start: string, end: string) => void;
  onResetFilters?: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  selectedPais,
  selectedEmpresa,
  selectedFundo,
  selectedEntidad,
  selectedUbicacion,
  startDate,
  endDate,
  onFundoChange,
  onEntidadChange,
  onUbicacionChange,
  onDateFilter,
  onResetFilters
}) => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-black min-h-screen">
      {/* Dashboard con jerarquía dinámica */}
      <DynamicHierarchy
        selectedPais={selectedPais}
        selectedEmpresa={selectedEmpresa}
        selectedFundo={selectedFundo}
        selectedEntidad={selectedEntidad}
        selectedUbicacion={selectedUbicacion}
        startDate={startDate}
        endDate={endDate}
        onFundoChange={onFundoChange}
        onEntidadChange={onEntidadChange}
        onUbicacionChange={onUbicacionChange}
        onDateFilter={onDateFilter}
        onResetFilters={onResetFilters}
      />
    </div>
  );
};

export default DashboardMain;