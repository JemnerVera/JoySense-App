// ============================================================================
// IMPORTS
// ============================================================================

import React, { useMemo, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { NormalInsertForm } from '../../../components/shared/forms';
import { LoadingSpinner } from '../LoadingSpinner';
import { logger } from '../../../utils/logger';
import InsertionMessage from '../../../components/shared/ui/messages/InsertionMessage';
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
    reglasData?: any[];
    fuentesData?: any[];
    userData?: any[];
    codigotelefonosData?: any[];
    contactosData?: any[];
    correosData?: any[];
    canalesData?: any[];
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
  // Para regla_perfil
  reglasData?: any[];
  // Tema de color
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
  // Key para forzar re-mount
  resetKey?: string;
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
  onReplicateClick,
  themeColor = 'orange',
  resetKey,
  // Props para regla_perfil
  reglasData
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

    // Formulario normal para todas las tablas
    // Usar una key que incluya tableName y resetKey para forzar re-mount cuando se resetea
    return (
      <NormalInsertForm
        key={`normal-insert-${tableName}-${resetKey || '0'}`}
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
        paisesData={relatedData.paisesData || []}
        empresasData={relatedData.empresasData || []}
        fundosData={relatedData.fundosData || []}
        ubicacionesData={relatedData.ubicacionesData || []}
        codigotelefonosData={relatedData.codigotelefonosData}
        contactosData={relatedData.contactosData}
        correosData={relatedData.correosData}
        canalesData={relatedData.canalesData}
        perfilesData={relatedData.perfilesData || []}
        nodosData={relatedData.nodosData || []}
        localizacionesData={relatedData.localizacionesData || []}
        fuentesData={relatedData.fuentesData || []}
        reglasData={reglasData || relatedData.reglasData || []}
        selectedContactType={selectedContactType}
        countryCodes={countryCodes}
        resetContactType={resetContactType}
        themeColor={themeColor}
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
      {/* Usar key para forzar re-mount completo cuando cambia la tabla o sub-tab, limpiando todo el estado interno */}
      {visibleColumns.length > 0 || loading ? (
        <div key={`insert-form-${tableName}`}>
          {renderForm()}
        </div>
      ) : (
        <LoadingSpinner message="Cargando columnas del formulario..." />
      )}
    </div>
  );
};
