// ============================================================================
// COMPONENT: MassiveOperationsRenderer - Renderizador de operaciones masivas
// ============================================================================

import React from 'react';
import { MassiveUmbralForm, MassiveLocalizacionForm } from '../../../components/shared/forms';
// import { MassiveSensorForm } from '../../../components/shared/forms';
// import { MassiveMetricaSensorForm } from '../../../components/shared/forms';

interface MassiveOperationsRendererProps {
  selectedTable: string;
  config: any;
  formState: {
    isSubmitting: boolean;
  };
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;
  getEmpresaName: (empresaId: string) => string;
  getFundoName: (fundoId: string) => string;
  onFormDataChange?: (massiveFormData: Record<string, any>) => void;
  localizacionesData?: any[];
  entidadesData?: any[];
}

export const MassiveOperationsRenderer: React.FC<MassiveOperationsRendererProps> = ({
  selectedTable,
  config,
  formState,
  getUniqueOptionsForField,
  onApply,
  onCancel,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName,
  onFormDataChange,
  localizacionesData,
  entidadesData
}) => {
  if (!config?.allowMassive) return null;

  // Si es la tabla umbral, renderizar el formulario masivo
  if (selectedTable === 'umbral') {
    return (
      <MassiveUmbralForm
        getUniqueOptionsForField={getUniqueOptionsForField}
        onApply={onApply}
        onCancel={onCancel}
        loading={formState.isSubmitting}
        paisSeleccionado={paisSeleccionado}
        empresaSeleccionada={empresaSeleccionada}
        fundoSeleccionado={fundoSeleccionado}
        getPaisName={getPaisName}
        getEmpresaName={getEmpresaName}
        getFundoName={getFundoName}
        onFormDataChange={onFormDataChange}
        localizacionesData={localizacionesData || []}
      />
    );
  }

  // Si es la tabla sensor, renderizar el formulario masivo de sensores
  if (selectedTable === 'sensor') {
    // return (
    //   <MassiveSensorForm
    //     getUniqueOptionsForField={getUniqueOptionsForField}
    //     onApply={onApply}
    //     onCancel={onCancel}
    //     loading={formState.isSubmitting}
    //     entidadesData={entidadesData || []}
    //   />
    // );
    return <div>Formulario sensor masivo no disponible temporalmente</div>;
  }

  // Si es la tabla localizacion, renderizar el formulario masivo de localizaciones
  if (selectedTable === 'localizacion') {
    return (
      <MassiveLocalizacionForm
        getUniqueOptionsForField={getUniqueOptionsForField}
        onApply={onApply}
        onCancel={onCancel}
        loading={formState.isSubmitting}
        paisSeleccionado={paisSeleccionado}
        empresaSeleccionada={empresaSeleccionada}
        fundoSeleccionado={fundoSeleccionado}
        getPaisName={getPaisName}
        getEmpresaName={getEmpresaName}
        getFundoName={getFundoName}
        onFormDataChange={onFormDataChange}
      />
    );
  }

  // Si es la tabla metricasensor, renderizar el formulario masivo de metricasensor
  if (selectedTable === 'metricasensor') {
    // return (
    //   <MassiveMetricaSensorForm
    //     getUniqueOptionsForField={getUniqueOptionsForField}
    //     onApply={onApply}
    //     onCancel={onCancel}
    //     loading={formState.isSubmitting}
    //     onFormDataChange={onFormDataChange}
    //   />
    // );
    return <div>Formulario métrica sensor masivo no disponible temporalmente</div>;
  }

  // Para otras tablas, mostrar mensaje de "próximamente"
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Operaciones Masivas
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Las operaciones masivas para {config.displayName} estarán disponibles próximamente.
      </p>
    </div>
  );
};

