// ============================================================================
// IMPORTS
// ============================================================================

import React, { useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import NormalInsertForm from '../../NormalInsertForm';
import PerfilGeografiaPermisoForm from '../../PerfilGeografiaPermisoForm';
// import MultipleSensorForm from '../../MultipleSensorForm';
// import MultipleMetricaSensorForm from '../../MultipleMetricaSensorForm';
// import MultipleUsuarioPerfilForm from '../../MultipleUsuarioPerfilForm';
import InsertionMessage from '../../InsertionMessage';
import { MessageDisplay } from '../MessageDisplay';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface InsertTabProps {
  tableName: string;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateFormField?: (field: string, value: any) => void;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  message?: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null;
  // Datos relacionados
  relatedData?: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    localizacionesData?: any[];
    entidadesData?: any[];
    nodosData?: any[];
    tiposData?: any[];
    metricasData?: any[];
    criticidadesData?: any[];
    perfilesData?: any[];
    userData?: any[];
  };
  // Columnas visibles
  visibleColumns?: any[];
  // Funciones auxiliares
  getColumnDisplayName?: (columnName: string) => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Para formularios especiales
  multipleSensors?: any[];
  setMultipleSensors?: (sensors: any[]) => void;
  multipleMetricas?: any[];
  setMultipleMetricas?: (metricas: any[]) => void;
  multipleUsuarioPerfiles?: any[];
  setMultipleUsuarioPerfiles?: (perfiles: any[]) => void;
  insertedRecords?: Array<{ id: string; fields: Record<string, any> }>;
  onClearInsertedRecords?: () => void;
  // Para contacto
  selectedContactType?: 'phone' | 'email' | null;
  countryCodes?: any[];
  resetContactType?: () => void;
  // Para sensor
  onPasteFromClipboard?: () => void;
  onReplicateClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InsertTab: React.FC<InsertTabProps> = ({
  tableName,
  formData,
  setFormData,
  updateFormField,
  loading,
  onInsert,
  onCancel,
  message,
  relatedData = {},
  visibleColumns = [],
  getColumnDisplayName,
  getUniqueOptionsForField,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  multipleSensors = [],
  setMultipleSensors,
  multipleMetricas = [],
  setMultipleMetricas,
  multipleUsuarioPerfiles = [],
  setMultipleUsuarioPerfiles,
  insertedRecords = [],
  onClearInsertedRecords,
  selectedContactType,
  countryCodes,
  resetContactType,
  onPasteFromClipboard,
  onReplicateClick
}) => {
  const { t } = useLanguage();

  // Función helper para obtener nombre de columna
  const getColumnDisplayNameHelper = useMemo(() => {
    return getColumnDisplayName || ((columnName: string) => 
      getColumnDisplayNameTranslated(columnName, t)
    );
  }, [getColumnDisplayName, t]);

  // Función helper para obtener opciones únicas (placeholder si no se proporciona)
  const getUniqueOptionsForFieldHelper = useMemo(() => {
    return getUniqueOptionsForField || (() => []);
  }, [getUniqueOptionsForField]);

  // Determinar qué formulario renderizar según la tabla
  const renderForm = () => {
    // Formulario especializado para perfil_geografia_permiso
    if (tableName === 'perfil_geografia_permiso') {
      return (
        <PerfilGeografiaPermisoForm
          formData={formData}
          setFormData={setFormData}
          updateFormField={updateFormField}
          loading={loading}
          onInsert={onInsert}
          onCancel={onCancel}
          perfilesData={relatedData.perfilesData}
          paisesData={relatedData.paisesData}
          empresasData={relatedData.empresasData}
          fundosData={relatedData.fundosData}
          ubicacionesData={relatedData.ubicacionesData}
          getUniqueOptionsForField={getUniqueOptionsForFieldHelper}
        />
      );
    }

    // Formulario normal para todas las demás tablas
    return (
      <NormalInsertForm
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        updateFormField={updateFormField}
        selectedTable={tableName}
        loading={loading}
        onInsert={onInsert}
        onCancel={onCancel}
        getColumnDisplayName={getColumnDisplayNameHelper}
        getUniqueOptionsForField={getUniqueOptionsForFieldHelper}
        onPasteFromClipboard={onPasteFromClipboard}
        onReplicateClick={onReplicateClick}
        paisSeleccionado={paisSeleccionado}
        empresaSeleccionada={empresaSeleccionada}
        fundoSeleccionado={fundoSeleccionado}
        paisesData={relatedData.paisesData}
        empresasData={relatedData.empresasData}
        fundosData={relatedData.fundosData}
        selectedContactType={selectedContactType}
        countryCodes={countryCodes}
        resetContactType={resetContactType}
      />
    );
  };

  return (
    <div className="relative">
      {/* NOTA: El mensaje se muestra en SystemParameters.tsx, no aquí para evitar duplicación */}
      
      {/* Mensaje de registros insertados */}
      {insertedRecords.length > 0 && onClearInsertedRecords && (
        <InsertionMessage
          insertedRecords={insertedRecords}
          tableName={tableName}
          onClear={onClearInsertedRecords}
          nodosData={relatedData.nodosData || []}
          tiposData={relatedData.tiposData || []}
          ubicacionesData={relatedData.ubicacionesData || []}
          entidadesData={relatedData.entidadesData || []}
          paisesData={relatedData.paisesData || []}
          empresasData={relatedData.empresasData || []}
          fundosData={relatedData.fundosData || []}
          metricasData={relatedData.metricasData || []}
          criticidadesData={relatedData.criticidadesData || []}
          perfilesData={relatedData.perfilesData || []}
          userData={relatedData.userData || []}
        />
      )}

      {/* Formulario */}
      {renderForm()}
    </div>
  );
};
