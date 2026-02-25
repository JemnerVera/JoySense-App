import React from 'react';
import DynamicHierarchy from './ParametersHierarchy';

interface DashboardMainProps {
  selectedPais?: any;
  selectedEmpresa?: any;
  selectedFundo?: any;
  selectedUbicacion?: any;
  startDate?: string;
  endDate?: string;
  onFundoChange?: (fundo: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  onDateFilter?: (start: string, end: string) => void;
  onResetFilters?: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  selectedPais,
  selectedEmpresa,
  selectedFundo,
  selectedUbicacion,
  startDate,
  endDate,
  onFundoChange,
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
        selectedUbicacion={selectedUbicacion}
        startDate={startDate}
        endDate={endDate}
        onFundoChange={onFundoChange}
        onUbicacionChange={onUbicacionChange}
        onDateFilter={onDateFilter}
        onResetFilters={onResetFilters}
      />
    </div>
  );
};

export default DashboardMain;